"""
Unit tests for database models
Tests model creation, validation, and methods
"""
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4
from app.models.user import UserProfile, DonorProfile, GenderEnum
from app.models.product import Product
from app.models.wallet import WalletAllocation
from app.models.donation import Donation, DonationStatusEnum, DonationTypeEnum
from app.models.nutrition import NutritionMeasurement
from app.models.subscription import SubscriptionPlan, Subscription, SubscriptionStatusEnum


class TestUserProfile:
    """Test UserProfile model"""

    def test_user_profile_creation(self):
        """Test creating a UserProfile instance"""
        user_id = uuid4()
        user = UserProfile(
            id=user_id,
            user_id=uuid4(),
            full_name="Test User",
            phone="+62812345678",
            gender=GenderEnum.male,
            date_of_birth=datetime(2000, 1, 1).date(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert user.id == user_id
        assert user.full_name == "Test User"
        assert user.gender == GenderEnum.male

    def test_user_profile_to_dict(self):
        """Test converting UserProfile to dictionary"""
        user = UserProfile(
            id=uuid4(),
            user_id=uuid4(),
            full_name="Test User",
            phone="+62812345678",
            gender=GenderEnum.female,
            date_of_birth=datetime(2000, 1, 1).date(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        user_dict = user.to_dict()
        assert isinstance(user_dict, dict)
        assert user_dict["full_name"] == "Test User"

    def test_user_profile_repr(self):
        """Test UserProfile string representation"""
        user = UserProfile(
            id=uuid4(),
            user_id=uuid4(),
            full_name="Test User",
            phone="+62812345678",
            gender=GenderEnum.male,
            date_of_birth=datetime(2000, 1, 1).date(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        repr_str = repr(user)
        assert "UserProfile" in repr_str or "Test User" in repr_str


class TestDonorProfile:
    """Test DonorProfile model"""

    def test_donor_profile_creation(self):
        """Test creating a DonorProfile instance"""
        donor_id = uuid4()
        donor = DonorProfile(
            id=donor_id,
            user_id=uuid4(),
            total_donated=Decimal("0"),
            children_sponsored=0,
            subscription_status="inactive",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert donor.id == donor_id
        assert donor.subscription_status == "inactive"

    def test_donor_profile_to_dict(self):
        """Test converting DonorProfile to dictionary"""
        donor = DonorProfile(
            id=uuid4(),
            user_id=uuid4(),
            total_donated=Decimal("500000"),
            children_sponsored=2,
            subscription_status="active",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        donor_dict = donor.to_dict()
        assert isinstance(donor_dict, dict)
        assert donor_dict["subscription_status"] == "active"


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
            price=Decimal("50000"),
            voucher_price=Decimal("45000"),
            stock_quantity=100,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert product.id == product_id
        assert product.name == "Test Product"
        assert product.price == Decimal("50000")
        assert product.stock_quantity == 100

    def test_product_to_dict(self):
        """Test converting Product to dictionary"""
        product = Product(
            id=uuid4(),
            vendor_id=uuid4(),
            name="Test Product",
            description="Test Description",
            price=Decimal("50000"),
            voucher_price=Decimal("45000"),
            stock_quantity=100,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        product_dict = product.to_dict()
        assert isinstance(product_dict, dict)
        assert product_dict["name"] == "Test Product"
        assert product_dict["price"] == Decimal("50000")

    def test_product_is_in_stock(self):
        """Test product is_in_stock method"""
        product = Product(
            id=uuid4(),
            vendor_id=uuid4(),
            name="Test Product",
            price=Decimal("50000"),
            voucher_price=Decimal("45000"),
            stock_quantity=10,
            is_active=True,
        )
        assert product.is_in_stock() is True

        product_empty = Product(
            id=uuid4(),
            vendor_id=uuid4(),
            name="Empty Product",
            price=Decimal("50000"),
            voucher_price=Decimal("45000"),
            stock_quantity=0,
            is_active=True,
        )
        assert product_empty.is_in_stock() is False


class TestWalletAllocation:
    """Test WalletAllocation model"""

    def test_wallet_allocation_creation(self):
        """Test creating a WalletAllocation instance"""
        allocation_id = uuid4()
        now = datetime.now()
        expiry = now + timedelta(days=90)

        allocation = WalletAllocation(
            id=allocation_id,
            beneficiary_id=uuid4(),
            original_amount=Decimal("100000"),
            remaining_amount=Decimal("100000"),
            allocated_at=now,
            expires_at=expiry,
            status="active",
            created_at=now,
            updated_at=now,
        )
        assert allocation.id == allocation_id
        assert allocation.original_amount == Decimal("100000")
        assert allocation.remaining_amount == Decimal("100000")
        assert allocation.expires_at == expiry

    def test_wallet_allocation_is_expired(self):
        """Test checking if wallet allocation is expired"""
        now = datetime.now()

        # Not expired allocation
        future_expiry = now + timedelta(days=30)
        allocation_active = WalletAllocation(
            id=uuid4(),
            beneficiary_id=uuid4(),
            original_amount=Decimal("100000"),
            remaining_amount=Decimal("100000"),
            allocated_at=now,
            expires_at=future_expiry,
            status="active",
            created_at=now,
            updated_at=now,
        )
        assert not allocation_active.is_expired()

        # Expired allocation
        past_expiry = now - timedelta(days=1)
        allocation_expired = WalletAllocation(
            id=uuid4(),
            beneficiary_id=uuid4(),
            original_amount=Decimal("100000"),
            remaining_amount=Decimal("100000"),
            allocated_at=now - timedelta(days=91),
            expires_at=past_expiry,
            status="active",
            created_at=now - timedelta(days=91),
            updated_at=now - timedelta(days=91),
        )
        assert allocation_expired.is_expired()

    def test_wallet_allocation_is_available(self):
        """Test checking if wallet allocation is available"""
        now = datetime.now()
        future_expiry = now + timedelta(days=30)

        allocation = WalletAllocation(
            id=uuid4(),
            beneficiary_id=uuid4(),
            original_amount=Decimal("100000"),
            remaining_amount=Decimal("100000"),
            allocated_at=now,
            expires_at=future_expiry,
            status="active",
            created_at=now,
            updated_at=now,
        )
        assert allocation.is_available()

    def test_wallet_allocation_depleted_not_available(self):
        """Test that depleted allocation is not available"""
        now = datetime.now()
        future_expiry = now + timedelta(days=30)

        allocation = WalletAllocation(
            id=uuid4(),
            beneficiary_id=uuid4(),
            original_amount=Decimal("100000"),
            remaining_amount=Decimal("0"),
            allocated_at=now,
            expires_at=future_expiry,
            status="depleted",
            created_at=now,
            updated_at=now,
        )
        assert not allocation.is_available()


class TestDonation:
    """Test Donation model"""

    def test_donation_creation(self):
        """Test creating a Donation instance"""
        donation_id = uuid4()
        donor_id = uuid4()

        donation = Donation(
            id=donation_id,
            donor_id=donor_id,
            amount=Decimal("500000"),
            type=DonationTypeEnum.one_time,
            status=DonationStatusEnum.pending,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert donation.id == donation_id
        assert donation.donor_id == donor_id
        assert donation.amount == Decimal("500000")
        assert donation.type == DonationTypeEnum.one_time
        assert donation.status == DonationStatusEnum.pending

    def test_donation_to_dict(self):
        """Test converting Donation to dictionary"""
        donation = Donation(
            id=uuid4(),
            donor_id=uuid4(),
            amount=Decimal("500000"),
            type=DonationTypeEnum.one_time,
            status=DonationStatusEnum.success,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        donation_dict = donation.to_dict()
        assert isinstance(donation_dict, dict)
        assert donation_dict["amount"] == Decimal("500000")

    def test_donation_status_enum_values(self):
        """Test DonationStatusEnum has correct values"""
        assert DonationStatusEnum.pending == "pending"
        assert DonationStatusEnum.success == "success"
        assert DonationStatusEnum.failed == "failed"
        assert DonationStatusEnum.cancelled == "cancelled"

    def test_donation_type_enum_values(self):
        """Test DonationTypeEnum has correct values"""
        assert DonationTypeEnum.one_time == "one_time"
        assert DonationTypeEnum.subscription == "subscription"


class TestNutritionMeasurement:
    """Test NutritionMeasurement model"""

    def test_nutrition_measurement_creation(self):
        """Test creating a NutritionMeasurement instance"""
        measurement_id = uuid4()
        child_id = uuid4()

        measurement = NutritionMeasurement(
            id=measurement_id,
            child_id=child_id,
            height=Decimal("100"),
            weight=Decimal("20"),
            measurement_date=datetime.now().date(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert measurement.id == measurement_id
        assert measurement.child_id == child_id
        assert measurement.height == Decimal("100")
        assert measurement.weight == Decimal("20")

    def test_nutrition_measurement_to_dict(self):
        """Test converting NutritionMeasurement to dictionary"""
        measurement = NutritionMeasurement(
            id=uuid4(),
            child_id=uuid4(),
            height=Decimal("100"),
            weight=Decimal("20"),
            measurement_date=datetime.now().date(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        measurement_dict = measurement.to_dict()
        assert isinstance(measurement_dict, dict)
        assert measurement_dict["height"] == Decimal("100")
        assert measurement_dict["weight"] == Decimal("20")


class TestSubscriptionPlan:
    """Test SubscriptionPlan model"""

    def test_subscription_plan_creation(self):
        """Test creating a SubscriptionPlan instance"""
        plan_id = uuid4()

        plan = SubscriptionPlan(
            id=plan_id,
            name="Premium Plan",
            description="Premium subscription plan",
            price=Decimal("99000"),
            frequency="monthly",
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert plan.id == plan_id
        assert plan.name == "Premium Plan"
        assert plan.price == Decimal("99000")
        assert plan.frequency == "monthly"
        assert plan.is_active is True

    def test_subscription_plan_to_dict(self):
        """Test converting SubscriptionPlan to dictionary"""
        plan = SubscriptionPlan(
            id=uuid4(),
            name="Premium Plan",
            description="Premium subscription plan",
            price=Decimal("99000"),
            frequency="monthly",
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        plan_dict = plan.to_dict()
        assert isinstance(plan_dict, dict)
        assert plan_dict["name"] == "Premium Plan"
        assert plan_dict["price"] == Decimal("99000")


class TestSubscription:
    """Test Subscription model"""

    def test_subscription_creation(self):
        """Test creating a Subscription instance"""
        subscription_id = uuid4()
        donor_id = uuid4()
        plan_id = uuid4()
        from datetime import date

        subscription = Subscription(
            id=subscription_id,
            donor_id=donor_id,
            plan_id=plan_id,
            plan_name="Premium Plan",
            amount=Decimal("99000"),
            frequency="monthly",
            status=SubscriptionStatusEnum.active,
            next_billing_date=date.today(),
            started_at=datetime.now(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        assert subscription.id == subscription_id
        assert subscription.donor_id == donor_id
        assert subscription.plan_id == plan_id
        assert subscription.status == SubscriptionStatusEnum.active

    def test_subscription_to_dict(self):
        """Test converting Subscription to dictionary"""
        from datetime import date

        subscription = Subscription(
            id=uuid4(),
            donor_id=uuid4(),
            plan_id=uuid4(),
            plan_name="Premium Plan",
            amount=Decimal("99000"),
            frequency="monthly",
            status=SubscriptionStatusEnum.active,
            next_billing_date=date.today(),
            started_at=datetime.now(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        subscription_dict = subscription.to_dict()
        assert isinstance(subscription_dict, dict)
        assert subscription_dict["status"] == SubscriptionStatusEnum.active

    def test_subscription_status_enum_values(self):
        """Test SubscriptionStatusEnum has correct values"""
        assert SubscriptionStatusEnum.active == "active"
        assert SubscriptionStatusEnum.paused == "paused"
        assert SubscriptionStatusEnum.cancelled == "cancelled"

    def test_subscription_is_active(self):
        """Test subscription is_active_subscription method"""
        from datetime import date

        subscription = Subscription(
            id=uuid4(),
            donor_id=uuid4(),
            plan_name="Plan",
            amount=Decimal("99000"),
            frequency="monthly",
            status=SubscriptionStatusEnum.active,
            next_billing_date=date.today(),
        )
        assert subscription.is_active_subscription() is True

        subscription.status = SubscriptionStatusEnum.cancelled
        assert subscription.is_active_subscription() is False
