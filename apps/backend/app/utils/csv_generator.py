"""
CSV Export Utility
Generate CSV exports for reports and settlements
"""
import csv
from io import StringIO
from typing import List, Dict, Any
from decimal import Decimal
from datetime import date, datetime
import logging

logger = logging.getLogger(__name__)


class CSVGenerator:
    """Generate CSV exports for various report types"""
    
    @staticmethod
    def _serialize_value(value: Any) -> str:
        """Convert value to string for CSV export"""
        if value is None:
            return ""
        elif isinstance(value, Decimal):
            return str(value)
        elif isinstance(value, (date, datetime)):
            return value.isoformat()
        elif isinstance(value, bool):
            return "Yes" if value else "No"
        else:
            return str(value)
    
    @staticmethod
    def flatten_dict(data: Dict[str, Any], parent_key: str = "", sep: str = "_") -> Dict[str, Any]:
        """
        Flatten nested dictionary for CSV export
        
        Args:
            data: Dictionary to flatten
            parent_key: Parent key prefix
            sep: Separator for nested keys
        
        Returns:
            Flattened dictionary
        """
        items = []
        for k, v in data.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(CSVGenerator.flatten_dict(v, new_key, sep=sep).items())
            elif isinstance(v, list) and v and isinstance(v[0], dict):
                # Skip lists of dicts (will be handled separately if needed)
                continue
            else:
                items.append((new_key, v))
        return dict(items)
    
    @staticmethod
    def export_settlement_report(
        settlements: List[Dict[str, Any]],
        include_breakdown: bool = False
    ) -> str:
        """
        Export settlement report to CSV
        
        Args:
            settlements: List of settlement records
            include_breakdown: Include detailed daily breakdown
        
        Returns:
            CSV string
        """
        if not settlements:
            return ""
        
        output = StringIO()
        
        # Flatten settlements for CSV
        flat_settlements = []
        for settlement in settlements:
            flat = {
                "id": settlement.get("id", ""),
                "vendor_id": settlement.get("vendor_id", ""),
                "period_start": settlement.get("period_start", ""),
                "period_end": settlement.get("period_end", ""),
                "total_redemptions": settlement.get("total_redemptions", 0),
                "admin_fee": settlement.get("admin_fee", 0),
                "net_amount": settlement.get("net_amount", 0),
                "status": settlement.get("status", ""),
                "payout_date": settlement.get("payout_date", ""),
                "bank_transfer_reference": settlement.get("bank_transfer_reference", ""),
            }
            flat_settlements.append(flat)
        
        # Write main settlement data
        fieldnames = flat_settlements[0].keys() if flat_settlements else []
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for settlement in flat_settlements:
            row = {k: CSVGenerator._serialize_value(v) for k, v in settlement.items()}
            writer.writerow(row)
        
        return output.getvalue()
    
    @staticmethod
    def export_impact_report(data: Dict[str, Any]) -> str:
        """
        Export impact report to CSV
        
        Args:
            data: Impact report data
        
        Returns:
            CSV string
        """
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["Impact Report", ""])
        writer.writerow(["Donor ID", data.get("donor_id", "")])
        writer.writerow(["Period Start", data.get("period", {}).get("start_date", "")])
        writer.writerow(["Period End", data.get("period", {}).get("end_date", "")])
        writer.writerow([])
        
        # Summary
        writer.writerow(["Summary", ""])
        summary = data.get("summary", {})
        for key, value in summary.items():
            writer.writerow([key.replace("_", " ").title(), CSVGenerator._serialize_value(value)])
        writer.writerow([])
        
        # Donation trend
        writer.writerow(["Donation Trend", ""])
        writer.writerow(["Month", "Amount", "Count"])
        for trend in data.get("donation_trend", []):
            writer.writerow([
                trend.get("month", ""),
                CSVGenerator._serialize_value(trend.get("amount", 0)),
                CSVGenerator._serialize_value(trend.get("donations_count", 0)),
            ])
        writer.writerow([])
        
        # Geographic distribution
        writer.writerow(["Geographic Distribution", ""])
        writer.writerow(["Province", "Children", "Amount"])
        for geo in data.get("geographic_distribution", []):
            writer.writerow([
                geo.get("province", ""),
                CSVGenerator._serialize_value(geo.get("children", 0)),
                CSVGenerator._serialize_value(geo.get("amount", 0)),
            ])
        
        return output.getvalue()
    
    @staticmethod
    def export_sales_report(data: Dict[str, Any]) -> str:
        """
        Export sales report to CSV
        
        Args:
            data: Sales report data
        
        Returns:
            CSV string
        """
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["Sales Report", ""])
        writer.writerow(["Vendor ID", data.get("vendor_id", "")])
        writer.writerow(["Period Start", data.get("period", {}).get("start_date", "")])
        writer.writerow(["Period End", data.get("period", {}).get("end_date", "")])
        writer.writerow([])
        
        # Summary
        writer.writerow(["Summary", ""])
        summary = data.get("summary", {})
        for key, value in summary.items():
            writer.writerow([key.replace("_", " ").title(), CSVGenerator._serialize_value(value)])
        writer.writerow([])
        
        # Daily sales
        writer.writerow(["Daily Sales", ""])
        writer.writerow(["Date", "Order Count", "Total"])
        for daily in data.get("daily_sales", []):
            writer.writerow([
                daily.get("date", ""),
                CSVGenerator._serialize_value(daily.get("order_count", 0)),
                CSVGenerator._serialize_value(daily.get("total", 0)),
            ])
        writer.writerow([])
        
        # Top products
        writer.writerow(["Top Products", ""])
        writer.writerow(["Product Name", "Quantity Sold", "Revenue"])
        for product in data.get("top_products", []):
            writer.writerow([
                product.get("product_name", ""),
                CSVGenerator._serialize_value(product.get("quantity_sold", 0)),
                CSVGenerator._serialize_value(product.get("revenue", 0)),
            ])
        
        return output.getvalue()
    
    @staticmethod
    def export_regional_report(data: Dict[str, Any]) -> str:
        """
        Export regional report to CSV
        
        Args:
            data: Regional report data
        
        Returns:
            CSV string
        """
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["Regional Report", ""])
        writer.writerow(["Region", data.get("region", "")])
        writer.writerow(["Period Start", data.get("period", {}).get("start_date", "")])
        writer.writerow(["Period End", data.get("period", {}).get("end_date", "")])
        writer.writerow([])
        
        # Coverage
        writer.writerow(["Coverage", ""])
        coverage = data.get("coverage", {})
        for key, value in coverage.items():
            writer.writerow([key.replace("_", " ").title(), CSVGenerator._serialize_value(value)])
        writer.writerow([])
        
        # Stunting rate
        writer.writerow(["Stunting Rate", ""])
        stunting = data.get("stunting_rate", {})
        for key, value in stunting.items():
            writer.writerow([key.replace("_", " ").title(), CSVGenerator._serialize_value(value)])
        writer.writerow([])
        
        # Budget utilization
        writer.writerow(["Budget Utilization", ""])
        budget = data.get("budget_utilization", {})
        for key, value in budget.items():
            writer.writerow([key.replace("_", " ").title(), CSVGenerator._serialize_value(value)])
        writer.writerow([])
        
        # District breakdown
        writer.writerow(["District Breakdown", ""])
        writer.writerow(["District", "Beneficiaries", "Children", "Stunting Rate"])
        for district in data.get("district_breakdown", []):
            writer.writerow([
                district.get("district", ""),
                CSVGenerator._serialize_value(district.get("beneficiaries", 0)),
                CSVGenerator._serialize_value(district.get("children", 0)),
                CSVGenerator._serialize_value(district.get("stunting_rate", 0)),
            ])
        
        return output.getvalue()


def generate_csv_export(
    report_type: str,
    data: Dict[str, Any],
    **kwargs
) -> str:
    """
    Generate CSV export for any report type
    
    Args:
        report_type: Type of report (impact, sales, regional, settlement)
        data: Report data
        **kwargs: Additional parameters
    
    Returns:
        CSV string
    """
    generator = CSVGenerator()
    
    if report_type == "impact":
        return generator.export_impact_report(data)
    elif report_type == "sales":
        return generator.export_sales_report(data)
    elif report_type == "regional":
        return generator.export_regional_report(data)
    elif report_type == "settlement":
        settlements = data if isinstance(data, list) else [data]
        return generator.export_settlement_report(settlements, **kwargs)
    else:
        logger.warning(f"Unknown report type: {report_type}")
        return ""
