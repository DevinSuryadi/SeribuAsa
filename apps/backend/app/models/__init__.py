"""
SQLAlchemy Models
Import all models here for easy access
"""

from app.models.base import BaseModel
from app.models.user import (
    UserProfile,
    DonorProfile,
    BeneficiaryProfile,
    VendorProfile,
    Child,
    GenderEnum
)
from app.models.donation import (
    Donation,
    Voucher,
    VoucherRedemption,
    DonationTypeEnum,
    DonationStatusEnum,
    VoucherStatusEnum
)
from app.models.product import (
    Category,
    Product,
    Order,
    OrderItem,
    OrderStatusEnum,
    PaymentStatusEnum
)
from app.models.nutrition import (
    NutritionMeasurement,
    FIESSurvey,
    Settlement,
    AuditLog,
    NutritionClassificationEnum,
    SettlementStatusEnum,
    Withdrawal,
    WithdrawalStatusEnum,
    StuntingRiskPrediction,
    RiskLevelEnum,
)
from app.models.subscription import (
    Subscription,
    SubscriptionPlan,
    BillingHistory,
    SubscriptionStatusEnum,
    BillingStatusEnum
)
from app.models.cart import (
    CartItem,
    VoucherTransaction,
    VoucherLock,
    VoucherAllowedCategory,
    VoucherTransactionTypeEnum
)
from app.models.wallet import (
    WalletAllocation,
    WalletTransaction,
)
from app.models.facility import (
    HealthFacility,
    RecipientFamily,
    OrderFundingAllocation,
    OrderHandoverToken,
    FacilityOrderReceipt,
    AidDistribution,
    AidDistributionItem,
)

__all__ = [
    # Base
    "BaseModel",
    
    # User models
    "UserProfile",
    "DonorProfile",
    "BeneficiaryProfile",
    "VendorProfile",
    "Child",
    "GenderEnum",
    
    # Donation models
    "Donation",
    "Voucher",
    "VoucherRedemption",
    "DonationTypeEnum",
    "DonationStatusEnum",
    "VoucherStatusEnum",
    
    # Product models
    "Category",
    "Product",
    "Order",
    "OrderItem",
    "OrderStatusEnum",
    "PaymentStatusEnum",
    
    # Cart models
    "CartItem",
    "VoucherTransaction",
    "VoucherLock",
    "VoucherAllowedCategory",
    "VoucherTransactionTypeEnum",
    
    # Nutrition models
    "NutritionMeasurement",
    "FIESSurvey",
    "Settlement",
    "AuditLog",
    "NutritionClassificationEnum",
    "SettlementStatusEnum",
    "Withdrawal",
    "WithdrawalStatusEnum",
    "StuntingRiskPrediction",
    "RiskLevelEnum",
    
    # Subscription models
    "Subscription",
    "SubscriptionPlan",
    "BillingHistory",
    "SubscriptionStatusEnum",
    "BillingStatusEnum",

    # E-Wallet models (new)
    "WalletAllocation",
    "WalletTransaction",
    "HealthFacility",
    "RecipientFamily",
    "OrderFundingAllocation",
    "OrderHandoverToken",
    "FacilityOrderReceipt",
    "AidDistribution",
    "AidDistributionItem",
]
