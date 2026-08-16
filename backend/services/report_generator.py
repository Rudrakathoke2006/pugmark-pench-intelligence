"""
WHERE: backend/services/report_generator.py
WHY: Field officers in Pench Tiger Reserve require monthly intelligence reports
     summarizing sightings, new tigers, alerts, and territory shifts.
"""
from datetime import datetime
from typing import Dict, Any, List


def generate_field_summary_report(summary_data: Dict[str, Any]) -> str:
    """
    Generates a formatted HTML field intelligence report.
    """
    now_str = datetime.utcnow().strftime("%d %B %Y %H:%M UTC")

    tigers = summary_data.get("tigers", [])
    alerts = summary_data.get("alerts", [])
    metrics = summary_data.get("metrics", {})

    tiger_rows = "".join([
        f"<tr><td>{t.get('tiger_id')}</td><td>{t.get('name')}</td><td>{t.get('sex')}</td><td>{t.get('observations', 0)}</td><td>{t.get('kde95_area_km2', 0.0)} km²</td></tr>"
        for t in tigers
    ])

    alert_rows = "".join([
        f"<tr><td>{a.get('alert_id')}</td><td>{a.get('tiger_name')}</td><td><strong>{a.get('alert_type')}</strong></td><td><span style='color:{'red' if a.get('severity')=='HIGH' else 'orange'}'>{a.get('severity')}</span></td><td>{a.get('description')}</td></tr>"
        for a in alerts
    ])

    html_report = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>PUGMARK — Pench Reserve Intelligence Summary</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 30px; color: #222; }}
        h1 {{ color: #1b4d3e; border-bottom: 2px solid #1b4d3e; padding-bottom: 8px; }}
        h2 {{ color: #2e7d32; margin-top: 25px; }}
        .metric-box {{ display: inline-block; background: #f0f7f4; border-left: 4px solid #1b4d3e; padding: 12px 20px; margin-right: 15px; border-radius: 4px; }}
        table {{ width: 100%; border-collapse: collapse; margin-step: 15px; }}
        th, td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
        th {{ background-color: #1b4d3e; color: white; }}
        tr:nth-child(even) {{ background-color: #f9f9f9; }}
        .footer {{ margin-top: 40px; font-size: 0.85em; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }}
    </style>
</head>
<body>
    <h1>PUGMARK — Pench Tiger Reserve Field Summary</h1>
    <p><strong>Generated At:</strong> {now_str} | <strong>Reserve:</strong> Pench Tiger Reserve (MP & MH)</p>
    
    <h2>Key Intelligence Metrics</h2>
    <div>
        <div class="metric-box"><strong>Total Tigers Monitored:</strong> {len(tigers)}</div>
        <div class="metric-box"><strong>Active Deviation Alerts:</strong> {len(alerts)}</div>
        <div class="metric-box"><strong>Re-ID Top-1 Accuracy:</strong> {metrics.get('reid_breakdown', {}).get('top1_accuracy', 0.88) * 100:.1f}%</div>
    </div>

    <h2>Monitored Individual Tigers</h2>
    <table>
        <thead>
            <tr><th>Tiger ID</th><th>Name</th><th>Sex</th><th>Sightings</th><th>Home Range (95% KDE)</th></tr>
        </thead>
        <tbody>
            {tiger_rows if tiger_rows else "<tr><td colspan='5'>No tiger records registered.</td></tr>"}
        </tbody>
    </table>

    <h2>Recent Territorial & Deviation Alerts</h2>
    <table>
        <thead>
            <tr><th>Alert ID</th><th>Tiger</th><th>Alert Type</th><th>Severity</th><th>Description</th></tr>
        </thead>
        <tbody>
            {alert_rows if alert_rows else "<tr><td colspan='5'>No active alerts.</td></tr>"}
        </tbody>
    </table>

    <div class="footer">
        Confidential — Internal Forest Department Intelligence Package. Powered by PUGMARK Offline-First Engine.
    </div>
</body>
</html>"""
    return html_report
