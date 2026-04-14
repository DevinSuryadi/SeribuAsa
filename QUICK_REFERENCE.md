# Quick Reference: New Endpoints Implementation

## Two New Endpoints to Implement

```
GET /api/v1/fies/{beneficiary_id}/latest
GET /api/v1/nutrition/{beneficiary_id}/latest-measurement
```

---

## File Locations to Modify

| File | Purpose | Line |
|------|---------|------|
| `apps/backend/app/api/fies.py` | Add FIES latest endpoint | After line 114 |
| `apps/backend/app/api/nutrition.py` | Add nutrition latest endpoint | After line 201 |
| `apps/backend/app/schemas/fies.py` | Add FIESLatestResponse schema | After line 80 |
| `apps/backend/app/schemas/nutrition.py` | Add latest measurement schema | After line 94 |
| `apps/backend/app/services/fies_calculator.py` | Add get_latest() method | After line 157 |
| `apps/backend/tests/test_fies.py` | Add tests | After line 119 |
| `apps/backend/tests/test_nutrition.py` | Add tests (create if needed) | New file |

---

## Architecture Overview

```
Request → FastAPI Router → Authentication → Service Layer → Database Query → Response
   ↓           ↓                ↓              ↓               ↓               ↓
GET /fies/:id/latest → fies.py → get_current_user → FIESCalculator → FIESSurvey model → JSON
```

---

## Code Templates

### Template 1: FIES Latest Endpoint

```python
@router.get("/{beneficiary_id}/latest")
async def get_latest_fies(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get latest FIES survey for beneficiary"""
    survey = (
        db.query(FIESSurvey)
        .filter(FIESSurvey.beneficiary_id == beneficiary_id)
        .order_by(FIESSurvey.survey_date.desc())
        .first()
    )
    
    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No FIES survey found for this beneficiary"
        )
    
    return {
        "success": True,
        "data": FIESLatestResponse.model_validate(survey).model_dump()
    }
```

### Template 2: Nutrition Latest Endpoint

```python
@router.get("/{beneficiary_id}/latest-measurement")
async def get_latest_measurement(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get latest nutrition measurement for beneficiary's children"""
    # Get children
    children = db.query(Child).filter(
        Child.beneficiary_id == beneficiary_id
    ).all()
    
    if not children:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No children found for this beneficiary"
        )
    
    # Get latest measurement per child
    results = []
    for child in children:
        latest = (
            db.query(NutritionMeasurement)
            .filter(NutritionMeasurement.child_id == child.id)
            .order_by(NutritionMeasurement.measurement_date.desc())
            .first()
        )
        
        if latest:
            results.append({
                "child_id": str(child.id),
                "child_name": child.full_name,
                "measurement": NutritionMeasurementResponse.model_validate(latest).model_dump()
            })
    
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No measurements found"
        )
    
    return {
        "success": True,
        "data": results
    }
```

---

## Key Points to Remember

✅ **Always use `.first()` not `.all()` for single latest record**
✅ **Order by date DESC for chronological descending**
✅ **Return 404 with descriptive message if not found**
✅ **Use existing response schemas when possible**
✅ **Import statement for UUID: `from uuid import UUID`**
✅ **Database session is auto-closed by FastAPI dependency injection**
✅ **Authentication via `Depends(get_current_user)`**
✅ **Response wrapper: `{"success": True, "data": {...}}`**
✅ **Status codes: 200 OK, 404 Not Found, 500 Server Error**
✅ **Log endpoint entry/exit in endpoints accessing DB**

---

## Database Query Cheat Sheet

### Get Single Latest Record
```python
latest = (
    db.query(Model)
    .filter(Model.beneficiary_id == id)
    .order_by(Model.date_column.desc())
    .first()  # <- This is key
)
```

### Get All Records (Most Recent First)
```python
records = (
    db.query(Model)
    .filter(Model.beneficiary_id == id)
    .order_by(Model.date_column.desc())
    .all()  # <- Returns list
)
if records:
    latest = records[0]  # <- Get latest from list
```

### Filter by Foreign Key
```python
db.query(Child).filter(Child.beneficiary_id == beneficiary_id).all()
```

### Check if Exists
```python
exists = db.query(Model).filter(Model.id == id).first() is not None
```

---

## HTTP Status Codes Reference

| Code | Meaning | When to Use |
|------|---------|------------|
| 200 | OK | GET succeeded, data found |
| 201 | Created | POST succeeded |
| 400 | Bad Request | Invalid input |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate or conflicting state |
| 500 | Server Error | Unexpected exception |

---

## Response Format Examples

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "score": 5,
    "classification": "moderate",
    ...
  }
}
```

### Error Response
```json
{
  "detail": "No FIES survey found for this beneficiary"
}
```

---

## Imports Needed

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.models.nutrition import FIESSurvey, NutritionMeasurement
from app.models.user import Child
from app.schemas.fies import FIESLatestResponse
from app.schemas.nutrition import NutritionLatestMeasurementResponse, NutritionMeasurementResponse
import logging

logger = logging.getLogger(__name__)
```

---

## Testing Checklist

- [ ] Endpoint returns 404 when no data exists
- [ ] Endpoint returns correct latest record (not oldest or random)
- [ ] Authentication required (401 if no token)
- [ ] Response includes "success": true
- [ ] Response includes "data" field
- [ ] Database indexes are utilized (query performance)
- [ ] Ownership validation works (can't access others' data)
- [ ] Multiple children scenario returns all latest measurements

---

## Common Mistakes to Avoid

❌ Using `.all()` then `[0]` instead of `.first()`
❌ Forgetting `.order_by(...desc())` before `.first()`
❌ Returning raw model instead of using schema
❌ Forgetting status 404 raises HTTPException
❌ Not validating resource ownership
❌ Not logging database errors
❌ Using wrong UUID conversion
❌ Forgetting `.model_validate()` for schema conversion

