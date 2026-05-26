"""
Unit tests for Product Service
Tests product operations: create, update, delete, get, and categories
"""
import pytest
from decimal import Decimal
from datetime import datetime
from uuid import uuid4
from unittest.mock import MagicMock, patch

from sqlalchemy.orm import Session

from app.services.product_service import ProductService
from app.models.product import Product, Category, Order
from app.schemas.product import ProductCreate, ProductUpdate, ProductQueryParams, CategoryCreate


@pytest.fixture
def mock_db():
    """Create a mock database session"""
    return MagicMock(spec=Session)


@pytest.fixture
def sample_product():
    """Create a sample product"""
    product = MagicMock(spec=Product)
    product.id = str(uuid4())
    product.vendor_id = str(uuid4())
    product.name = "Test Product"
    product.description = "Test Description"
    product.price = Decimal("50000")
    product.voucher_price = Decimal("45000")
    product.stock_quantity = 100
    product.is_active = True
    product.approval_status = "approved"
    product.created_at = datetime.utcnow()
    return product


class TestProductServiceCategory:
    """Test category operations"""

    def test_get_categories(self, mock_db):
        """Test getting categories"""
        category1 = MagicMock(spec=Category)
        category1.name = "Food"
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [category1]
        
        categories = ProductService.get_categories(db=mock_db)
        assert len(categories) == 1
        assert categories[0].name == "Food"

    def test_create_category(self, mock_db):
        """Test creating category"""
        data = CategoryCreate(name="Food", description="Food items")
        
        category = ProductService.create_category(db=mock_db, data=data)
        assert category.name == "Food"
        assert mock_db.add.called
        assert mock_db.commit.called


class TestProductServiceCreate:
    """Test product creation"""

    def test_create_product_success(self, mock_db):
        """Test creating a product successfully"""
        vendor_id = str(uuid4())
        category_id = uuid4()
        data = ProductCreate(
            name="New Product",
            description="Product Description",
            price=Decimal("75000"),
            voucher_price=Decimal("70000"),
            stock_quantity=50,
            unit="pcs",
            category_id=category_id,
            images=[]
        )
        
        product = ProductService.create_product(
            db=mock_db,
            vendor_id=vendor_id,
            data=data
        )
        
        # Verify product was created
        assert product.name == "New Product"
        assert product.approval_status == "pending"
        assert mock_db.add.called
        assert mock_db.commit.called


class TestProductServiceRead:
    """Test product retrieval"""

    def test_get_product_by_id(self, mock_db, sample_product):
        """Test getting product by ID"""
        mock_db.query.return_value.filter.return_value.options.return_value.filter.return_value.first.return_value = sample_product
        
        result = ProductService.get_product_by_id(db=mock_db, product_id=sample_product.id)
        
        assert result == sample_product
        assert result.name == "Test Product"

    def test_get_product_not_found(self, mock_db):
        """Test getting non-existent product"""
        mock_db.query.return_value.filter.return_value.options.return_value.filter.return_value.first.return_value = None
        
        result = ProductService.get_product_by_id(db=mock_db, product_id=str(uuid4()))
        
        assert result is None

    def test_get_products(self, mock_db, sample_product):
        """Test getting products with params"""
        products = [sample_product, sample_product]
        mock_db.query.return_value.filter.return_value.options.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = products
        
        params = ProductQueryParams()
        result = ProductService.get_products(db=mock_db, params=params)
        
        assert len(result) == 2

    def test_get_products_count(self, mock_db):
        """Test getting products count"""
        mock_db.query.return_value.filter.return_value.filter.return_value.count.return_value = 5
        
        params = ProductQueryParams()
        count = ProductService.get_products_count(db=mock_db, params=params)
        
        assert count == 5


class TestProductServiceUpdate:
    """Test product updates"""

    def test_update_product_success(self, mock_db, sample_product):
        """Test updating product successfully"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_product
        
        update_data = ProductUpdate(
            name="Updated Product",
            price=Decimal("60000")
        )
        
        product = ProductService.update_product(
            db=mock_db,
            product_id=sample_product.id,
            vendor_id=sample_product.vendor_id,
            data=update_data
        )
        
        assert product is not None
        assert product.name == "Updated Product"
        assert product.approval_status == "pending"
        assert mock_db.commit.called

    def test_update_product_not_found(self, mock_db):
        """Test updating non-existent product"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = ProductService.update_product(
            db=mock_db,
            product_id=str(uuid4()),
            vendor_id=str(uuid4()),
            data=ProductUpdate(name="Updated")
        )
        
        assert result is None


class TestProductServiceDelete:
    """Test product deletion"""

    def test_delete_product_success(self, mock_db, sample_product):
        """Test deleting product successfully (soft delete)"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_product
        
        # Mock no active orders
        mock_db.query.return_value.join.return_value.filter.return_value.first.return_value = None
        
        result = ProductService.delete_product(db=mock_db, product_id=sample_product.id, vendor_id=sample_product.vendor_id)
        
        assert result is True
        assert sample_product.is_active is False
        assert mock_db.commit.called

    def test_delete_product_not_found(self, mock_db):
        """Test deleting non-existent product"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = ProductService.delete_product(db=mock_db, product_id=str(uuid4()), vendor_id=str(uuid4()))
        assert result is False

    def test_delete_product_with_active_orders(self, mock_db, sample_product):
        """Test deleting product with active orders fails"""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_product
        
        # Mock an active order
        mock_order = MagicMock(spec=Order)
        mock_db.query.return_value.join.return_value.filter.return_value.first.return_value = mock_order
        
        with pytest.raises(ValueError, match="Cannot delete product with active orders"):
            ProductService.delete_product(db=mock_db, product_id=sample_product.id, vendor_id=sample_product.vendor_id)
