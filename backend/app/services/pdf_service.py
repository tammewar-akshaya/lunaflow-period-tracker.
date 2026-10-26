import io
from datetime import date
from typing import List, Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from app.models.models import Period, DailyCheckin, User

def generate_doctor_report(user: User, periods: List[Period], checkins: List[DailyCheckin], from_date: Optional[date] = None, to_date: Optional[date] = None) -> bytes:
    """
    Generates a doctor consultation PDF report summarizing periods, averages, and symptoms.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#573B50')
    )
    subtitle_style = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#6B6470')
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#573B50'),
        spaceBefore=14,
        spaceAfter=6
    )
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#8E8795')
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#34313A')
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("🌙 LunaFlow — Wellness & Cycle Summary Report", title_style))
    range_str = f"Date Range: {from_date.isoformat() if from_date else 'All time'} to {to_date.isoformat() if to_date else 'Present'}"
    story.append(Paragraph(f"Patient / User: <b>{user.display_name}</b> &nbsp;|&nbsp; Generated on: {date.today().isoformat()}<br/>{range_str}", subtitle_style))
    story.append(Spacer(1, 12))

    # Medical Disclaimer Notice
    disclaimer_text = "<b>Medical Disclaimer:</b> This document contains personal self-reported wellness tracking information collected via the LunaFlow application. It is provided solely to assist you in discussions with your qualified healthcare provider. LunaFlow does not provide medical advice, diagnosis, or treatment."
    story.append(Paragraph(disclaimer_text, disclaimer_style))
    story.append(Spacer(1, 14))

    # Summary Statistics
    sorted_periods = sorted(periods, key=lambda p: p.start_date)
    cycle_lengths = []
    durations = []
    for i in range(len(sorted_periods) - 1):
        c_len = (sorted_periods[i+1].start_date - sorted_periods[i].start_date).days
        if 20 <= c_len <= 55:
            cycle_lengths.append(c_len)

    for p in sorted_periods:
        if p.end_date:
            d = (p.end_date - p.start_date).days + 1
            if 1 <= d <= 14:
                durations.append(d)

    avg_cycle = round(sum(cycle_lengths) / len(cycle_lengths)) if cycle_lengths else "N/A (insufficient data)"
    avg_dur = round(sum(durations) / len(durations)) if durations else "5 (typical)"

    stats_data = [
        ["Total Periods Logged", "Cycles Analyzed", "Average Cycle Length", "Average Period Duration"],
        [str(len(sorted_periods)), str(len(cycle_lengths)), f"{avg_cycle} days" if isinstance(avg_cycle, int) else avg_cycle, f"{avg_dur} days"]
    ]
    stats_table = Table(stats_data, colWidths=[130, 110, 140, 140])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F6DCE3')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#573B50')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#FFF9F4')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E8A1B0')),
    ]))
    story.append(Paragraph("Cycle Overview & Averages", section_heading))
    story.append(stats_table)
    story.append(Spacer(1, 12))

    # Recorded Periods Table
    story.append(Paragraph("Recorded Period Cycles", section_heading))
    table_rows = [["Start Date", "End Date", "Duration", "Flow Intensity", "Notes"]]
    for p in sorted_periods:
        dur_str = f"{(p.end_date - p.start_date).days + 1} days" if p.end_date else "Ongoing / Single"
        flow_str = p.flow_intensity.capitalize() if p.flow_intensity else "-"
        notes_str = (p.notes[:35] + '...') if p.notes and len(p.notes) > 35 else (p.notes or "-")
        table_rows.append([p.start_date.isoformat(), p.end_date.isoformat() if p.end_date else "-", dur_str, flow_str, notes_str])

    if len(table_rows) == 1:
        table_rows.append(["No period records found in selected range", "-", "-", "-", "-"])

    periods_table = Table(table_rows, colWidths=[90, 90, 80, 90, 170])
    periods_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E8E1F7')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#573B50')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDD')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(periods_table)
    story.append(Spacer(1, 14))

    # Symptoms & Wellness Summary
    story.append(Paragraph("Logged Symptoms Frequency", section_heading))
    symptom_counts = {}
    for c in checkins:
        if c.symptoms:
            for s in c.symptoms:
                symptom_counts[s] = symptom_counts.get(s, 0) + 1

    if symptom_counts:
        top_symptoms = sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)[:8]
        symp_rows = [["Reported Symptom", "Times Logged"]]
        for s_name, s_count in top_symptoms:
            symp_rows.append([s_name.replace('_', ' ').capitalize(), f"{s_count} days"])
        symp_table = Table(symp_rows, colWidths=[260, 260])
        symp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F6DCE3')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#573B50')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDD')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(symp_table)
    else:
        story.append(Paragraph("No symptom check-ins logged for this time period.", body_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
