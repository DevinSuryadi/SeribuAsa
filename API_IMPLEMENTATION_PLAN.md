# SeribuAsa Backend API Implementation Plan

## Comprehensive Analysis for Two New Endpoints

This document provides a complete overview of the SeribuAsa backend API architecture and patterns to guide the implementation of:
1. `GET /api/v1/fies/{beneficiary_id}/latest`
2. `GET /api/v1/nutrition/latest-measurement/{beneficiary_id}`

---

## 1. API STRUCTURE AND DIRECTORY ORGANIZATION

### Backend Directory Structure

```
apps/backend/
├── app/
│   ├── api/                 # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication routes
│   │   ├── donations.py     # Donation endpoints
│   │   ├── fies.py          # FIES survey endpoints (TARGET)
│   │   ├── nutrition.py     # Nutrition measurement endpoints (TARGET)
│   │   ├── orders.py        # Order management
│   │   ├── products.py      # Product catalog
│   │   ├── recommendations.py
│   │   ├── reports.py
│   │   ├── settlements.py
│   │   ├── users.py         # User profile endpoints
│   │   └── vouchers.py
│   ├── models/              # SQLAlchemy database models
│   │   ├── base.py          # Base model class
│   │   ├── donation.py
│   │   ├── nutrition.py     # FIESSurvey, NutritionMeasurement models
│   │   ├── product.py
│   │   └── user.py          # UserProfile, Child models
│   ├── schemas/             # Pydantic validation schemas
│   │   ├── fies.py          # FIES request/response models
│   │   ├── nutrition.py     # Nutrition request/response models
│   │   └── ...
│   ├── services/            # Business logic
│   │   ├── fies_calculator.py    # FIES score calculation
│   │   ├── zscore_calculator.py  # WHO Z-Score calculation
│   │   ├── donation_service.py
│   │   ├── product_service.py
│   │   └── ...
│   ├── middleware/
│   │   └── auth.py          # JWT authentication, role checking
│   ├── database.py          # SQLAlchemy session management
│   ├── config.py            # Configuration and settings
│   └── main.py              # FastAPI app initialization
├── tests/                   # Pytest test suite
└── requirements.txt         # Python dependencies
```

### Main FastAPI Router Registration (main.py)

```python
# API routes registered with /api/v1 prefix
app.include_router(auth.router, prefix="/api/v1")          # /api/v1/auth
app.include_router(users.router, prefix="/api/v1")         # /api/v1/users
app.include_router(donations.router, prefix="/api/v1")     # /api/v1/donations
app.include_router(fies.router, prefix="/api/v1")          # /api/v1/fies
app.include_router(nutrition.router, prefix="/api/v1")     # /api/v1/nutrition
```

---

## 2. EXISTING FIES ENDPOINTS - CURRENT IMPLEMENTATION

### File: `app/api/fies.py`

#### Current Endpoints:

1. **POST /api/v1/fies/submit** (Status 201)
   - Submit a FIES survey for the current user (beneficiary only)
   - Authentication required
   - Validates submission window (only days 1-7 of month)
   - Prevents duplicate submissions within same month
   - Returns: `survey_id`, `score`, `classification`, `next_available_date`

2. **POST /api/v1/fies/calculate** (No auth)
   - Calculate FIES score from raw responses
   - No authentication required
   - Returns: `score`, `classification`, `classification_display`, `recommendations`

3. **GET /api/v1/fies/history/{beneficiary_id}**
   - Fetch all historical FIES surveys for a beneficiary
   - Authentication required
   - Returns: List of surveys with trend analysis
   - Includes: `score_change`, `improving` flag, `previous_classification`

#### FIES Router Definition:
```python
router = APIRouter(prefix="/fies", tags=["fies"])
```

---

## 3. EXISTING NUTRITION ENDPOINTS - CURRENT IMPLEMENTATION

### File: `app/api/nutrition.py`

#### Current Endpoints:

1. **GET /api/v1/nutrition/children**
   - List all children of authenticated beneficiary
   - Authentication required
   - Filters by: `beneficiary_id == current_user.user_id`
   - Returns: List of `ChildResponse` objects with calculated `age_months`

2. **POST /api/v1/nutrition/measurements** (Status 201)
   - Add new nutrition measurement for a child
   - Authentication required
   - Validates child ownership (child must belong to current user)
   - Calculates WHO Z-Scores automatically
   - Returns: `NutritionMeasurementResponse`

3. **GET /api/v1/nutrition/measurements/{child_id}**
   - Fetch all measurements for a child with growth analysis
   - Authentication required
   - Validates child ownership
   - Includes trend analysis: "improving", "stable", "declining"
   - Returns: Comprehensive `NutritionHistoryResponse` with chart data

4. **POST /api/v1/nutrition/zscore** (No auth)
   - Calculate WHO Z-Score from raw measurements
   - No authentication required
   - Returns: `ZScoreResponse` with classifications

#### Nutrition Router Definition:
```python
router = APIRouter(prefix="/nutrition", tags=["nutrition"])
```

---

## 4. DATABASE MODELS - SCHEMA DESIGN

### FIESSurvey Model
**File:** `app/models/nutrition.py`

```python
class FIESSurvey(BaseModel):
    __tablename__ = "fies_surveys"
    
    # Foreign key
    beneficiary_id = Column(UUID(as_uuid=True), 
                           ForeignKey("beneficiary_profiles.user_id", ondelete="CASCADE"), 
                           nullable=False, index=True)
    
    # Survey data
    responses = Column(JSONB, nullable=False)              # 8 question responses
    score = Column(Integer, nullable=False)                # 0-8
    classification = Column(String(50), nullable=False)    # food_secure|moderate|severe
    
    # Survey period
    survey_date = Column(DateTime, nullable=False, index=True)
    survey_month = Column(Integer, nullable=False)         # 1-12
    survey_year = Column(Integer, nullable=False)
    
    # Relationship to beneficiary
    beneficiary_profile = relationship("BeneficiaryProfile", back_populates="fies_surveys")

# Performance indexes
Index("idx_fies_survey_beneficiary_period", 
      FIESSurvey.beneficiary_id, FIESSurvey.survey_year, FIESSurvey.survey_month)
```

### NutritionMeasurement Model
**File:** `app/models/nutrition.py`

```python
class NutritionMeasurement(BaseModel):
    __tablename__ = "nutrition_measurements"
    
    # Foreign key
    child_id = Column(UUID(as_uuid=True), 
                     ForeignKey("children.id", ondelete="CASCADE"), 
                     nullable=False, index=True)
    
    # Measurement data
    measurement_date = Column(Date, nullable=False, index=True)
    weight = Column(Numeric(5, 2), nullable=False)         # kg
    height = Column(Numeric(5, 2), nullable=False)         # cm
    muac = Column(Numeric(5, 2), nullable=True)            # cm
    
    # Z-scores (WHO standards)
    z_score_weight = Column(Numeric(5, 2))
    z_score_height = Column(Numeric(5, 2))
    z_score_weight_height = Column(Numeric(5, 2))
    
    # Classification
    classification = Column(String(50))                    # normal|moderate_malnourished|severe_malnourished
    
    # Relationship to child
    child = relationship("Child", back_populates="nutrition_measurements")

# Performance indexes
Index("idx_nutrition_measurement_child_date", 
      NutritionMeasurement.child_id, NutritionMeasurement.measurement_date)
```

### Child Model (for reference)
**File:** `app/models/user.py`

```python
class Child(BaseModel):
    __tablename__ = "children"
    
    # Foreign key to beneficiary
    beneficiary_id = Column(UUID(as_uuid=True), 
                           ForeignKey("beneficiary_profiles.user_id", ondelete="CASCADE"), 
                           nullable=False, index=True)
    
    # Child info
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(Enum(GenderEnum))
    
    # Relationships
    beneficiary_profile = relationship("BeneficiaryProfile", back_populates="children")
    nutrition_measurements = relationship("NutritionMeasurement", back_populates="child", cascade="all, delete-orphan")
```

---

## 5. PYDANTIC SCHEMAS - REQUEST/RESPONSE VALIDATION

### FIES Schemas
**File:** `app/schemas/fies.py`

```python
class FIESResponse(BaseModel):
  
