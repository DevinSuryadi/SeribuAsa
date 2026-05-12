"""
Unit tests for Product Service
Tests product operations: create, update, delete, search, and filtering
"""
import pytest
from decimal import Decimal
from datetime import datetime
from uuid import uuid4
from unittest.mock import MagicMock, patch

from sqlalchemy.orm import Session

from app.services.product_service import ProductService
from app.models.product import Product, ProductCategory


@pytest.fixture
def mock_db():
    """Create a mock database session"""
    return MagicMock(spec=Session)


@pytest.fixture
def sample_product():
    """Create a sample product"""
    product = MagicMock(spec=Product)
    product.id = uuid4()
    product.name = "Test Product"
    product.description = "Test Description"
    product.price = Decimal("50000")
    product.stock = 100
    product.is_active = True
    product.created_at = datetime.utcnow()
    return product


class TestProductServiceCreate:
    """Test product creation"""

    def test_create_product_success(self, mock_db):
        """Test creating a product successfully"""
        product_data = {
            "name": "New Product",
            "description": "Product Description",
            "price": Decimal("75000"),
            "stock": 50,
            "category_id": uuid4(),
            "vendor_id": uuid4()
        }
        
        result = ProductService.create_product(
            db=mock_db,
            **product_data
        )
        
        # Verify product was created
        assert mock_db.add.called

    def test_create_product_with_invalid_price(self, mock_db):
        """Test creating product with invalid price"""
        product_data = {
            "name": "Product",
            "price": Decimal("-100"),  # Negative price
            "stock": 50
        }
        
        # Should fail or raise error
        with pytest.raises(Exception):
            ProductService.create_product(db=mock_db, **product_data)

    def test_create_product_with_invalid_stock(self, mock_db):
        """Test creating product with invalid stock"""
        product_data = {
            "name": "Product",
            "price": Decimal("50000"),
            "stock": -10  # Negative stock
        }
        
        # Should fail or raise error
        with pytest.raises(Exception):
            ProductService.create_product(db=mock_db, **product_data)

    def test_create_product_missing_required_fields(self, mock_db):
        """Test creating product with missing required fields"""
        product_data = {
            "description": "Missing name and price"
        }
        
        # Should fail due to missing fields
        with pytest.raises(Exception):
            ProductService.create_product(db=mock_db, **product_data)


class TestProductServiceRead:
    """Test product retrieval"""

    def test_get_product_by_id(self, mock_db, sample_product):
        """Test getting product by ID"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_product
        
        result = ProductService.get_product(db=mock_db, product_id=sample_product.id)
        
        assert result == sample_product
        assert result.name == "Test Product"

    def test_get_product_not_found(self, mock_db):
        """Test getting non-existent product"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = ProductService.get_product(db=mock_db, product_id=uuid4())
        
        assert result is None

    def test_get_all_products(self, mock_db, sample_product):
        """Test getting all products"""
        products = [sample_product, sample_product]
        mock_db.query.return_value.all.return_value = products
        
        result = ProductService.get_all_products(db=mock_db)
        
        assert len(result) == 2

    def test_get_active_products(self, mock_db, sample_product):
        """Test getting only active products"""
        sample_product.is_active = True
        products = [sample_product]
        mock_db.query.return_value.filter.return_value.all.return_value = products
        
        result = ProductService.get_active_products(db=mock_db)
        
        assert len(result) == 1
        assert result[0].is_active is True


class TestProductServiceUpdate:
    """Test product updates"""

    def test_update_product_success(self, mock_db, sample_product):
        """Test updating product successfully"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_product
        
        update_data = {
            "name": "Updated Product",
            "price": Decimal("60000")
        }
        
        result = ProductService.update_product(
            db=mock_db,
            product_id=sample_product.id,
            **update_data
        )
        
        assert mock_db.add.called

    def test_update_product_not_found(self, mock_db):
        """Test updating non-existent product"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(Exception):
            ProductService.update_product(
                db=mock_db,
                product_id=uuid4(),
                name="Updated"
            )

    def test_update_product_price(self, mock_db, sample_product):
        """Test updating product price"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_product
        
        new_price = Decimal("100000")
        ProductService.update_product(
            db=mock_db,
            product_id=sample_product.id,
            price=new_price
        )
        
        assert mock_db.add.called

    def test_update_product_stock(self, mock_db, sample_product):
        """Test updating product stock"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_product
        
        new_stock = 200
        ProductService.update_product(
            db=mock_db,
            product_id=sample_product.id,
            stock=new_stock
        )
        
        assert mock_db.add.called


class TestProductServiceDelete:
    """Test product deletion"""

    def test_delete_product_success(self, mock_db, sample_product):
        """Test deleting product successfully"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_product
        
        result = ProductService.delete_product(db=mock_db, product_id=sample_product.id)
        
        assert mock_db.delete.called or mock_db.add.called

    def test_delete_product_not_found(self, mock_db):
        """Test deleting non-existent product"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(Exception):
            ProductService.delete_product(db=mock_db, product_id=uuid4())

    def test_soft_delete_product(self, mock_db, sample_product):
        """Test soft deleting product (marking as inactive)"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_product
        
        ProductService.soft_delete_product(db=mock_db, product_id=sample_product.id)
        
        assert mock_db.add.called


class TestProductServiceSearch:
    """Test product search and filtering"""

    def test_search_products_by_name(self, mock_db, sample_product):
        """Test searching products by name"""
        products = [sample_product]
        mock_db.query.return_value.filter.return_value.all.return_value = products
        
        result = ProductService.search_products(db=mock_db, query="Test")
        
        assert len(result) >= 0

    def test_search_products_by_category(self, mock_db, sample_product):
        """Test searching products by category"""
        category_id = uuid4()
        products = [sample_product]
        mock_db.query.return_value.filter.return_value.all.return_value = products
        
        result = ProductService.search_products(db=mock_db, category_id=category_id)
        
        assert isinstance(result, list)

    def test_search_products_by_price_range(self, mock_db, sample_product):
        """Test searching products by price range"""
        products = [sample_product]
        mock_db.query.return_value.filter.return_value.all.return_value = products
        
        result = ProductService.search_products(
            db=mock_db,
            min_price=Decimal("40000"),
            max_price=Decimal("60000")
        )
        
        assert isinstance(result, list)

    def test_search_products_empty_result(self, mock_db):
        """Test search with no results"""
        mock_db.query.return_value.filter.return_value.all.return_value = []
        
        result = ProductService.search_products(db=mock_db, query="NonExistent")
        
        assert len(result) == 0


class TestProductServiceStock:
    """Test product stock management"""

    def test_increase_stock(self, mock_db, sample_product):
        """Test increasing product stock"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_product
        
        initial_stock = sample_product.stock
        ProductService.increase_stock(db=mock_db, product_id=sample_product.id, quantity=10)
        
        assert mock_db.add.called

    def test_decrease_stock(self, mock_db, sample_product):
        """Test decreasing product stock"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_product
        
        ProductService.decrease_stock(db=mock_db, product_id=sample_product.id, quantity=10)
        
        assert mock_db.add.called

    def test_decrease_stock_insufficient(self, mock_db, sample_product):
        """Test decreasing stock with insufficient quantity"""
        sample_product.stock = 5
        mock_db.query.return_value.filter.return_value.first.return_value = sample_product
        
        # Should fail or raise error
        with pytest.raises(Exception):
            ProductService.decrease_stock(db=mock_db, product_id=sample_product.id, quantity=10)

    def test_check_stock_availability(self, mock_db, sample_product):
        """Test checking if product is in stock"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_product
        
        is_available = ProductService.is_in_stock(db=mock_db, product_id=sample_product.id, quantity=50)
        
        assert isinstance(is_available, bool)


class TestProductServiceValidation:
    """Test product validation"""

    def test_validate_product_name(self):
        """Test product name validation"""
        # Valid names
        assert ProductService.validate_product_name("Valid Product Name") is True
        
        # Invalid names
        assert ProductService.validate_product_name("") is False
        assert ProductService.validate_product_name("A" * 256) is False

    def test_validate_product_price(self):
        """Test product price validation"""
        # Valid prices
        assert ProductService.validate_product_price(Decimal("50000")) is True
        
        # Invalid prices
        assert ProductService.validate_product_price(Decimal("-100")) is False
        assert ProductService.validate_product_price(Decimal("0")) is False

    def test_validate_product_stock(self):
        """Test product stock validation"""
        # Valid stock
        assert ProductService.validate_product_stock(100) is True
        
        # Invalid stock
        assert ProductService.validate_product_stock(-10) is False


class TestProductServiceBulkOperations:
    """Test bulk product operations"""

    def test_bulk_create_products(self, mock_db):
        """Test creating multiple products at once"""
        products_data = [
            {"name": "Product 1", "price": Decimal("50000"), "stock": 100},
            {"name": "Product 2", "price": Decimal("60000"), "stock": 150},
            {"name": "Product 3", "price": Decimal("70000"), "stock": 200},
        ]
        
        result = ProductService.bulk_create_products(db=mock_db, products=products_data)
        
        assert isinstance(result, list)

    def test_bulk_update_products(self, mock_db):
        """Test updating multiple products at once"""
        updates = [
            {"id": uuid4(), "price": Decimal("55000")},
            {"id": uuid4(), "price": Decimal("65000")},
        ]
        
        result = ProductService.bulk_update_products(db=mock_db, updates=updates)
        
        assert isinstance(result, list)

    def test_bulk_delete_products(self, mock_db):
        """Test deleting multiple products at once"""
        product_ids = [uuid4(), uuid4(), uuid4()]
        
        result = ProductService.bulk_delete_products(db=mock_db, product_ids=product_ids)
        
        assert isinstance(result, bool)
