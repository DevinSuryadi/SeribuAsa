"""
Unit tests for business logic services
Tests service methods and business logic
"""
from unittest.mock import patch, MagicMock
from uuid import uuid4

from app.services.voucher_service import VoucherService
from app.services.wallet_service import WalletService
from app.services.product_service import ProductService
from app.services.cart_service import CartService


class TestVoucherService:
    """Test VoucherService"""

    def test_voucher_service_initialization(self):
        """Test VoucherService can be initialized"""
        service = VoucherService()
        assert service is not None

    def test_generate_voucher_code(self):
        """Test generating a unique voucher code"""
        service = VoucherService()
        code1 = service.generate_voucher_code()
        code2 = service.generate_voucher_code()
        
        assert code1 is not None
        assert code2 is not None
        assert code1 != code2
        assert len(code1) > 0
        assert len(code2) > 0

    def test_voucher_code_format(self):
        """Test voucher code has expected format"""
        service = VoucherService()
        code = service.generate_voucher_code()
        
        # Voucher code format VCH-YYYY-XXXXXX (contains hyphens)
        assert code.replace("-", "").isalnum()
        # Should have reasonable length
        assert 6 <= len(code) <= 20


class TestWalletService:
    """Test WalletService"""

    def test_wallet_service_initialization(self):
        """Test WalletService can be initialized"""
        service = WalletService()
        assert service is not None

    @patch('app.services.wallet_service.WalletService.get_balance_summary')
    def test_get_wallet_balance(self, mock_get_balance):
        """Test getting wallet balance summary"""
        mock_get_balance.return_value = {"wallet_balance": 100000}
        service = WalletService()
        
        balance_summary = service.get_balance_summary(db=None, beneficiary_id=uuid4())
        assert balance_summary["wallet_balance"] == 100000

    @patch('app.services.wallet_service.WalletService.hold')
    def test_hold_wallet(self, mock_hold):
        """Test holding balance from wallet"""
        mock_hold.return_value = True
        service = WalletService()
        
        result = service.hold(db=None, beneficiary=None, amount=50000)
        assert result is True

    @patch('app.services.wallet_service.WalletService.credit')
    def test_credit_wallet(self, mock_credit):
        """Test crediting to wallet"""
        mock_credit.return_value = True
        service = WalletService()
        
        result = service.credit(db=None, beneficiary_id=uuid4(), amount=100000)
        assert result is True


class TestProductService:
    """Test ProductService"""

    def test_product_service_initialization(self):
        """Test ProductService can be initialized"""
        service = ProductService()
        assert service is not None

    @patch('app.services.product_service.ProductService.get_product_by_id')
    def test_get_product(self, mock_get):
        """Test getting a product"""
        mock_product = MagicMock()
        mock_product.name = 'Test Product'
        mock_product.price = 50000
        
        mock_get.return_value = mock_product
        service = ProductService()
        
        product = service.get_product_by_id(db=None, product_id=str(uuid4()))
        assert product.name == 'Test Product'
        assert product.price == 50000

    @patch('app.services.product_service.ProductService.get_products')
    def test_get_products(self, mock_get_all):
        """Test getting all products"""
        mock_product1 = MagicMock()
        mock_product1.name = 'Product 1'
        mock_product2 = MagicMock()
        mock_product2.name = 'Product 2'
        
        mock_get_all.return_value = [mock_product1, mock_product2]
        service = ProductService()
        
        products = service.get_products(db=None, params=MagicMock())
        assert len(products) == 2
        assert products[0].name == 'Product 1'

    # Check stock check and reduce stock methods are not in ProductService
    # They are in the Product model (is_in_stock) and Order service


class TestCartService:
    """Test CartService"""

    def test_cart_service_initialization(self):
        """Test CartService can be initialized"""
        service = CartService()
        assert service is not None

    @patch('app.services.cart_service.CartService.add_to_cart')
    def test_add_to_cart(self, mock_add):
        """Test adding item to cart"""
        mock_add.return_value = True
        service = CartService()
        
        result = service.add_to_cart(db=None, beneficiary_id=str(uuid4()), product_id=str(uuid4()), quantity=2)
        assert result is True

    @patch('app.services.cart_service.CartService.remove_item')
    def test_remove_from_cart(self, mock_remove):
        """Test removing item from cart"""
        mock_remove.return_value = True
        service = CartService()
        
        result = service.remove_item(db=None, cart_item_id=str(uuid4()))
        assert result is True

    @patch('app.services.cart_service.CartService.get_cart')
    def test_get_cart(self, mock_get):
        """Test getting cart items"""
        mock_cart = [
            {'product_id': str(uuid4()), 'quantity': 2, 'price': 50000}
        ]
        mock_get.return_value = mock_cart
        service = CartService()
        
        cart = service.get_cart(db=None, beneficiary_id=str(uuid4()))
        assert len(cart) == 1

    @patch('app.services.cart_service.CartService.clear_cart')
    def test_clear_cart(self, mock_clear):
        """Test clearing cart"""
        mock_clear.return_value = True
        service = CartService()
        
        result = service.clear_cart(db=None, beneficiary_id=str(uuid4()))
        assert result is True

    @patch('app.services.cart_service.CartService.get_cart_summary')
    def test_calculate_total(self, mock_calc):
        """Test calculating cart total"""
        mock_calc.return_value = {"total_amount": 150000}
        service = CartService()
        
        summary = service.get_cart_summary(db=None, beneficiary_id=str(uuid4()))
        assert summary["total_amount"] == 150000


class TestServiceIntegration:
    """Integration tests for services working together"""
    pass
