"""
User/Auth Router
Handles user profile creation on signup
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import logging

from app.database import get_db
from app.models.user import UserProfile, DonorProfile, BeneficiaryProfile, VendorProfile
from app.schemas.user import (
    UserSignUpRequest,
    UserSignUpResponse,
    UserProfileResponse,
    UserRole
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


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
    try:
        # Check if user already exists
        existing_user = db.query(UserProfile).filter(
            UserProfile.user_id == user_data.user_id
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User profile already exists for this user ID"
            )
        
        # Create base user profile
        user_profile = UserProfile(
            user_id=user_data.user_id,
            full_name=user_data.full_name
        )
        db.add(user_profile)
        db.flush()  # Flush to ensure the profile is created before adding role-specific profiles
        
        # Create role-specific profile
        if user_data.role == "donor" or user_data.role == "corporate_donor":
            donor_profile = DonorProfile(
                user_id=user_data.user_id,
                total_donated=0,
                children_sponsored=0,
                subscription_status="inactive"
            )
            db.add(donor_profile)
            logger.info(f"Created donor profile for user {user_data.user_id}")
        
        elif user_data.role == "beneficiary":
            beneficiary_profile = BeneficiaryProfile(
                user_id=user_data.user_id,
                family_size=1,
                vouchers_balance=0
            )
            db.add(beneficiary_profile)
            logger.info(f"Created beneficiary profile for user {user_data.user_id}")
        
        elif user_data.role == "vendor":
            vendor_profile = VendorProfile(
                user_id=user_data.user_id,
                store_name=user_data.full_name,  # Use full_name as default store name
                store_address="",
                approval_status="pending"
            )
            db.add(vendor_profile)
            logger.info(f"Created vendor profile for user {user_data.user_id}")
        
        # Commit all changes
        db.commit()
        
        logger.info(f"User profile created successfully for {user_data.user_id} with role {user_data.role}")
        
        return UserSignUpResponse(
            user_id=user_data.user_id,
            full_name=user_data.full_name,
            role=user_data.role,
            message="User created successfully"
        )
    
    except IntegrityError as e:
        db.rollback()
        logger.error(f"IntegrityError creating user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User profile creation failed due to constraint violation"
        )
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user profile"
        )


@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: str,
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
    
    return user_profile
