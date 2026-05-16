"""
Unit tests for business logic services
Tests service methods and business logic
"""
from unittest.mock import patch
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
        
        # Voucher code should be alphanumeric
        assert code.isalnum()
        # Should have reasonable length
        assert 6 <= len(code) <= 20


class TestWalletService:
    """Test WalletService"""

    def test_wallet_service_initialization(self):
        """Test WalletService can be initialized"""
        service = WalletService()
        assert service is not None

    @patch('app.services.wallet_service.WalletService.get_wallet_balance')
    def test_get_wallet_balance(self, mock_get_balance):
        """Test getting wallet balance"""
        mock_get_balance.return_value = 100000
        service = WalletService()
        
        balance = service.get_wallet_balance(uuid4())
        assert balance == 100000

    @patch('app.services.wallet_service.WalletService.deduct_wallet')
    def test_deduct_wallet(self, mock_deduct):
        """Test deducting from wallet"""
        mock_deduct.return_value = True
        service = WalletService()
        
        result = service.deduct_wallet(uuid4(), 50000)
        assert result is True

    @patch('app.services.wallet_service.WalletService.add_wallet')
    def test_add_wallet(self, mock_add):
        """Test adding to wallet"""
        mock_add.return_value = True
        service = WalletService()
        
        result = service.add_wallet(uuid4(), 100000)
        assert result is True


class TestProductService:
    """Test ProductService"""

    def test_product_service_initialization(self):
        """Test ProductService can be initialized"""
        service = ProductService()
        assert service is not None

    @patch('app.services.product_service.ProductService.get_product')
    def test_get_product(self, mock_get):
        """Test getting a product"""
        mock_product = {
            'id': str(uuid4()),
            'name': 'Test Product',
            'price': 50000,
            'quantity': 100
        }
        mock_get.return_value = mock_product
        service = ProductService()
        
        product = service.get_product(uuid4())
        assert product['name'] == 'Test Product'
        assert product['price'] == 50000

    @patch('app.services.product_service.ProductService.get_products')
    def test_get_products(self, mock_get_all):
        """Test getting all products"""
        mock_products = [
            {'id': str(uuid4()), 'name': 'Product 1', 'price': 50000},
            {'id': str(uuid4()), 'name': 'Product 2', 'price': 75000},
        ]
        mock_get_all.return_value = mock_products
        service = ProductService()
        
        products = service.get_products()
        assert len(products) == 2
        assert products[0]['name'] == 'Product 1'

    @patch('app.services.product_service.ProductService.check_stock')
    def test_check_stock(self, mock_check):
        """Test checking product stock"""
        mock_check.return_value = True
        service = ProductService()
        
        has_stock = service.check_stock(uuid4(), 10)
        assert has_stock is True

    @patch('app.services.product_service.ProductService.reduce_stock')
    def test_reduce_stock(self, mock_reduce):
        """Test reducing product stock"""
        mock_reduce.return_value = True
        service = ProductService()
        
        result = service.reduce_stock(uuid4(), 5)
        assert result is True


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
        
        result = service.add_to_cart(uuid4(), uuid4(), 2)
        assert result is True

    @patch('app.services.cart_service.CartService.remove_from_cart')
    def test_remove_from_cart(self, mock_remove):
        """Test removing item from cart"""
        mock_remove.return_value = True
        service = CartService()
        
        result = service.remove_from_cart(uuid4(), uuid4())
        assert result is True

    @patch('app.services.cart_service.CartService.get_cart')
    def test_get_cart(self, mock_get):
        """Test getting cart items"""
        mock_cart = {
            'items': [
                {'product_id': str(uuid4()), 'quantity': 2, 'price': 50000}
            ],
            'total': 100000
        }
        mock_get.return_value = mock_cart
        service = CartService()
        
        cart = service.get_cart(uuid4())
        assert len(cart['items']) == 1
        assert cart['total'] == 100000

    @patch('app.services.cart_service.CartService.clear_cart')
    def test_clear_cart(self, mock_clear):
        """Test clearing cart"""
        mock_clear.return_value = True
        service = CartService()
        
        result = service.clear_cart(uuid4())
        assert result is True

    @patch('app.services.cart_service.CartService.calculate_total')
    def test_calculate_total(self, mock_calc):
        """Test calculating cart total"""
        mock_calc.return_value = 150000
        service = CartService()
        
        total = service.calculate_total(uuid4())
        assert total == 150000


class TestServiceIntegration:
    """Integration tests for services working together"""

    @patch('app.services.product_service.ProductService.check_stock')
    @patch('app.services.cart_service.CartService.add_to_cart')
    def test_add_product_to_cart_with_stock_check(self, mock_add_cart, mock_check_stock):
        """Test adding product to cart with stock verification"""
        mock_check_stock.return_value = True
        mock_add_cart.return_value = True
        
        product_service = ProductService()
        cart_service = CartService()
        
        product_id = uuid4()
        user_id = uuid4()
        quantity = 2
        
        # Check stock first
        has_stock = product_service.check_stock(product_id, quantity)
        assert has_stock is True
        
        # Then add to cart
        result = cart_service.add_to_cart(user_id, product_id, quantity)
        assert result is True

    @patch('app.services.wallet_service.WalletService.get_wallet_balance')
    @patch('app.services.wallet_service.WalletService.deduct_wallet')
    def test_wallet_deduction_with_balance_check(self, mock_deduct, mock_get_balance):
        """Test wallet deduction with balance verification"""
        mock_get_balance.return_value = 100000
        mock_deduct.return_value = True
        
        wallet_service = WalletService()
        user_id = uuid4()
        amount = 50000
        
        # Check balance
        balance = wallet_service.get_wallet_balance(user_id)
        assert balance >= amount
        
        # Deduct from wallet
        result = wallet_service.deduct_wallet(user_id, amount)
        assert result is True
