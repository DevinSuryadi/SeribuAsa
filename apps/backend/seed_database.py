"""
Seed Database with Test Data
Generates realistic test data for:
- Donations (12 months, various provinces)
- Orders (30 days, daily distribution)
- FIES surveys (for beneficiaries)
- Nutrition measurements (for children)
"""
from datetime import datetime, timedelta, date
from decimal import Decimal
from uuid import uuid4
import random
import sys
from sqlalchemy.orm import Session

# Add app to path
sys.path.insert(0, '/d/ppl1/Project-PPL1/apps/backend')

from app.database import SessionLocal, engine
from app.models.base import BaseModel
from app.models.user import (
    UserProfile, 
    DonorProfile, 
    BeneficiaryProfile, 
    VendorProfile, 
    Child,
    GenderEnum
)
from app.models.donation import Donation, DonationStatusEnum, DonationTypeEnum
from app.models.product import Product, Order, OrderItem, Category
from app.models.nutrition import NutritionMeasurement, FIESSurvey
from app.services.zscore_calculator import ZScoreCalculator


# ============================================
# Constants
# ============================================
PROVINCES = [
    "Jawa Barat", "Jawa Timur", "Jawa Tengah", "DKI Jakarta",
    "Sumatra Utara", "Sumatra Selatan", "Riau", "Lampung",
    "Kalimantan Selatan", "Kalimantan Timur", "Sulawesi Selatan",
    "Bali", "Nusa Tenggara Timur", "Aceh", "Bengkulu"
]

FIES_RESPONSES_SAMPLES = [
    {"q1": 0, "q2": 0, "q3": 0, "q4": 0, "q5": 0, "q6": 0, "q7": 0, "q8": 0},  # Score 0 - food_secure
    {"q1": 1, "q2": 1, "q3": 0, "q4": 0, "q5": 0, "q6": 0, "q7": 0, "q8": 0},  # Score 2 - food_secure
    {"q1": 1, "q2": 1, "q3": 1, "q4": 1, "q5": 1, "q6": 0, "q7": 0, "q8": 0},  # Score 5 - moderate
    {"q1": 1, "q2": 1, "q3": 1, "q4": 1, "q5": 1, "q6": 1, "q7": 1, "q8": 0},  # Score 7 - severe
    {"q1": 1, "q2": 1, "q3": 1, "q4": 1, "q5": 1, "q6": 1, "q7": 1, "q8": 1},  # Score 8 - severe
]

PRODUCT_NAMES = [
    "Beras Premium", "Telur Ayam", "Bayam", "Wortel", "Brokoli",
    "Minyak Goreng", "Garam", "Gula", "Terigu", "Susu",
    "Daging Sapi", "Ikan Lele", "Kacang Hijau", "Singkong", "Jagung"
]


# ============================================
# Database Initialization
# ============================================
def init_database():
    """Create all tables"""
    print("Creating database tables...")
    BaseModel.metadata.create_all(bind=engine)
    print("[OK] Database tables created")


# ============================================
# Seed Functions
# ============================================
def create_users(db: Session, count: int = 5):
    """Create donor, beneficiary, and vendor users"""
    print(f"\nCreating {count} donors, {count} beneficiaries, {count} vendors...")
    
    donors = []
    beneficiaries = []
    vendors = []
    
    # Create Donors
    for i in range(count):
        user_id = uuid4()
        user = UserProfile(
            user_id=user_id,
            full_name=f"Donor {i+1}",
            phone=f"08123456{i:03d}",
            gender=GenderEnum.male if i % 2 == 0 else GenderEnum.female
        )
        donor = DonorProfile(user_id=user_id, total_donated=Decimal("0"))
        db.add(user)
        db.add(donor)
        donors.append((user, donor))
    
    # Create Beneficiaries with Children
    for i in range(count):
        user_id = uuid4()
        user = UserProfile(
            user_id=user_id,
            full_name=f"Beneficiary {i+1}",
            phone=f"08234567{i:03d}",
            gender=GenderEnum.male if i % 2 == 0 else GenderEnum.female
        )
        beneficiary = BeneficiaryProfile(user_id=user_id, family_size=random.randint(2, 6))
        
        db.add(user)
        db.add(beneficiary)
        
        # Add children (1-3 per beneficiary)
        num_children = random.randint(1, 3)
        for j in range(num_children):
            child = Child(
                beneficiary_id=user_id,
                full_name=f"Child {i+1}-{j+1}",
                date_of_birth=date.today() - timedelta(days=random.randint(60, 1800)),
                gender=GenderEnum.male if j % 2 == 0 else GenderEnum.female
            )
            db.add(child)
        
        beneficiaries.append((user, beneficiary))
    
    # Create Vendors
    for i in range(count):
        user_id = uuid4()
        user = UserProfile(
            user_id=user_id,
            full_name=f"Vendor {i+1}",
            phone=f"08345678{i:03d}",
            gender=GenderEnum.male if i % 2 == 0 else GenderEnum.female
        )
        vendor = VendorProfile(
            user_id=user_id,
            store_name=f"Toko {i+1}",
            store_address=f"Jalan Vendor {i+1}, Indonesia",
            store_phone=f"08345678{i:03d}",
            bank_name=random.choice(["BCA", "Mandiri", "BRI", "CIMB"]),
            bank_account_number=f"123456789{i:04d}",
            bank_account_holder=f"Vendor {i+1}"
        )
        
        db.add(user)
        db.add(vendor)
        vendors.append((user, vendor))
    
    db.commit()
    print(f"[OK] Created {len(donors)} donors, {len(beneficiaries)} beneficiaries, {len(vendors)} vendors")
    return donors, beneficiaries, vendors


def create_products(db: Session, vendors):
    """Create products for each vendor"""
    print("\nCreating products...")
    
    # Create categories
    categories = []
    category_names = ["Beras", "Sayuran", "Daging & Ikan", "Bumbu & Minyak", "Susu & Telur"]
    for cat_name in category_names:
        category = Category(name=cat_name, slug=cat_name.lower())
        db.add(category)
        categories.append(category)
    
    db.commit()
    
    # Create products for each vendor
    for vendor_user, vendor_profile in vendors:
        for j in range(5):  # 5 products per vendor
            product = Product(
                vendor_id=vendor_profile.user_id,
                category_id=random.choice(categories).id,
                name=random.choice(PRODUCT_NAMES),
                description=f"Quality product #{j+1}",
                price=Decimal(random.randint(5000, 100000)),
                voucher_price=Decimal(random.randint(3000, 80000)),
                stock_quantity=random.randint(10, 100),
                approval_status="approved"
            )
            db.add(product)
    
    db.commit()
    print(f"[OK] Created products for {len(vendors)} vendors")
    return categories


def create_donations(db: Session, donors, beneficiaries, count_per_donor: int = 12):
    """Create donations spanning 12 months with various provinces"""
    print(f"\nCreating {len(donors) * count_per_donor} donations...")
    
    today = datetime.now()
    donations_created = 0
    
    for donor_user, donor_profile in donors:
        # Create 12 donations for each donor (one per month, past 12 months)
        for month_offset in range(count_per_donor):
            donation_date = today - timedelta(days=30 * month_offset)
            
            # Random beneficiary and amount
            beneficiary_user, beneficiary_profile = random.choice(beneficiaries)
            amount = Decimal(random.randint(50000, 500000))
            
            donation = Donation(
                donor_id=donor_profile.user_id,
                recipient_id=beneficiary_profile.user_id,
                amount=amount,
                type=DonationTypeEnum.one_time,
                status=DonationStatusEnum.success,
                created_at=donation_date
            )
            
            db.add(donation)
            donations_created += 1
    
    db.commit()
    print(f"[OK] Created {donations_created} donations")


def create_orders(db: Session, beneficiaries, vendors, products_by_vendor: dict):
    """Create orders spanning last 30 days with daily distribution"""
    print("\nCreating orders for last 30 days...")
    
    today = date.today()
    orders_created = 0
    
    # Create 1-3 orders per day for last 30 days
    for day_offset in range(30):
        order_date = today - timedelta(days=day_offset)
        num_orders_today = random.randint(1, 3)
        
        for _ in range(num_orders_today):
            beneficiary_user, beneficiary_profile = random.choice(beneficiaries)
            vendor_user, vendor_profile = random.choice(vendors)
            
            # Get products for this vendor
            vendor_products = (
                db.query(Product)
                .filter(Product.vendor_id == vendor_profile.user_id)
                .all()
            )
            
            if not vendor_products:
                continue
            
            # Create order
            total_amount = Decimal("0")
            order = Order(
                beneficiary_id=beneficiary_profile.user_id,
                vendor_id=vendor_profile.user_id,
                total_amount=total_amount,
                status="completed",
                payment_status="paid",
                created_at=datetime.combine(order_date, datetime.min.time())
            )
            
            db.add(order)
            db.flush()  # Get order ID
            
            # Add 1-3 items to order
            num_items = random.randint(1, 3)
            for _ in range(num_items):
                product = random.choice(vendor_products)
                quantity = random.randint(1, 5)
                price = product.price
                subtotal = price * quantity
                total_amount += subtotal
                
                item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    price=price,
                    subtotal=subtotal
                )
                db.add(item)
            
            # Update order total
            order.total_amount = total_amount
            orders_created += 1
    
    db.commit()
    print(f"[OK] Created {orders_created} orders")


def create_fies_surveys(db: Session, beneficiaries):
    """Create FIES surveys for beneficiaries (12 months)"""
    print("\nCreating FIES surveys...")
    
    today = datetime.now()
    surveys_created = 0
    
    for beneficiary_user, beneficiary_profile in beneficiaries:
        # Create 12 surveys for each beneficiary (one per month, past 12 months)
        for month_offset in range(12):
            survey_date = today - timedelta(days=30 * month_offset)
            
            # Random responses
            responses = random.choice(FIES_RESPONSES_SAMPLES)
            score = sum(responses.values())
            
            # Classify
            if score <= 2:
                classification = "food_secure"
            elif score <= 5:
                classification = "moderate"
            else:
                classification = "severe"
            
            survey = FIESSurvey(
                beneficiary_id=beneficiary_profile.user_id,
                responses=responses,
                score=score,
                classification=classification,
                survey_date=survey_date,
                survey_month=survey_date.month,
                survey_year=survey_date.year
            )
            
            db.add(survey)
            surveys_created += 1
    
    db.commit()
    print(f"[OK] Created {surveys_created} FIES surveys")


def create_nutrition_measurements(db: Session, beneficiaries):
    """Create nutrition measurements for children (past 30 days)"""
    print("\nCreating nutrition measurements...")
    
    today = date.today()
    measurements_created = 0
    
    for beneficiary_user, beneficiary_profile in beneficiaries:
        # Get children for this beneficiary
        children = (
            db.query(Child)
            .filter(Child.beneficiary_id == beneficiary_profile.user_id)
            .all()
        )
        
        for child in children:
            # Create 1-3 measurements per child in past 30 days
            num_measurements = random.randint(1, 3)
            for _ in range(num_measurements):
                measurement_date = today - timedelta(days=random.randint(0, 30))
                
                # Realistic measurements for children
                weight = Decimal(random.uniform(5, 25))
                height = Decimal(random.uniform(50, 120))
                
                # Calculate Z-scores
                age_months = max(0, (today.year - child.date_of_birth.year) * 12 + 
                                (today.month - child.date_of_birth.month))
                age_months = min(60, age_months)
                
                gender = child.gender.value if child.gender else "male"
                zscore_data = ZScoreCalculator.calculate(
                    age_months=age_months,
                    gender=gender,
                    weight=float(weight),
                    height=float(height)
                )
                
                # Determine classification
                weight_class = zscore_data["weight_classification"]
                height_class = zscore_data["height_classification"]
                if weight_class == "severe_malnourished" or height_class == "severe_malnourished":
                    classification = "severe_malnourished"
                elif weight_class == "moderate_malnourished" or height_class == "moderate_malnourished":
                    classification = "moderate_malnourished"
                else:
                    classification = "normal"
                
                measurement = NutritionMeasurement(
                    child_id=child.id,
                    measurement_date=measurement_date,
                    weight=weight,
                    height=height,
                    z_score_weight=Decimal(str(zscore_data["z_score_weight"])),
                    z_score_height=Decimal(str(zscore_data["z_score_height"])),
                    z_score_weight_height=Decimal(str(zscore_data.get("z_score_weight_height", 0))),
                    classification=classification
                )
                
                db.add(measurement)
                measurements_created += 1
    
    db.commit()
    print(f"[OK] Created {measurements_created} nutrition measurements")


# ============================================
# Main Seed Function
# ============================================
def seed_database():
    """Main function to seed the entire database"""
    print("=" * 60)
    print(" SEEDING DATABASE WITH TEST DATA")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Initialize database
        init_database()
        
        # Create users (5 of each type)
        donors, beneficiaries, vendors = create_users(db, count=5)
        
        # Create products
        categories = create_products(db, vendors)
        
        # Create donations (12 per donor)
        create_donations(db, donors, beneficiaries, count_per_donor=12)
        
        # Create orders (daily for 30 days)
        create_orders(db, beneficiaries, vendors, {})
        
        # Create FIES surveys (12 per beneficiary)
        create_fies_surveys(db, beneficiaries)
        
        # Create nutrition measurements (1-3 per child in past 30 days)
        create_nutrition_measurements(db, beneficiaries)
        
        print("\n" + "=" * 60)
        print("[OK] DATABASE SEEDING COMPLETE!")
        print("=" * 60)
        print("\nTest data created:")
        print(f"  - {len(donors)} donors with {len(donors) * 12} donations")
        print(f"  - {len(beneficiaries)} beneficiaries with children")
        print(f"  - {len(vendors)} vendors with products")
        print(f"  - Orders for past 30 days (daily distribution)")
        print(f"  - FIES surveys for 12 months")
        print(f"  - Nutrition measurements for children")
        
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Error during seeding: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
