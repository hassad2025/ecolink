from typing import Optional
import smtplib
from email.message import EmailMessage
from app.core.config import get_settings

settings = get_settings()


def send_email(to_email: str, subject: str, html_content: str, plain_text: Optional[str] = None) -> None:
    """Send an email using SMTP configured in settings.

    This uses the standard library `smtplib` and will raise exceptions on failure.
    """
    if not settings.SMTP_HOST or not settings.SMTP_PORT or not settings.SMTP_FROM_EMAIL:
        raise RuntimeError('SMTP is not configured. Please set SMTP_HOST, SMTP_PORT and SMTP_FROM_EMAIL in .env')

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = settings.SMTP_FROM_EMAIL
    msg['To'] = to_email
    if plain_text:
        msg.set_content(plain_text)
    msg.add_alternative(html_content, subtype='html')

    # Connect and send
    if settings.SMTP_USE_TLS:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        server.starttls()
    else:
        server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)

    try:
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

        server.send_message(msg)
    finally:
        server.quit()
