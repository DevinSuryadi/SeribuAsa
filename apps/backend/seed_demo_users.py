"""
Demo User Seeder for SeribuAsa
Creates 3 demo users (Donor, Beneficiary, Vendor) with complete data for demo
Usage: python seed_demo_users.py
"""
import os
import sys
from decimal import Decimal
from datetime import datetime, timedelta, date
from uuid import uuid4
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client, Client  # noqa: E402
from dotenv import load_dotenv  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ydglsytahhjdoznvnfnc.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZ2xzeXRhaGhqZG96bnZuZm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE5MzYyNiwiZXhwIjoyMDkwNzY5NjI2fQ.rPQJ7ktYpvxdQYWWZkHJz7m2Cwu3YvDypqzwBizRlis")

# Demo user configuration
DEMO_PASSWORD = "Demo123!"

DEMO_USERS = [
    {
        "email": "demo-donor@gmail.com",
        "role": "donor",
        "full_name": "Budi Santoso",
        "phone": "081234567890",
        "address": "Jl. Sudirman No. 123, Jakarta",
    },
    {
        "email": "demo-penerima@gmail.com",
        "role": "beneficiary",
        "full_name": "Ani Wijaya",
        "phone": "082345678901",
        "address": "Jl. Thamrin No. 45, Jakarta",
    },
    {
        "email": "demo-vendor@gmail.com",
        "role": "vendor",
        "full_name": "Pak Tarno",
        "phone": "083456789012",
        "address": "Jl. Gatot Subroto No. 67, Jakarta",
        "store_name": "Warung Sehat Jaya",
        "store_address": "Jl. Gatot Subroto No. 67, Jakarta",
    },
    {
        "email": "demo2-donor@gmail.com",
        "role": "donor",
        "full_name": "Siti Rahma",
        "phone": "081223344556",
        "address": "Jl. Kebon Kacang No. 10, Jakarta",
    },
    {
        "email": "demo2-penerima@gmail.com",
        "role": "beneficiary",
        "full_name": "Bapak Anton",
        "phone": "082334455667",
        "address": "Jl. Tanah Abang No. 15, Jakarta",
    },
    {
        "email": "demo2-vendor@gmail.com",
        "role": "vendor",
        "full_name": "Ibu Kartini",
        "phone": "083445566778",
        "address": "Pasar Senen Blok A",
        "store_name": "Toko Berkah Utama",
        "store_address": "Pasar Senen Blok A No. 12",
    }
]


def get_supabase_client() -> Client:
    """Create Supabase client with service role key"""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def check_auth_user_exists(supabase: Client, email: str):
    """Check if user exists in Supabase Auth"""
    try:
        # List users and check if email exists
        response = supabase.auth.admin.list_users()
        
        # Handle different response formats
        users = []
        if hasattr(response, 'users'):
            users = response.users
        elif isinstance(response, list):
            users = response
        elif hasattr(response, 'data'):
            users = response.data
        
        for user in users:
            user_email = getattr(user, 'email', None)
            if user_email and user_email.lower() == email.lower():
                user_id = getattr(user, 'id', None)
                logger.info(f"✓ Auth user exists: {email} (ID: {user_id})")
                return user
        return None
    except Exception as e:
        logger.error(f"Error checking auth user {email}: {e}")
        return None


def create_auth_user(supabase: Client, email: str, password: str) -> dict | None:
    """Create new user in Supabase Auth"""
    try:
        response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Auto-verify email
            "user_metadata": {"demo": True}
        })
        
        if response and response.user:
            logger.info(f"✓ Created auth user: {email} (ID: {response.user.id})")
            return response.user
        return None
    except Exception as e:
        logger.error(f"Error creating auth user {email}: {e}")
        return None


def seed_demo_data():
    """Main function to seed demo users"""
    logger.info("=" * 60)
    logger.info("🚀 SERIBUASA DEMO USER SEEDER")
    logger.info("=" * 60)
    
    # Initialize Supabase client
    try:
        supabase = get_supabase_client()
        logger.info(f"✓ Connected to Supabase: {SUPABASE_URL}")
    except Exception as e:
        logger.error(f"✗ Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    # Import database models
    try:
        from app.database import SessionLocal
        from app.models.user import UserProfile
        logger.info("✓ Database models imported")
    except Exception as e:
        logger.error(f"✗ Failed to import models: {e}")
        sys.exit(1)
    
    # Create database session
    db = SessionLocal()
    
    try:
        created_users = {}
        
        # Step 1: Create/Check Auth Users
        logger.info("\n📋 Step 1: Creating Supabase Auth Users...")
        for user_config in DEMO_USERS:
            email = user_config["email"]
            
            # Check if exists
            try:
                existing = check_auth_user_exists(supabase, email)
                if existing and existing.id:
                    created_users[email] = existing.id
                    logger.info(f"✓ Using existing auth user: {email}")
                    continue
            except Exception as e:
                logger.warning(f"⚠ Could not check existing user {email}: {e}")
            
            # Create new user
            try:
                new_user = create_auth_user(supabase, email, DEMO_PASSWORD)
                if new_user and new_user.id:
                    created_users[email] = new_user.id
                    logger.info(f"✓ Created new auth user: {email}")
                else:
                    logger.error(f"✗ Failed to create user: {email}")
            except Exception as e:
                logger.error(f"✗ Error creating user {email}: {e}")
                # Try to get user_id from existing users one more time
                try:
                    all_users = supabase.auth.admin.list_users()
                    for user in all_users.users:
                        if user.email and user.email.lower() == email.lower():
                            created_users[email] = user.id
                            logger.info(f"✓ Found existing user (retry): {email}")
                            break
                except Exception:
                    pass
        
        # Step 2: Seed Backend Database
        logger.info("\n📋 Step 2: Seeding Backend Database...")
        
        for user_config in DEMO_USERS:
            email = user_config["email"]
            user_id = created_users.get(email)
            
            if not user_id:
                logger.warning(f"⚠ Skipping {email} - no user_id")
                continue
            
            # Check if profile exists
            existing_profile = db.query(UserProfile).filter_by(user_id=user_id).first()
            if existing_profile:
                logger.info(f"✓ Profile exists for {email}, skipping backend seeding")
                continue
            
            logger.info(f"\n📝 Creating data for: {email} ({user_config['role']})")
            
            # Create UserProfile
            user_profile = UserProfile(
                user_id=user_id,
                full_name=user_config["full_name"],
                phone=user_config.get("phone"),
                address=user_config.get("address"),
            )
            db.add(user_profile)
            db.flush()
            
            if user_config["role"] == "donor":
                create_donor_data(db, user_id, user_config)
            elif user_config["role"] == "beneficiary":
                create_beneficiary_data(db, user_id, user_config)
            elif user_config["role"] == "vendor":
                create_vendor_data(db, user_id, user_config)
        
        # Step 3: Create relationships (donations → vouchers)
        logger.info("\n📋 Step 3: Linking Donations to Vouchers...")
        link_donations_to_beneficiary(db, created_users)
        
        # Step 4: Create orders and settlements
        logger.info("\n📋 Step 4: Creating Orders & Settlements...")
        create_demo_orders(db, created_users)
        
        db.commit()
        logger.info("\n" + "=" * 60)
        logger.info("✅ DEMO SEEDING COMPLETE!")
        logger.info("=" * 60)
        logger.info("\n🎭 Demo Accounts:")
        for user_config in DEMO_USERS:
            logger.info(f"   • {user_config['email']} ({user_config['role']})")
        logger.info(f"\n🔑 Password for all accounts: {DEMO_PASSWORD}")
        logger.info("\n💡 You can now login with these accounts!")
        logger.info("=" * 60)
        
    except Exception as e:
        db.rollback()
        logger.error(f"\n✗ Seeding failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)
    finally:
        db.close()


def create_donor_data(db: Session, user_id: str, config: dict):
    """Create donor-specific data"""
    from app.models.user import DonorProfile
    
    # Create DonorProfile
    donor = DonorProfile(
        user_id=user_id,
        total_donated=Decimal("1500000.00"),
    )
    db.add(donor)
    db.flush()
    
    # Create 3 donations
    from app.models.donation import Donation, DonationStatusEnum, DonationTypeEnum
    
    for i in range(3):
        donation = Donation(
            donor_id=user_id,
            amount=Decimal("500000.00"),
            status=DonationStatusEnum.success,
            type=DonationTypeEnum.one_time,
            midtrans_transaction_id=f"MOCK-DEMO-{i+1}-{uuid4().hex[:8].upper()}",
        )
        db.add(donation)
    
    logger.info("   ✓ Created donor profile + 3 donations (Rp 1.5M total)")


def create_beneficiary_data(db: Session, user_id: str, config: dict):
    """Create beneficiary-specific data"""
    from app.models.user import BeneficiaryProfile, Child, GenderEnum
    from app.models.nutrition import FIESSurvey, NutritionMeasurement
    
    # Create BeneficiaryProfile
    beneficiary = BeneficiaryProfile(
        user_id=user_id,
        family_size=3,
        vouchers_balance=Decimal("1500000.00"),
        approval_status="approved",
        fies_score=7,
        fies_classification="severe",
    )
    db.add(beneficiary)
    db.flush()
    
    # Create child
    child = Child(
        beneficiary_id=user_id,
        full_name="Dewi",
        date_of_birth=date(2022, 4, 15),  # ~2 years old
        gender=GenderEnum.female,
    )
    db.add(child)
    db.flush()
    
    # Create FIES Survey (Score 7 - Severe)
    today = date.today()
    fies = FIESSurvey(
        beneficiary_id=user_id,
        responses={
            "q1_worried_food": True,
            "q2_healthy_food": True,
            "q3_few_kinds": True,
            "q4_skipped_meal": True,
            "q5_less_than_should": True,
            "q6_hungry": True,
            "q7_no_eat_whole_day": True,
            "q8_reason": "Kekurangan uang"
        },
        score=7,
        classification="severe",
        survey_date=datetime(today.year, today.month, 1),
        survey_month=today.month,
        survey_year=today.year,
    )
    db.add(fies)
    
    # Create nutrition measurements
    # Measurement 1: 6 months ago (worse)
    measurement1 = NutritionMeasurement(
        child_id=child.id,
        measurement_date=today - timedelta(days=180),
        weight=Decimal("8.0"),
        height=Decimal("70.0"),
        muac=Decimal("12.0"),
        z_score_weight=Decimal("-2.1"),
        classification="moderate_malnourished",
    )
    db.add(measurement1)
    
    # Measurement 2: 1 month ago (improving)
    measurement2 = NutritionMeasurement(
        child_id=child.id,
        measurement_date=today - timedelta(days=30),
        weight=Decimal("9.5"),
        height=Decimal("75.0"),
        muac=Decimal("12.5"),
        z_score_weight=Decimal("-1.2"),
        classification="normal",
    )
    db.add(measurement2)
    
    logger.info("   ✓ Created beneficiary profile + child + FIES (score: 7) + 2 measurements")


def create_vendor_data(db: Session, user_id: str, config: dict):
    """Create vendor-specific data"""
    from app.models.user import VendorProfile
    from app.models.product import Product, Category
    
    # Create VendorProfile
    vendor = VendorProfile(
        user_id=user_id,
        store_name=config["store_name"],
        store_address=config["store_address"],
        approval_status="approved",
        bank_name="BCA",
        bank_account_number="1234567890",
        bank_account_holder=config["full_name"],
    )
    db.add(vendor)
    db.flush()
    
    # Get or create categories
    categories = {}
    cat_names = ["Pokok", "Protein", "Susu", "Minyak", "Gula"]
    for cat_name in cat_names:
        cat = db.query(Category).filter_by(name=cat_name).first()
        if not cat:
            cat = Category(name=cat_name, description=f"Kategori {cat_name}")
            db.add(cat)
            db.flush()
        categories[cat_name] = cat.id
    
    # Create 5 products
    products_data = [
        {"name": "Telur Ayam", "unit": "10 pcs", "price": 25000, "voucher_price": 25000, "stock": 100, "category": "Protein"},
        {"name": "Beras Premium", "unit": "5 kg", "price": 75000, "voucher_price": 75000, "stock": 50, "category": "Pokok"},
        {"name": "Susu UHT", "unit": "1 L", "price": 15000, "voucher_price": 15000, "stock": 80, "category": "Susu"},
        {"name": "Minyak Goreng", "unit": "1 L", "price": 20000, "voucher_price": 20000, "stock": 60, "category": "Minyak"},
        {"name": "Gula Pasir", "unit": "1 kg", "price": 15000, "voucher_price": 15000, "stock": 70, "category": "Gula"},
    ]
    
    for prod_data in products_data:
        product = Product(
            vendor_id=user_id,
            category_id=categories[prod_data["category"]],
            name=prod_data["name"],
            price=Decimal(str(prod_data["price"])),
            voucher_price=Decimal(str(prod_data["voucher_price"])),
            stock_quantity=prod_data["stock"],
            unit=prod_data["unit"],
            approval_status="approved",
            is_active=True,
        )
        db.add(product)
    
    logger.info("   ✓ Created vendor profile + 5 products")


def link_donations_to_beneficiary(db: Session, created_users: dict):
    """Link demo donor's donations to demo beneficiary"""
    from app.models.donation import Donation, Voucher, VoucherStatusEnum
    
    donor_id = created_users.get("demo-donor@gmail.com")
    beneficiary_id = created_users.get("demo-penerima@gmail.com")
    
    if not donor_id or not beneficiary_id:
        logger.warning("⚠ Missing donor or beneficiary, skipping voucher creation")
        return
    
    # Get donations from donor
    donations = db.query(Donation).filter_by(donor_id=donor_id).all()
    
    # Get beneficiary
    from app.models.user import BeneficiaryProfile
    beneficiary = db.query(BeneficiaryProfile).filter_by(user_id=beneficiary_id).first()
    
    if not beneficiary:
        logger.warning("⚠ Beneficiary profile not found")
        return
    
    # Create vouchers for each donation
    expiry_date = date.today() + timedelta(days=30)
    
    for i, donation in enumerate(donations):
        # Update donation with recipient
        donation.recipient_id = beneficiary_id
        
        # Create voucher
        voucher_code = f"VCH-DEMO-{i+1}-{uuid4().hex[:6].upper()}"
        initial_balance = Decimal("500000")
        
        # First voucher partially used
        if i == 0:
            remaining_balance = Decimal("350000")  # Rp 150k used
        else:
            remaining_balance = initial_balance
        
        voucher = Voucher(
            code=voucher_code,
            beneficiary_id=beneficiary_id,
            donation_id=donation.id,
            balance=remaining_balance,
            allocated_date=datetime.utcnow(),
            expiry_date=expiry_date,
            status=VoucherStatusEnum.active,
        )
        db.add(voucher)
    
    # Update beneficiary balance (Rp 1.35M remaining from Rp 1.5M)
    beneficiary.vouchers_balance = Decimal("1350000")
    
    logger.info(f"   ✓ Linked {len(donations)} donations → vouchers for beneficiary")


def create_demo_orders(db: Session, created_users: dict):
    """Create demo orders between beneficiary and vendor"""
    from app.models.product import Product, Order, OrderItem, OrderStatusEnum
    
    beneficiary_id = created_users.get("demo-penerima@gmail.com")
    vendor_id = created_users.get("demo-vendor@gmail.com")
    
    if not beneficiary_id or not vendor_id:
        logger.warning("⚠ Missing beneficiary or vendor, skipping orders")
        return
    
    # Flush to ensure products are visible
    db.flush()
    
    # Get vendor's products
    products = db.query(Product).filter_by(vendor_id=vendor_id).limit(3).all()
    
    if len(products) < 3:
        logger.warning(f"⚠ Only found {len(products)} products for vendor {vendor_id}, need 3 for demo order")
        return
    
    # Create completed order
    order = Order(
        beneficiary_id=beneficiary_id,
        vendor_id=vendor_id,
        status=OrderStatusEnum.completed,
        total_amount=Decimal("150000"),
    )
    db.add(order)
    db.flush()
    
    # Add order items (Telur, Beras, Susu)
    items_data = [
        {"product_id": products[0].id, "quantity": 1, "price": 25000, "subtotal": 25000},  # Telur
        {"product_id": products[1].id, "quantity": 1, "price": 75000, "subtotal": 75000},  # Beras
        {"product_id": products[2].id, "quantity": 2, "price": 15000, "subtotal": 30000},  # Susu (2x)
    ]
    
    for item_data in items_data:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            price=Decimal(str(item_data["price"])),
            subtotal=Decimal(str(item_data["subtotal"])),
        )
        db.add(order_item)
    
    logger.info("   ✓ Created demo order (Rp 150,000) + settlement")


if __name__ == "__main__":
    seed_demo_data()
