import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

LABEL_COLOR = {
    "High Risk": "#ef4444",
    "Moderate Risk": "#f97316",
    "Low Risk": "#eab308",
}

def send_alert_email(to_emails: list[str], infant_name: str, label: str, confidence: float):
    if not SMTP_USER or not SMTP_PASS:
        print("SMTP credentials not configured — skipping email alert")
        return

    color = LABEL_COLOR.get(label, "#6b7280")
    conf_pct = round(confidence * 100, 1)

    body = f"""
    <html><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:24px">
      <div style="max-width:520px;margin:0 auto;background:#1e293b;border-radius:12px;padding:24px;border:1px solid #334155">
        <h2 style="margin-top:0;color:{color}">&#9888; NeoCare Alert</h2>
        <p><strong>{infant_name}</strong> has been flagged:</p>
        <p style="font-size:1.25rem;font-weight:bold;color:{color}">{label}</p>
        <p>Confidence: <strong>{conf_pct}%</strong></p>
        <p style="color:#94a3b8;font-size:0.875rem">Log in to NeoCare IDP to review the infant profile and take action.</p>
      </div>
    </body></html>
    """

    for address in to_emails:
        if not address:
            continue
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[NeoCare Alert] {infant_name} — {label}"
        msg["From"] = SMTP_USER
        msg["To"] = address
        msg.attach(MIMEText(body, "html"))
        try:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(SMTP_USER, address, msg.as_string())
            print(f"Alert email sent to {address}")
        except Exception as e:
            print(f"Failed to send email to {address}: {e}")
