"""Facility-run beneficiary records and auditable donation funding."""

from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid as UUID,
)
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class HealthFacility(BaseModel):
    __tablename__ = "health_facilities"
    __table_args__ = (
        UniqueConstraint("account_user_id", name="uq_health_facilities_account_user_id"),
    )

    account_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user_profiles.user_id", ondelete="RESTRICT"),
        nullable=False,
    )
    name = Column(String(255), nullable=False)
    facility_type = Column(String(100))
    address = Column(Text)
    phone = Column(String(20))
    approval_status = Column(String(30), nullable=False, default="pending")

    families = relationship("RecipientFamily", back_populates="health_facility")


class RecipientFamily(BaseModel):
    __tablename__ = "recipient_families"
    __table_args__ = (
        CheckConstraint("length(kk_number) = 16", name="ck_recipient_families_kk_length"),
        CheckConstraint("family_size IS NULL OR family_size > 0", name="ck_recipient_families_family_size"),
        UniqueConstraint("kk_number", name="uq_recipient_families_kk_number"),
        UniqueConstraint("legacy_beneficiary_user_id", name="uq_recipient_families_legacy_user_id"),
        UniqueConstraint("id", "health_facility_id", name="uq_recipient_families_id_facility"),
        Index("ix_recipient_families_facility_active", "health_facility_id", "is_active"),
    )

    health_facility_id = Column(
        UUID(as_uuid=True),
        ForeignKey("health_facilities.id", ondelete="RESTRICT"),
        nullable=False,
    )
    kk_number = Column(String(16), nullable=False)
    head_name = Column(String(255), nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    family_size = Column(Integer)
    legacy_beneficiary_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("beneficiary_profiles.user_id", ondelete="SET NULL"),
        nullable=True,
    )

    health_facility = relationship("HealthFacility", back_populates="families")
    children = relationship("Child", back_populates="recipient_family")
    fies_surveys = relationship("FIESSurvey", back_populates="recipient_family")
    aid_plans = relationship("FamilyAidPlan", back_populates="family")


class FamilyAidPlan(BaseModel):
    """Immutable plan revision recorded against a family's assessment sources."""

    __tablename__ = "family_aid_plans"
    __table_args__ = (
        CheckConstraint("priority IN ('low', 'medium', 'high')", name="ck_family_aid_plans_priority"),
        Index("ix_family_aid_plans_family_created", "family_id", "created_at"),
    )

    family_id = Column(UUID(as_uuid=True), ForeignKey("recipient_families.id", ondelete="RESTRICT"), nullable=False)
    recorded_by_user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.user_id", ondelete="RESTRICT"), nullable=False)
    priority = Column(String(20), nullable=False)
    needs_summary = Column(Text, nullable=False)
    planned_action = Column(Text, nullable=False)
    review_date = Column(Date)
    basis_snapshot = Column(JSON, nullable=False)

    family = relationship("RecipientFamily", back_populates="aid_plans")


class OrderFundingAllocation(BaseModel):
    __tablename__ = "order_funding_allocations"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_order_funding_allocations_positive_amount"),
        CheckConstraint(
            "status IN ('reserved', 'spent', 'released')",
            name="ck_order_funding_allocations_status",
        ),
        UniqueConstraint("donation_id", "order_id", name="uq_order_funding_donation_order"),
        Index("ix_order_funding_allocations_order_status", "order_id", "status"),
        Index("ix_order_funding_allocations_donation_status", "donation_id", "status"),
    )

    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.id", ondelete="RESTRICT"), nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    status = Column(String(20), nullable=False, default="reserved")
    reserved_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    spent_at = Column(DateTime)
    released_at = Column(DateTime)


class OrderHandoverToken(BaseModel):
    __tablename__ = "order_handover_tokens"
    __table_args__ = (
        UniqueConstraint("id", "order_id", name="uq_order_handover_tokens_id_order"),
        UniqueConstraint("token_hash", name="uq_order_handover_tokens_hash"),
    )

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    consumed_at = Column(DateTime)
    consumed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.user_id", ondelete="SET NULL"))


class FacilityOrderReceipt(BaseModel):
    __tablename__ = "facility_order_receipts"
    __table_args__ = (
        ForeignKeyConstraint(
            ["handover_token_id", "order_id"],
            ["order_handover_tokens.id", "order_handover_tokens.order_id"],
            ondelete="RESTRICT",
            name="fk_facility_receipt_token_order",
        ),
        UniqueConstraint("order_id", name="uq_facility_order_receipts_order_id"),
        UniqueConstraint("handover_token_id", name="uq_facility_order_receipts_token_id"),
    )

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False)
    handover_token_id = Column(UUID(as_uuid=True), nullable=False)
    received_by_user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.user_id", ondelete="RESTRICT"), nullable=False)
    received_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    notes = Column(Text)


class AidDistribution(BaseModel):
    __tablename__ = "aid_distributions"
    __table_args__ = (
        ForeignKeyConstraint(
            ["order_id", "family_id"], ["orders.id", "orders.family_id"],
            ondelete="RESTRICT", name="fk_aid_distributions_order_family",
        ),
        UniqueConstraint("id", "order_id", name="uq_aid_distributions_id_order"),
        Index("ix_aid_distributions_family_date", "family_id", "distributed_at"),
    )

    order_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    family_id = Column(UUID(as_uuid=True), ForeignKey("recipient_families.id", ondelete="RESTRICT"), nullable=False)
    recorded_by_user_id = Column(
        UUID(as_uuid=True), ForeignKey("user_profiles.user_id", ondelete="RESTRICT"), nullable=False
    )
    distributed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    notes = Column(Text)

    items = relationship("AidDistributionItem", back_populates="distribution")


class AidDistributionItem(BaseModel):
    __tablename__ = "aid_distribution_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_aid_distribution_items_quantity"),
        UniqueConstraint("distribution_id", "order_item_id", name="uq_aid_distribution_item"),
        ForeignKeyConstraint(
            ["distribution_id", "order_id"],
            ["aid_distributions.id", "aid_distributions.order_id"],
            ondelete="RESTRICT", name="fk_aid_distribution_items_distribution_order",
        ),
        ForeignKeyConstraint(
            ["order_item_id", "order_id"],
            ["order_items.id", "order_items.order_id"],
            ondelete="RESTRICT", name="fk_aid_distribution_items_item_order",
        ),
    )

    distribution_id = Column(UUID(as_uuid=True), nullable=False)
    order_item_id = Column(UUID(as_uuid=True), nullable=False)
    order_id = Column(UUID(as_uuid=True), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)

    distribution = relationship("AidDistribution", back_populates="items")
