# Backend Unit Testing Guide

## Status Unit Test

Semua unit test telah dibuat dan siap untuk diintegrasikan ke dalam CI/CD pipeline.

### File Test yang Telah Dibuat

1. **test_utils.py** - Test untuk utility functions
   - VoucherCodeGenerator: Generate dan validasi voucher code
   - BankValidator: Validasi informasi bank account
   - ReportCache & AppCache: Test caching mechanism
   - Total: ~50+ test cases

2. **test_wallet_service.py** - Test untuk wallet service
   - Credit operations: Top-up wallet
   - Hold operations: Lock amount saat checkout
   - Release operations: Debit ke vendor wallet
   - Refund operations: Unlock held amount
   - Expiration: Expire old allocations
   - Total: ~30+ test cases

3. **test_product_service.py** - Test untuk product service
   - Create: Membuat produk baru
   - Read: Mengambil data produk
   - Update: Update informasi produk
   - Delete: Menghapus produk
   - Search & Filter: Pencarian dan filter produk
   - Stock Management: Manajemen stok
   - Bulk Operations: Operasi massal
   - Total: ~40+ test cases

4. **test_donation_service.py** - Test untuk donation service
   - Create: Membuat donasi baru
   - Read: Mengambil data donasi
   - Allocation: Alokasi donasi ke beneficiary
   - Update: Update status donasi
   - Reporting: Laporan dan statistik
   - Validation: Validasi data donasi
   - Integration: Flow lengkap donasi
   - Total: ~40+ test cases

### File Test yang Sudah Ada

- test_admin.py
- test_alerts_smoke.py
- test_api_endpoints.py
- test_auth.py
- test_donation_allocation.py
- test_donations.py
- test_main.py
- test_models.py
- test_services.py
- test_voucher_qr_redemption.py
- test_vouchers.py

**Total: 150+ test cases baru + existing tests**

## Menjalankan Unit Test Secara Lokal

### Prerequisites

```bash
# Install dependencies
pip install -r requirements.txt
```

### Menjalankan Semua Test

```bash
# Run all tests
pytest tests/ -v

# Run with coverage report
pytest tests/ -v --cov=app --cov-report=html

# Run specific test file
pytest tests/test_utils.py -v

# Run specific test class
pytest tests/test_utils.py::TestVoucherCodeGenerator -v

# Run specific test function
pytest tests/test_utils.py::TestVoucherCodeGenerator::test_generate_voucher_code_returns_string -v
```

### Menjalankan Test dengan Coverage

```bash
# Generate coverage report
pytest tests/ --cov=app --cov-report=term-missing --cov-report=html

# View HTML coverage report
# Open htmlcov/index.html in browser
```

### Menjalankan Test dengan Markers

```bash
# Run only unit tests
pytest tests/ -m unit -v

# Run only integration tests
pytest tests/ -m integration -v

# Run tests excluding slow tests
pytest tests/ -m "not slow" -v
```

## Integrasi dengan CI/CD

### GitHub Actions Configuration

Unit test sudah terintegrasi dengan GitHub Actions melalui file:
`.github/workflows/ci-backend.yml`

#### Test Job Configuration

```yaml
test:
  name: Test Backend
  runs-on: ubuntu-latest
  
  steps:
    - Checkout code
    - Setup Python 3.11
    - Install dependencies
    - Create test .env file
    - Run unit tests with coverage
    - Upload coverage reports
```

#### Trigger Conditions

Test akan berjalan otomatis pada:
- Push ke branch: `main`, `staging`, `feature/**`
- Pull request ke branch: `main`, `staging`

### Menjalankan CI Secara Lokal

```bash
# Simulate CI environment
python -m pytest tests/ -v --cov=app --cov-report=term-missing --cov-fail-under=0
```

## Test Coverage Target

| Module | Target Coverage |
|--------|-----------------|
| app/utils | 85%+ |
| app/services | 80%+ |
| app/models | 75%+ |
| app/api | 70%+ |
| Overall | 75%+ |

## Best Practices untuk Testing

### 1. Naming Convention

```python
# Test file: test_<module_name>.py
# Test class: Test<ClassName>
# Test method: test_<functionality>_<scenario>

# Example:
# File: test_wallet_service.py
# Class: TestWalletServiceCredit
# Method: test_credit_increases_balance
```

### 2. Test Structure (Arrange-Act-Assert)

```python
def test_example(self, mock_db):
    # Arrange: Setup test data
    amount = Decimal("100000")
    
    # Act: Execute the function
    result = WalletService.credit(db=mock_db, amount=amount)
    
    # Assert: Verify the result
    assert result is not None
    assert result.amount == amount
```

### 3. Menggunakan Fixtures

```python
@pytest.fixture
def mock_db():
    """Create a mock database session"""
    return MagicMock(spec=Session)

def test_example(self, mock_db):
    # Use fixture
    pass
```

### 4. Mocking External Dependencies

```python
from unittest.mock import MagicMock, patch

def test_with_mock(self):
    with patch('app.services.external_api.call') as mock_call:
        mock_call.return_value = {"status": "success"}
        # Test code here
```

## Troubleshooting

### Test Timeout

Jika test timeout, cek:
1. Database connection
2. External API calls
3. Infinite loops dalam test

### Import Errors

```bash
# Ensure app is in Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
pytest tests/
```

### Database Errors

```bash
# Use in-memory SQLite untuk testing
DATABASE_URL=sqlite:///:memory:
```

## Menambahkan Test Baru

### Template untuk Test Baru

```python
"""
Unit tests for [Module Name]
Tests [functionality description]
"""
import pytest
from unittest.mock import MagicMock

@pytest.fixture
def mock_db():
    """Create a mock database session"""
    return MagicMock()

class TestNewFeature:
    """Test [Feature Name]"""
    
    def test_feature_success(self, mock_db):
        """Test [feature] successfully"""
        # Arrange
        
        # Act
        
        # Assert
        pass
```

### Checklist untuk Test Baru

- [ ] Test file dibuat dengan naming convention yang benar
- [ ] Test class dan method mengikuti naming convention
- [ ] Semua test cases memiliki docstring
- [ ] Test menggunakan fixtures yang sesuai
- [ ] Test menggunakan mocking untuk external dependencies
- [ ] Test mengikuti Arrange-Act-Assert pattern
- [ ] Test berjalan tanpa error
- [ ] Test coverage minimal 70%

## CI/CD Pipeline Status

### Current Status

✅ **Lint Job**: Ruff linter + Mypy type checker
✅ **Test Job**: Pytest dengan coverage report
✅ **Coverage Report**: Upload ke artifacts

### Artifacts

- Coverage report tersimpan di: `apps/backend/htmlcov/`
- Dapat diakses melalui GitHub Actions artifacts

## Monitoring dan Reporting

### Coverage Report

```bash
# Generate coverage report
pytest tests/ --cov=app --cov-report=html

# View report
open htmlcov/index.html
```

### Test Report

```bash
# Generate JUnit XML report
pytest tests/ --junit-xml=test-report.xml

# Generate HTML report
pytest tests/ --html=test-report.html
```

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/advanced/testing-dependencies/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/20/faq/testing.html)
- [Mock Documentation](https://docs.python.org/3/library/unittest.mock.html)

## Contact & Support

Untuk pertanyaan atau issues terkait testing, silakan buat issue di repository atau hubungi tim development.
