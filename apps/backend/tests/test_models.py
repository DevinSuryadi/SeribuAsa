"""
Unit tests for database models
Tests model creation, validation, and methods
"""
import pytest
from datetime import datetime, timedelta
from uuid import uuid4
from app.models.user import UserProfile, DonorProfile, GenderEnum
from app.models.product import Product, Category, OrderStatusEnum, PaymentStatusEnum
from app.models.wallet import WalletAllocation, WalletTransaction
from app.models.donation import Donation, DonationStatusEnum, DonationTypeEnum
from app.models.nutrition import NutritionMeasurement, NutritionClassificationEnum
from app.models.subscription import SubscriptionPlan, Subscription, SubscriptionStatusEnum


class TestUserProfile:
    """Test UserProfile model"""

    def test_user_profile_creation(self):
        """Test creating a UserProfile instance"""
        user_id = uuid4()
        user = UserProfile(
            id=user_id,
            email="test@example.com",
            full_name="Test User",
            phone_number="+62812345678",
            gender=GenderEnum.MALE,
            date_of_birth=datetime(2000, 1, 1),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert user.id == user_id
        assert user.email == "test@example.com"
        assert user.full_name == "Test User"
        assert user.gender == GenderEnum.MALE

    def test_user_profile_to_dict(self):
        """Test converting UserProfile to dictionary"""
        user = UserProfile(
            id=uuid4(),
            email="test@example.com",
            full_name="Test User",
            phone_number="+62812345678",
            gender=GenderEnum.FEMALE,
            date_of_birth=datetime(2000, 1, 1),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        user_dict = user.to_dict()
        assert isinstance(user_dict, dict)
        assert user_dict["email"] == "test@example.com"
        assert user_dict["full_name"] == "Test User"

    def test_user_profile_repr(self):
        """Test UserProfile string representation"""
        user = UserProfile(
            id=uuid4(),
            email="test@example.com",
            full_name="Test User",
            phone_number="+62812345678",
            gender=GenderEnum.MALE,
            date_of_birth=datetime(2000, 1, 1),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        repr_str = repr(user)
        assert "UserProfile" in repr_str or "test@example.com" in repr_str


class TestDonorProfile:
    """Test DonorProfile model"""

    def test_donor_profile_creation(self):
        """Test creating a DonorProfile instance"""
        donor_id = uuid4()
        donor = DonorProfile(
            id=donor_id,
            user_id=uuid4(),
            bank_account_number="1234567890",
            bank_name="BCA",
            account_holder_name="Test Donor",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert donor.id == donor_id
        assert donor.bank_account_number == "1234567890"
        assert donor.bank_name == "BCA"

    def test_donor_profile_to_dict(self):
        """Test converting DonorProfile to dictionary"""
        donor = DonorProfile(
            id=uuid4(),
            user_id=uuid4(),
            bank_account_number="1234567890",
            bank_name="BCA",
            account_holder_name="Test Donor",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        donor_dict = donor.to_dict()
        assert isinstance(donor_dict, dict)
        assert donor_dict["bank_name"] == "BCA"


class TestProduct:
    """Test Product model"""

    def test_product_creation(self):
        """Test creating a Product instance"""
        product_id = uuid4()
        vendor_id = uuid4()
        product = Product(
            id=product_id,
            vendor_id=vendor_id,
            name="Test Product",
            description="Test Description",
            price=50000,
            quantity=100,
            category="Food",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert product.id == product_id
        assert product.name == "Test Product"
        assert product.price == 50000
        assert product.quantity == 100

    def test_product_to_dict(self):
        """Test converting Product to dictionary"""
        product = Product(
            id=uuid4(),
            vendor_id=uuid4(),
            name="Test Product",
            description="Test Description",
            price=50000,
            quantity=100,
            category="Food",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        product_dict = product.to_dict()
        assert isinstance(product_dict, dict)
        assert product_dict["name"] == "Test Product"
        assert product_dict["price"] == 50000


class TestWalletAllocation:
    """Test WalletAllocation model"""

    def test_wallet_allocation_creation(self):
        """Test creating a WalletAllocation instance"""
        allocation_id = uuid4()
        now = datetime.now()
        expiry = now + timedelta(days=30)
        
        allocation = WalletAllocation(
            id=allocation_id,
            beneficiary_id=uuid4(),
            amount=100000,
            allocated_at=now,
            expiry_date=expiry,
            created_at=now,
            updated_at=now,
        )
        assert allocation.id == allocation_id
        assert allocation.amount == 100000
        assert allocation.expiry_date == expiry

    def test_wallet_allocation_is_expired(self):
        """Test checking if wallet allocation is expired"""
        now = datetime.now()
        
        # Not expired allocation
        future_expiry = now + timedelta(days=30)
        allocation_active = WalletAllocation(
            id=uuid4(),
            beneficiary_id=uuid4(),
            amount=100000,
            allocated_at=now,
            expiry_date=future_expiry,
            created_at=now,
            updated_at=now,
        )
        assert not allocation_active.is_expired()
        
        # Expired allocation
        past_expiry = now - timedelta(days=1)
        allocation_expired = WalletAllocation(
            id=uuid4(),
            beneficiary_id=uuid4(),
            amount=100000,
            allocated_at=now - timedelta(days=31),
            expiry_date=past_expiry,
            created_at=now - timedelta(days=31),
            updated_at=now - timedelta(days=31),
        )
        assert allocation_expired.is_expired()

    def test_wallet_allocation_is_available(self):
        """Test checking if wallet allocation is available"""
        now = datetime.now()
        future_expiry = now + timedelta(days=30)
        
        allocation = WalletAllocation(
            id=uuid4(),
            beneficiary_id=uuid4(),
            amount=100000,
            allocated_at=now,
            expiry_date=future_expiry,
            created_at=now,
            updated_at=now,
        )
        assert allocation.is_available()


class TestDonation:
    """Test Donation model"""

    def test_donation_creation(self):
        """Test creating a Donation instance"""
        donation_id = uuid4()
        donor_id = uuid4()
        
        donation = Donation(
            id=donation_id,
            donor_id=donor_id,
            amount=500000,
            donation_type=DonationTypeEnum.CASH,
            status=DonationStatusEnum.PENDING,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert donation.id == donation_id
        assert donation.donor_id == donor_id
        assert donation.amount == 500000
        assert donation.donation_type == DonationTypeEnum.CASH
        assert donation.status == DonationStatusEnum.PENDING

    def test_donation_to_dict(self):
        """Test converting Donation to dictionary"""
        donation = Donation(
            id=uuid4(),
            donor_id=uuid4(),
            amount=500000,
            donation_type=DonationTypeEnum.CASH,
            status=DonationStatusEnum.COMPLETED,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        donation_dict = donation.to_dict()
        assert isinstance(donation_dict, dict)
        assert donation_dict["amount"] == 500000


class TestNutritionMeasurement:
    """Test NutritionMeasurement model"""

    def test_nutrition_measurement_creation(self):
        """Test creating a NutritionMeasurement instance"""
        measurement_id = uuid4()
        child_id = uuid4()
        
        measurement = NutritionMeasurement(
            id=measurement_id,
            child_id=child_id,
            height=100,
            weight=20,
            measurement_date=datetime.now(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert measurement.id == measurement_id
        assert measurement.child_id == child_id
        assert measurement.height == 100
        assert measurement.weight == 20

    def test_nutrition_measurement_to_dict(self):
        """Test converting NutritionMeasurement to dictionary"""
        measurement = NutritionMeasurement(
            id=uuid4(),
            child_id=uuid4(),
            height=100,
            weight=20,
            measurement_date=datetime.now(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        measurement_dict = measurement.to_dict()
        assert isinstance(measurement_dict, dict)
        assert measurement_dict["height"] == 100
        assert measurement_dict["weight"] == 20


class TestSubscriptionPlan:
    """Test SubscriptionPlan model"""

    def test_subscription_plan_creation(self):
        """Test creating a SubscriptionPlan instance"""
        plan_id = uuid4()
        
        plan = SubscriptionPlan(
            id=plan_id,
            name="Premium Plan",
            description="Premium subscription plan",
            price=99000,
            duration_days=30,
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert plan.id == plan_id
        assert plan.name == "Premium Plan"
        assert plan.price == 99000
        assert plan.duration_days == 30
        assert plan.is_active is True

    def test_subscription_plan_to_dict(self):
        """Test converting SubscriptionPlan to dictionary"""
        plan = SubscriptionPlan(
            id=uuid4(),
            name="Premium Plan",
            description="Premium subscription plan",
            price=99000,
            duration_days=30,
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        plan_dict = plan.to_dict()
        assert isinstance(plan_dict, dict)
        assert plan_dict["name"] == "Premium Plan"
        assert plan_dict["price"] == 99000


class TestSubscription:
    """Test Subscription model"""

    def test_subscription_creation(self):
        """Test creating a Subscription instance"""
        subscription_id = uuid4()
        user_id = uuid4()
        plan_id = uuid4()
        
        subscription = Subscription(
            id=subscription_id,
            user_id=user_id,
            plan_id=plan_id,
            status=SubscriptionStatusEnum.ACTIVE,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=30),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert subscription.id == subscription_id
        assert subscription.user_id == user_id
        assert subscription.plan_id == plan_id
        assert subscription.status == SubscriptionStatusEnum.ACTIVE

    def test_subscription_to_dict(self):
        """Test converting Subscription to dictionary"""
        subscription = Subscription(
            id=uuid4(),
            user_id=uuid4(),
            plan_id=uuid4(),
            status=SubscriptionStatusEnum.ACTIVE,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=30),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        subscription_dict = subscription.to_dict()
        assert isinstance(subscription_dict, dict)
        assert subscription_dict["status"] == SubscriptionStatusEnum.ACTIVE
