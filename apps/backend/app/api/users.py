"""
User/Auth Router
Handles user profile creation on signup
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import logging
from uuid import UUID
import random
import hashlib

from app.database import get_db
from app.models.user import UserProfile, DonorProfile, BeneficiaryProfile, VendorProfile, GenderEnum
from app.schemas.user import (
    UserSignUpRequest,
    UserSignUpResponse,
    UserProfileUpdateRequest,
    UserProfileResponse,
    UserRole,
    PublicVendorResponse
)

def get_default_vendor_metrics(user_id: UUID | str) -> tuple[float, int]:
    seed = int(hashlib.sha256(str(user_id).encode()).hexdigest(), 16)
    random.seed(seed)
    rating = round(random.uniform(4.5, 5.0), 1)
    trx = random.randint(300, 2000)
    return rating, trx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


def _resolve_user_role(db: Session, user_id: UUID) -> UserRole | None:
    """Resolve user role from role-specific profile tables."""
    donor_profile = db.query(DonorProfile).filter(DonorProfile.user_id == user_id).first()
    if donor_profile:
        if donor_profile.corporate_name:
            return "corporate_donor"
        return "donor"

    if db.query(BeneficiaryProfile).filter(BeneficiaryProfile.user_id == user_id).first():
        return "beneficiary"

    if db.query(VendorProfile).filter(VendorProfile.user_id == user_id).first():
        return "vendor"

    return None


def _build_user_profile_response(db: Session, user_profile: UserProfile) -> UserProfileResponse:
    resolved_role = _resolve_user_role(db, user_profile.user_id)
    gender_value = user_profile.gender.value if user_profile.gender else None
    vendor_profile = None
    if resolved_role == "vendor":
        vendor_profile = db.query(VendorProfile).filter(VendorProfile.user_id == user_profile.user_id).first()

    return UserProfileResponse(
        id=user_profile.id,
        user_id=user_profile.user_id,
        full_name=user_profile.full_name,
        role=resolved_role,
        phone=user_profile.phone,
        address=user_profile.address,
        date_of_birth=user_profile.date_of_birth,
        gender=gender_value,
        avatar_url=user_profile.avatar_url,
        store_name=vendor_profile.store_name if vendor_profile else None,
        store_address=vendor_profile.store_address if vendor_profile else None,
        store_image_url=vendor_profile.store_image_url if vendor_profile else None,
        operating_hours=vendor_profile.operating_hours if vendor_profile else None,
        rating=float(vendor_profile.rating) if vendor_profile and vendor_profile.rating else (
            get_default_vendor_metrics(user_profile.user_id)[0] if resolved_role == "vendor" else None
        ),
        total_transactions=vendor_profile.total_transactions if vendor_profile else (
            get_default_vendor_metrics(user_profile.user_id)[1] if resolved_role == "vendor" else None
        ),
        bank_name=vendor_profile.bank_name if vendor_profile else None,
        bank_account_number=vendor_profile.bank_account_number if vendor_profile else None,
        bank_account_holder=vendor_profile.bank_account_holder if vendor_profile else None,
        created_at=user_profile.created_at,
        updated_at=user_profile.updated_at,
    )


@router.get("/public/vendors", response_model=list[PublicVendorResponse])
async def get_public_vendors(db: Session = Depends(get_db)):
    """
    Get a list of all approved vendors for public display.
    No authentication required.
    """
    vendors = db.query(VendorProfile).filter(
        VendorProfile.approval_status == "approved",
        VendorProfile.is_active.is_(True)
    ).order_by(VendorProfile.created_at.desc()).all()
    
    # We map it manually to match the schema
    result = []
    for v in vendors:
        # Generate deterministic pseudo-random default values based on user_id
        default_rating, default_trx = get_default_vendor_metrics(v.user_id)

        result.append(PublicVendorResponse(
            store_name=v.store_name or "Warung SeribuAsa",
            store_address=v.store_address or "Indonesia",
            join_date=v.created_at,
            store_image_url=v.store_image_url or "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
            operating_hours=v.operating_hours or "Setiap Hari: 08.00 - 20.00",
            rating=float(v.rating) if v.rating else default_rating,
            total_transactions=v.total_transactions or default_trx
        ))
    
    return result


@router.post("/signup", response_model=UserSignUpResponse, status_code=status.HTTP_201_CREATED)
async def create_user_on_signup(
    user_data: UserSignUpRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new user profile after Supabase signup.
    Called by frontend after successful Supabase authentication.
    
    This endpoint:
    1. Creates a user_profiles entry
    2. Creates role-specific profile (donor_profiles, beneficiary_profiles, or vendor_profiles)
    """
    logger.info(f"[SIGNUP] Starting signup for user: {user_data.user_id}, role: {user_data.role}, name: {user_data.full_name}")
    
    try:
        # Check if user already exists
        logger.info(f"[SIGNUP] Checking if user already exists: {user_data.user_id}")
        existing_user = db.query(UserProfile).filter(
            UserProfile.user_id == user_data.user_id
        ).first()
        
        if existing_user:
            logger.warning(f"[SIGNUP] User already exists: {user_data.user_id}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User profile already exists for this user ID"
            )
        
        # Create base user profile
        logger.info(f"[SIGNUP] Creating user_profile for: {user_data.user_id}")
        user_profile = UserProfile(
            user_id=user_data.user_id,
            full_name=user_data.full_name,
            phone=user_data.phone,
            address=user_data.address,
        )
        db.add(user_profile)
        db.flush()  # Flush to ensure the profile is created before adding role-specific profiles
        logger.info(f"[SIGNUP] user_profile flushed successfully for: {user_data.user_id}")
        
        # Create role-specific profile
        if user_data.role == "donor" or user_data.role == "corporate_donor":
            logger.info(f"[SIGNUP] Creating donor_profile for user {user_data.user_id}")
            donor_profile = DonorProfile(
                user_id=user_data.user_id,
                total_donated=0,
                children_sponsored=0,
                subscription_status="inactive"
            )
            db.add(donor_profile)
            logger.info(f"[SIGNUP] donor_profile added for user {user_data.user_id}")
        
        elif user_data.role == "beneficiary":
            logger.info(f"[SIGNUP] Creating beneficiary_profile for user {user_data.user_id}")
            beneficiary_profile = BeneficiaryProfile(
                user_id=user_data.user_id,
                family_size=1,
                vouchers_balance=0
            )
            db.add(beneficiary_profile)
            logger.info(f"[SIGNUP] beneficiary_profile added for user {user_data.user_id}")
        
        elif user_data.role == "vendor":
            logger.info(f"[SIGNUP] Creating vendor_profile for user {user_data.user_id}")
            vendor_profile = VendorProfile(
                user_id=user_data.user_id,
                store_name=user_data.full_name,  # Use full_name as default store name
                store_address="",
                approval_status="pending"
            )
            db.add(vendor_profile)
            logger.info(f"[SIGNUP] vendor_profile added for user {user_data.user_id}")

        elif user_data.role in {"admin", "government"}:
            # Admin/government users only need the base user_profile.
            # Their authorization role comes from Supabase metadata/JWT.
            logger.info(f"[SIGNUP] Base profile only for privileged role {user_data.role}")
        
        else:
            logger.warning(f"[SIGNUP] Unknown role: {user_data.role}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown role: {user_data.role}"
            )
        
        # Commit all changes
        logger.info(f"[SIGNUP] Committing all changes for user {user_data.user_id}")
        db.commit()
        
        logger.info(f"[SIGNUP] ✓ User profile created successfully for {user_data.user_id} with role {user_data.role}")
        
        return UserSignUpResponse(
            user_id=user_data.user_id,
            full_name=user_data.full_name,
            role=user_data.role,
            message="User created successfully"
        )
    
    except HTTPException:
        db.rollback()
        raise
    
    except IntegrityError as e:
        db.rollback()
        logger.error(f"[SIGNUP] IntegrityError creating user profile for {user_data.user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User profile creation failed: {str(e.orig)}"
        )
    
    except Exception as e:
        db.rollback()
        logger.error(f"[SIGNUP] Unexpected error creating user profile for {user_data.user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user profile: {str(e)}"
        )


@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    """Get user profile by user ID"""
    user_profile = db.query(UserProfile).filter(
        UserProfile.user_id == user_id
    ).first()
    
    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )

    return _build_user_profile_response(db, user_profile)


@router.patch("/{user_id}", response_model=UserProfileResponse)
async def update_user_profile(
    user_id: UUID,
    update_data: UserProfileUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update existing user profile fields."""
    user_profile = db.query(UserProfile).filter(
        UserProfile.user_id == user_id
    ).first()

    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )

    payload = update_data.model_dump(exclude_unset=True)
    if not payload:
        return _build_user_profile_response(db, user_profile)

    if "full_name" in payload:
        full_name = (payload.get("full_name") or "").strip()
        if not full_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="full_name cannot be empty"
            )
        user_profile.full_name = full_name

    if "phone" in payload:
        phone = payload.get("phone")
        user_profile.phone = phone.strip() if isinstance(phone, str) and phone.strip() else None

    if "address" in payload:
        address = payload.get("address")
        user_profile.address = address.strip() if isinstance(address, str) and address.strip() else None

    if "date_of_birth" in payload:
        user_profile.date_of_birth = payload.get("date_of_birth")

    if "gender" in payload:
        gender = payload.get("gender")
        user_profile.gender = GenderEnum(gender) if gender else None

    vendor_fields = {"bank_name", "bank_account_number", "bank_account_holder", "store_name", "store_address", "store_image_url", "operating_hours"}
    if vendor_fields.intersection(payload):
        vendor_profile = db.query(VendorProfile).filter(VendorProfile.user_id == user_id).first()
        if not vendor_profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Store and bank account fields are only available for vendor profiles"
            )

        if "store_name" in payload:
            store_name = payload.get("store_name")
            if store_name is not None and not store_name.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="store_name cannot be empty"
                )
            vendor_profile.store_name = store_name.strip() if store_name else ""

        if "store_address" in payload:
            store_address = payload.get("store_address")
            vendor_profile.store_address = store_address.strip() if isinstance(store_address, str) and store_address.strip() else ""

        if "store_image_url" in payload:
            store_image_url = payload.get("store_image_url")
            vendor_profile.store_image_url = store_image_url.strip() if isinstance(store_image_url, str) and store_image_url.strip() else None

        if "operating_hours" in payload:
            operating_hours = payload.get("operating_hours")
            vendor_profile.operating_hours = operating_hours.strip() if isinstance(operating_hours, str) and operating_hours.strip() else None

        if "bank_name" in payload:
            bank_name = payload.get("bank_name")
            vendor_profile.bank_name = bank_name.strip() if isinstance(bank_name, str) and bank_name.strip() else None

        if "bank_account_number" in payload:
            account_number = payload.get("bank_account_number")
            vendor_profile.bank_account_number = (
                account_number.strip() if isinstance(account_number, str) and account_number.strip() else None
            )

        if "bank_account_holder" in payload:
            account_holder = payload.get("bank_account_holder")
            vendor_profile.bank_account_holder = (
                account_holder.strip() if isinstance(account_holder, str) and account_holder.strip() else None
            )

    try:
        db.commit()
        db.refresh(user_profile)
    except Exception as exc:
        db.rollback()
        logger.error(f"[PROFILE] Failed to update user profile {user_id}: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        ) from exc

    return _build_user_profile_response(db, user_profile)
