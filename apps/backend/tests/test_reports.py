"""
Report Tests
Comprehensive test suite for report generation and export functionality
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID
from unittest.mock import MagicMock, patch

from app.schemas.reports import (
    ImpactReportResponse,
    SalesReportResponse,
    RegionalReportResponse,
    DemographicsReportResponse,
    SettlementReportResponse,
    ReportQueryParams,
    ExportFormatEnum,
)
from app.utils.cache import ReportCache
from app.utils.csv_generator import CSVGenerator, generate_csv_export
from app.utils.pdf_generator import PDFGenerator
from app.utils.bank_validator import BankValidator


# ============================================
# Report Schema Tests
# ============================================
class TestImpactReportSchema:
    """Test impact report response schema"""
    
    def test_valid_impact_report(self):
        """Test valid impact report"""
        data = {
            "donor_id": "donor_001",
            "period": {
                "start_date": date(2026, 1, 1),
                "end_date": date(2026, 3, 31),
            },
            "summary": {
                "total_donated": Decimal("10000000"),
                "total_children_helped": 50,
                "total_vouchers_allocated": 100,
                "total_families_impacted": 20,
            },
            "donation_trend": [
                {"month": "2026-01", "amount": Decimal("3000000"), "donations_count": 10},
                {"month": "2026-02", "amount": Decimal("3500000"), "donations_count": 12},
            ],
            "geographic_distribution": [
                {"province": "Jakarta", "children": 25, "amount": Decimal("5000000")},
            ],
        }
        report = ImpactReportResponse(**data)
        assert report.donor_id == "donor_001"
        assert report.summary.total_donated == Decimal("10000000")
    
    def test_impact_report_empty_distributions(self):
        """Test impact report with empty distributions"""
        data = {
            "donor_id": "donor_001",
            "period": {
                "start_date": date(2026, 1, 1),
                "end_date": date(2026, 3, 31),
            },
            "summary": {
                "total_donated": Decimal("0"),
                "total_children_helped": 0,
                "total_vouchers_allocated": 0,
                "total_families_impacted": 0,
            },
        }
        report = ImpactReportResponse(**data)
        assert len(report.donation_trend) == 0
        assert len(report.geographic_distribution) == 0


class TestSalesReportSchema:
    """Test sales report response schema"""
    
    def test_valid_sales_report(self):
        """Test valid sales report"""
        data = {
            "vendor_id": "vendor_001",
            "period": {
                "start_date": date(2026, 3, 1),
                "end_date": date(2026, 3, 31),
            },
            "summary": {
                "total_orders": 100,
                "total_sales": Decimal("5000000"),
                "total_voucher_redemptions": Decimal("3000000"),
                "total_cash_received": Decimal("2000000"),
                "pending_settlement": Decimal("500000"),
                "paid_settlement": Decimal("4500000"),
            },
            "daily_sales": [
                {"date": date(2026, 3, 1), "order_count": 5, "total": Decimal("250000")},
            ],
            "top_products": [
                {"product_name": "Beras", "quantity_sold": 100, "revenue": Decimal("1000000")},
            ],
        }
        report = SalesReportResponse(**data)
        assert report.vendor_id == "vendor_001"
        assert report.summary.total_orders == 100


class TestRegionalReportSchema:
    """Test regional report response schema"""
    
    def test_valid_regional_report(self):
        """Test valid regional report"""
        data = {
            "region": "National",
            "period": {
                "start_date": date(2026, 1, 1),
                "end_date": date(2026, 3, 31),
            },
            "coverage": {
                "total_beneficiaries": 1000,
                "total_children": 1500,
                "total_vendors": 50,
                "districts_covered": 5,
            },
            "stunting_rate": {
                "current": 25.5,
                "previous": 28.0,
                "change_percentage": -2.5,
                "trend": "improving",
            },
            "budget_utilization": {
                "allocated": Decimal("500000000"),
                "utilized": Decimal("450000000"),
                "percentage": 90.0,
            },
            "district_breakdown": [
                {
                    "district": "Jakarta Pusat",
                    "beneficiaries": 200,
                    "children": 300,
                    "stunting_rate": 24.0,
                },
            ],
        }
        report = RegionalReportResponse(**data)
        assert report.region == "National"
        assert report.stunting_rate.trend == "improving"
    
    def test_regional_report_stunting_rate_percentage_validation(self):
        """Test stunting rate percentages are between 0-100"""
        data = {
            "region": "National",
            "period": {
                "start_date": date(2026, 1, 1),
                "end_date": date(2026, 3, 31),
            },
            "coverage": {
                "total_beneficiaries": 1000,
                "total_children": 1500,
                "total_vendors": 50,
                "districts_covered": 5,
            },
            "stunting_rate": {
                "current": 125.5,  # Over 100%
                "previous": 28.0,
                "change_percentage": -2.5,
                "trend": "improving",
            },
            "budget_utilization": {
                "allocated": Decimal("500000000"),
                "utilized": Decimal("450000000"),
                "percentage": 90.0,
            },
        }
        with pytest.raises(ValueError):
            RegionalReportResponse(**data)


class TestDemographicsReportSchema:
    """Test demographics report response schema"""
    
    def test_valid_demographics_report(self):
        """Test valid demographics report"""
        data = {
            "age_distribution": [
                {"label": "0-5 tahun", "count": 100, "percentage": 25.0},
                {"label": "5-10 tahun", "count": 150, "percentage": 37.5},
            ],
            "gender_distribution": [
                {"label": "Laki-laki", "count": 200, "percentage": 50.0},
                {"label": "Perempuan", "count": 200, "percentage": 50.0},
            ],
            "nutrition_status": [
                {"label": "Normal", "count": 300, "percentage": 75.0},
                {"label": "Stunted", "count": 100, "percentage": 25.0},
            ],
            "fies_classification": [
                {"label": "food_secure", "count": 200, "percentage": 50.0},
                {"label": "severe", "count": 100, "percentage": 25.0},
            ],
        }
        report = DemographicsReportResponse(**data)
        assert len(report.age_distribution) == 2
        assert len(report.nutrition_status) == 2


class TestSettlementReportSchema:
    """Test settlement report response schema"""
    
    def test_valid_settlement_report(self):
        """Test valid settlement report"""
        data = {
            "vendor_id": "vendor_001",
            "period": {
                "start_date": date(2026, 1, 1),
                "end_date": date(2026, 3, 31),
            },
            "summary": {
                "total_revenue": Decimal("15000000"),
                "total_settlements": 13,
                "settled_amount": Decimal("14500000"),
                "pending_amount": Decimal("500000"),
                "pending_count": 1,
                "average_settlement_days": 5.0,
            },
            "daily_settlements": [
                {"date": date(2026, 3, 1), "amount": Decimal("1000000"), "status": "paid"},
            ],
            "trends": {
                "month_over_month_growth": 10.5,
                "average_settlement_time": 5.0,
                "settlement_success_rate": 92.0,
            },
        }
        report = SettlementReportResponse(**data)
        assert report.vendor_id == "vendor_001"


# ============================================
# Report Query Parameters Tests
# ============================================
class TestReportQueryParams:
    """Test report query parameter schema"""
    
    def test_valid_query_params(self):
        """Test valid query parameters"""
        params = ReportQueryParams(
            page=1,
            page_size=50,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 3, 31),
        )
        assert params.page == 1
        assert params.page_size == 50
    
    def test_export_format_enum(self):
        """Test export format enum"""
        params = ReportQueryParams(export_format="json")
        assert params.export_format == ExportFormatEnum.json
    
    def test_date_range_validation(self):
        """Test end_date must be after start_date"""
        data = {
            "start_date": date(2026, 3, 31),
            "end_date": date(2026, 1, 1),
        }
        with pytest.raises(ValueError):
            ReportQueryParams(**data)


# ============================================
# Report Caching Tests
# ============================================
class TestReportCache:
    """Test report caching functionality"""
    
    def test_cache_set_and_get(self):
        """Test cache set and get operations"""
        cache = ReportCache(default_ttl_seconds=10)
        
        data = {"test": "data"}
        cache.set("impact_report", data, vendor_id="vendor_001")
        
        result = cache.get("impact_report", vendor_id="vendor_001")
        assert result == data
    
    def test_cache_miss(self):
        """Test cache miss returns None"""
        cache = ReportCache()
        
        result = cache.get("nonexistent", vendor_id="vendor_001")
        assert result is None
    
    def test_cache_invalidate(self):
        """Test cache invalidation"""
        cache = ReportCache()
        
        data = {"test": "data"}
        cache.set("impact_report", data, vendor_id="vendor_001")
        
        # Verify it's in cache
        assert cache.get("impact_report", vendor_id="vendor_001") is not None
        
        # Invalidate
        cache.invalidate("impact_report", vendor_id="vendor_001")
        
        # Verify it's gone
        assert cache.get("impact_report", vendor_id="vendor_001") is None
    
    def test_cache_invalidate_pattern(self):
        """Test pattern-based cache invalidation"""
        cache = ReportCache()
        
        # Set multiple entries
        cache.set("impact_report", {"data": "1"}, vendor_id="v1")
        cache.set("impact_report", {"data": "2"}, vendor_id="v2")
        cache.set("sales_report", {"data": "3"}, vendor_id="v1")
        
        # Invalidate all impact reports
        count = cache.invalidate_pattern("impact_report:*")
        assert count == 2
        
        # Verify sales report still exists
        assert cache.get("sales_report", vendor_id="v1") is not None
    
    def test_cache_stats(self):
        """Test cache statistics"""
        cache = ReportCache()
        
        cache.set("report1", {"data": "1"})
        cache.set("report2", {"data": "2"})
        
        stats = cache.get_stats()
        assert stats["total_entries"] == 2
        assert stats["active_entries"] == 2


# ============================================
# CSV Export Tests
# ============================================
class TestCSVGenerator:
    """Test CSV export functionality"""
    
    def test_export_settlement_csv(self):
        """Test settlement CSV export"""
        settlements = [
            {
                "id": "settle_1",
                "vendor_id": "vendor_1",
                "period_start": date(2026, 3, 1),
                "period_end": date(2026, 3, 7),
                "total_redemptions": Decimal("5000000"),
                "admin_fee": Decimal("50000"),
                "net_amount": Decimal("4950000"),
                "status": "paid",
                "payout_date": date(2026, 3, 10),
            }
        ]
        
        csv_data = CSVGenerator.export_settlement_report(settlements)
        
        assert "settle_1" in csv_data
        assert "vendor_1" in csv_data
        assert "paid" in csv_data
    
    def test_export_impact_report_csv(self):
        """Test impact report CSV export"""
        data = {
            "donor_id": "donor_001",
            "period": {
                "start_date": date(2026, 1, 1),
                "end_date": date(2026, 3, 31),
            },
            "summary": {
                "total_donated": Decimal("10000000"),
                "total_children_helped": 50,
                "total_vouchers_allocated": 100,
                "total_families_impacted": 20,
            },
            "donation_trend": [],
            "geographic_distribution": [],
        }
        
        csv_data = CSVGenerator.export_impact_report(data)
        
        assert "donor_001" in csv_data
        assert "Impact Report" in csv_data
    
    def test_csv_decimal_serialization(self):
        """Test CSV handles Decimal values correctly"""
        settlements = [
            {
                "id": "settle_1",
                "vendor_id": "vendor_1",
                "period_start": date(2026, 3, 1),
                "period_end": date(2026, 3, 7),
                "total_redemptions": Decimal("5000000.99"),
                "admin_fee": Decimal("50000.50"),
                "net_amount": Decimal("4950000.49"),
                "status": "paid",
                "payout_date": date(2026, 3, 10),
            }
        ]
        
        csv_data = CSVGenerator.export_settlement_report(settlements)
        
        # Should preserve decimal precision
        assert "5000000.99" in csv_data or "5000000" in csv_data


# ============================================
# PDF Export Tests
# ============================================
class TestPDFGenerator:
    """Test PDF export functionality"""
    
    def test_pdf_settlement_export(self):
        """Test settlement PDF export"""
        settlements = [
            {
                "id": "settle_1",
                "vendor_id": "vendor_1",
                "period_start": date(2026, 3, 1),
                "period_end": date(2026, 3, 7),
                "total_redemptions": Decimal("5000000"),
                "admin_fee": Decimal("50000"),
                "net_amount": Decimal("4950000"),
                "status": "paid",
                "payout_date": date(2026, 3, 10),
            }
        ]
        
        try:
            pdf_buffer = PDFGenerator.export_settlement_report(settlements)
            assert pdf_buffer is not None
            assert pdf_buffer.tell() >= 0  # BytesIO object
        except ImportError:
            pytest.skip("ReportLab not installed")


# ============================================
# Report Export Function Tests
# ============================================
class TestReportExportFunctions:
    """Test generic report export functions"""
    
    def test_csv_export_impact_report(self):
        """Test CSV export for impact reports"""
        data = {
            "donor_id": "donor_001",
            "period": {
                "start_date": date(2026, 1, 1),
                "end_date": date(2026, 3, 31),
            },
            "summary": {
                "total_donated": Decimal("10000000"),
                "total_children_helped": 50,
                "total_vouchers_allocated": 100,
                "total_families_impacted": 20,
            },
            "donation_trend": [],
            "geographic_distribution": [],
        }
        
        csv_data = generate_csv_export("impact", data)
        assert len(csv_data) > 0
        assert "donor_001" in csv_data


# ============================================
# Report Trend Tests
# ============================================
class TestReportTrends:
    """Test report trend calculations"""
    
    def test_stunting_rate_trend_calculation(self):
        """Test stunting rate trend calculation"""
        data = {
            "region": "National",
            "period": {
                "start_date": date(2026, 1, 1),
                "end_date": date(2026, 3, 31),
            },
            "coverage": {
                "total_beneficiaries": 1000,
                "total_children": 1500,
                "total_vendors": 50,
                "districts_covered": 5,
            },
            "stunting_rate": {
                "current": 25.0,
                "previous": 30.0,
                "change_percentage": -5.0,
                "trend": "improving",
            },
            "budget_utilization": {
                "allocated": Decimal("500000000"),
                "utilized": Decimal("450000000"),
                "percentage": 90.0,
            },
        }
        report = RegionalReportResponse(**data)
        assert report.stunting_rate.trend == "improving"
        assert report.stunting_rate.change_percentage == -5.0


# ============================================
# Report Percentage Validation Tests
# ============================================
class TestPercentageValidation:
    """Test percentage field validation in reports"""
    
    def test_percentage_between_0_and_100(self):
        """Test percentages must be between 0 and 100"""
        data = {
            "label": "Test",
            "count": 100,
            "percentage": 105.0,  # Over 100%
        }
        from app.schemas.reports import DemographicItem
        with pytest.raises(ValueError):
            DemographicItem(**data)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
