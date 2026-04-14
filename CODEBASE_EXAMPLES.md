# Codebase Examples - Reference Implementations

This document provides actual code excerpts from the SeribuAsa codebase showing patterns you should follow.

---

## EXAMPLE 1: Single Resource GET (User Profile)

**File:** `apps/backend/app/api/users.py` (lines 177-193)

```python
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
```

**Key Patterns:**
- Simple filter() + .first() pattern
- Explicit 404 check
- HTTPException with correct status code
- Response model decorator for automatic validation

---

## EXAMPLE 2: Single Resource GET with Relationship Check (Product)

**File:** `apps/backend/app/api/products.py` (lines 86-98)

```python
@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: Session = Depends(get_db)):
    """Get product by ID"""
    product = ProductService.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    p_dict = ProductResponse.model_validate(product).model_dump()
    if product.category:
        p_dict["category_name"] = product.category.name
    if product.vendor_profile:
        p_dict["vendor_store_name"] = product.vendor_profile.store_name
    return ProductResponse(**p_dict)
```

**Key Patterns:**
- Service layer abstraction for query logic
- Enrich response with related data (category, vendor)
- Use model_validate() for schema conversion
- Check related objects before accessing

---

## EXAMPLE 3: GET with Ownership Validation (Donation)

**File:** `apps/backend/app/api/donations.py` (lines 110-148)

```python
@router.get("/{donation_id}", response_model=DonationWithImpact)
async def get_donation(
    donation_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get donation by ID with impact metrics"""
    donation = DonationService.get_donation_by_id(
        db=db,
        donation_id=donation_id,
        donor_id=current_user.user_id  # <- Ownership validation
    )
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
    recipient_name = None
    if donation.recipient_id:
        from app.models.user import BeneficiaryProfile
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == donation.recipient_id
        ).first()
        if beneficiary:
            recipient_name = beneficiary.user_profile.full_name
    
    children_helped = 1 if donation.recipient_id else 0
    months_of_support = 0
    if donation.subscription_config:
        months_of_support = donation.subscription_config.get("duration_months", 0)
    
    donation_dict = DonationResponse.model_validate(donation).model_dump()
    donation_dict["recipient_name"] = recipient_name
    donation_dict["children_helped"] = children_helped
    donation_dict["months_of_support"] = months_of_support
    
    return DonationWithImpact(**donation_dict)
```

**Key Patterns:**
- Authentication required via `Depends(get_current_user)`
- Ownership validation in service layer (pass current_user.user_id)
- Complex response building with optional fields
- Safe nested object access (check if exists before using)

---

## EXAMPLE 4: History GET (Multiple Records Ordered)

**File:** `apps/backend/app/api/nutrition.py` (lines 119-179)

```python
@router.get("/measurements/{child_id}")
async def get_measurement_history(
    child_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get growth measurement history for child"""
    # Verify child belongs to beneficiary
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.beneficiary_id == current_user.user_id,
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or not yours",
        )

    # Query with ordering
    measurements = (
        db.query(NutritionMeasurement)
        .filter(NutritionMeasurement.child_id == child_id)
        .order_by(NutritionMeasurement.measurement_date.desc())  # MOST RECENT FIRST
        .all()
    )

    # Calculate age
    today = date.today()
    age_months = max(0, (today.year - child.date_of_birth.year) * 12 + 
                     (today.month - child.date_of_birth.month))
    age_months = min(60, age_months)

    gender = child.gender.value if child.gender else "male"
    chart_data = ZScoreCalculator.get_growth_chart_data(age_months, gender)

    # Determine trend
    trend = "stable"
    if len(measurements) >= 2:
        latest_z = measurements[0].z_score_weight        # FIRST = LATEST (DESC order)
        prev_z = measurements[1].z_score_weight
        if latest_z and prev_z:
            if float(latest_z) > float(prev_z) + 0.3:
                trend = "improving"
            elif float(latest_z) < float(prev_z) - 0.3:
                trend = "declining"

    chart_data["trend"] = trend

    return {
        "success": True,
        "data": NutritionHistoryResponse(
            child=ChildInfo(...),
            measurements=[NutritionMeasurementResponse.model_validate(m) for m in measurements],
            growth_chart_data=GrowthChartData(**chart_data),
        ).model_dump(),
    }
```

**Key Patterns:**
- Multiple filter conditions: `Child.id AND beneficiary_id`
- Ownership validation before returning data
- `.order_by(...desc()).all()` for reverse chronological order
- Access first element `[0]` for latest when using `.all()`
- Response wrapper: `{"success": True, "data": {...}}`
- Calculation of computed fields (age_months, trend)

---

## EXAMPLE 5: FIES History with Trend (Most Similar to Your Need)

**File:** `apps/backend/app/api/fies.py` (lines 80-114)

```python
@router.get("/history/{beneficiary_id}")
async def get_fies_history(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get FIES survey history for beneficiary"""
    history = FIESCalculator.get_history(db, beneficiary_id)

    surveys = [
        FIESSurveyHistoryItem(
            id=s.id,
            score=s.score,
            classification=s.classification,
            survey_date=s.survey_date,
            survey_month=s.survey_month,
            survey_year=s.survey_year,
        )
        for s in history["surveys"]
    ]

    trend = FIESSurveyTrend(
        improving=history["trend"]["improving"],
        score_change=history["trend"]["score_change"],
        previous_classification=history["trend"]["previous_classification"],
    )

    return {
        "success": True,
        "data": FIESSurveyHistoryResponse(
            beneficiary_id=beneficiary_id,
            surveys=surveys,
            trend=trend,
        ).model_dump(),
    }
```

**Service Layer (`fies_calculator.py` lines 133-157):**

```python
@staticmethod
def get_history(db: Session, beneficiary_id: str) -> dict:
    """Get FIES survey history with trend analysis"""
    surveys = (
        db.query(FIESSurvey)
        .filter(FIESSurvey.beneficiary_id == beneficiary_id)
        .order_by(FIESSurvey.survey_date.desc())  # NEWEST FIRST
        .all()
    )

    trend = {"improving": False, "score_change": 0, "previous_classification": None}

    if len(surveys) >= 2:
        latest = surveys[0]
        previous = surveys[1]
        trend["score_change"] = latest.score - previous.score
        trend["improving"] = latest.score < previous.sco
