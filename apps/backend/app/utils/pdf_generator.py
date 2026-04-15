"""
PDF Export Utility
Generate PDF exports for reports using ReportLab
"""
from typing import Dict, Any, List, Optional
from decimal import Decimal
from datetime import date, datetime
from io import BytesIO
import logging

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False
    logger = logging.getLogger(__name__)
    logger.warning("ReportLab not installed. PDF generation will be unavailable.")

logger = logging.getLogger(__name__)


class PDFGenerator:
    """Generate PDF exports for various report types"""
    
    @staticmethod
    def _serialize_value(value: Any) -> str:
        """Convert value to string for PDF"""
        if value is None:
            return ""
        elif isinstance(value, Decimal):
            return f"Rp {value:,.0f}"
        elif isinstance(value, bool):
            return "Ya" if value else "Tidak"
        elif isinstance(value, (date, datetime)):
            return value.strftime("%d/%m/%Y")
        else:
            return str(value)
    
    @staticmethod
    def export_settlement_report(
        settlements: List[Dict[str, Any]],
        filename: Optional[str] = None
    ) -> BytesIO:
        """
        Export settlement report to PDF
        
        Args:
            settlements: List of settlement records
            filename: Output filename (optional)
        
        Returns:
            BytesIO buffer with PDF content
        """
        if not HAS_REPORTLAB:
            raise ImportError("ReportLab is required for PDF generation")
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=30,
            alignment=TA_CENTER,
        )
        elements.append(Paragraph("Laporan Settlement", title_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # Settlement table
        if settlements:
            table_data = [
                ["ID", "Vendor", "Periode", "Total", "Admin Fee", "Net", "Status"]
            ]
            
            for settlement in settlements:
                table_data.append([
                    str(settlement.get("id", ""))[:8],
                    str(settlement.get("vendor_id", ""))[:8],
                    f"{settlement.get('period_start', '')} - {settlement.get('period_end', '')}",
                    PDFGenerator._serialize_value(settlement.get("total_redemptions", 0)),
                    PDFGenerator._serialize_value(settlement.get("admin_fee", 0)),
                    PDFGenerator._serialize_value(settlement.get("net_amount", 0)),
                    settlement.get("status", ""),
                ])
            
            table = Table(table_data, colWidths=[1*inch, 1*inch, 1.5*inch, 0.8*inch, 0.8*inch, 0.8*inch, 0.8*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]))
            elements.append(table)
        
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def export_impact_report(data: Dict[str, Any]) -> BytesIO:
        """
        Export impact report to PDF
        
        Args:
            data: Impact report data
        
        Returns:
            BytesIO buffer with PDF content
        """
        if not HAS_REPORTLAB:
            raise ImportError("ReportLab is required for PDF generation")
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=20,
            alignment=TA_CENTER,
        )
        elements.append(Paragraph("Laporan Dampak Donor", title_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # Summary section
        summary = data.get("summary", {})
        summary_data = [["Metrik", "Nilai"]]
        for key, value in summary.items():
            summary_data.append([
                key.replace("_", " ").title(),
                PDFGenerator._serialize_value(value)
            ])
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*inch))
        
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def export_sales_report(data: Dict[str, Any]) -> BytesIO:
        """
        Export sales report to PDF
        
        Args:
            data: Sales report data
        
        Returns:
            BytesIO buffer with PDF content
        """
        if not HAS_REPORTLAB:
            raise ImportError("ReportLab is required for PDF generation")
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=20,
            alignment=TA_CENTER,
        )
        elements.append(Paragraph("Laporan Penjualan", title_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # Summary section
        summary = data.get("summary", {})
        summary_data = [["Metrik", "Nilai"]]
        for key, value in summary.items():
            summary_data.append([
                key.replace("_", " ").title(),
                PDFGenerator._serialize_value(value)
            ])
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Top products
        elements.append(Paragraph("Produk Terlaris", styles['Heading2']))
        elements.append(Spacer(1, 0.1*inch))
        
        products_data = [["Produk", "Terjual", "Revenue"]]
        for product in data.get("top_products", [])[:10]:
            products_data.append([
                product.get("product_name", ""),
                str(product.get("quantity_sold", 0)),
                PDFGenerator._serialize_value(product.get("revenue", 0))
            ])
        
        products_table = Table(products_data, colWidths=[2.5*inch, 1*inch, 1.5*inch])
        products_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(products_table)
        
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def export_regional_report(data: Dict[str, Any]) -> BytesIO:
        """
        Export regional report to PDF
        
        Args:
            data: Regional report data
        
        Returns:
            BytesIO buffer with PDF content
        """
        if not HAS_REPORTLAB:
            raise ImportError("ReportLab is required for PDF generation")
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=20,
            alignment=TA_CENTER,
        )
        elements.append(Paragraph("Laporan Regional", title_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # Coverage
        elements.append(Paragraph("Jangkauan", styles['Heading2']))
        coverage = data.get("coverage", {})
        coverage_data = [["Metrik", "Nilai"]]
        for key, value in coverage.items():
            coverage_data.append([
                key.replace("_", " ").title(),
                str(value)
            ])
        
        coverage_table = Table(coverage_data, colWidths=[3*inch, 2*inch])
        coverage_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(coverage_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # District breakdown
        elements.append(Paragraph("Rincian Distrik", styles['Heading2']))
        districts_data = [["Distrik", "Penerima", "Anak", "Stunting Rate"]]
        for district in data.get("district_breakdown", []):
            districts_data.append([
                district.get("district", ""),
                str(district.get("beneficiaries", 0)),
                str(district.get("children", 0)),
                f"{district.get('stunting_rate', 0):.1f}%"
            ])
        
        districts_table = Table(districts_data, colWidths=[1.5*inch, 1.5*inch, 1*inch, 1.5*inch])
        districts_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(districts_table)
        
        doc.build(elements)
        buffer.seek(0)
        return buffer


def generate_pdf_export(
    report_type: str,
    data: Dict[str, Any],
    **kwargs
) -> BytesIO:
    """
    Generate PDF export for any report type
    
    Args:
        report_type: Type of report (impact, sales, regional, settlement)
        data: Report data
        **kwargs: Additional parameters
    
    Returns:
        BytesIO buffer with PDF content
    """
    if not HAS_REPORTLAB:
        raise ImportError("ReportLab is required for PDF generation. Install with: pip install reportlab")
    
    generator = PDFGenerator()
    
    if report_type == "impact":
        return generator.export_impact_report(data)
    elif report_type == "sales":
        return generator.export_sales_report(data)
    elif report_type == "regional":
        return generator.export_regional_report(data)
    elif report_type == "settlement":
        settlements = data if isinstance(data, list) else [data]
        return generator.export_settlement_report(settlements)
    else:
        logger.warning(f"Unknown report type: {report_type}")
        return BytesIO()
