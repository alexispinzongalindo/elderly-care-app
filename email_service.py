"""
Email Notification Service for Elder Care Management
Supports Resend API (HTTP-based, works on Render) and Gmail SMTP (for local dev)
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
import os
import json
import base64
import urllib.request
import urllib.parse
import urllib.error

# Email configuration - Use environment variables or set directly
# Resend API (RECOMMENDED - works on Render free tier via HTTP)
RESEND_API_KEY = os.getenv('RESEND_API_KEY', '')
RESEND_FROM_EMAIL = os.getenv('RESEND_FROM_EMAIL', '')  # Your verified domain email (e.g., notifications@yourdomain.com)

# Gmail SMTP (fallback for local development)
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 0))  # 0 means auto-detect: try 465 first, then 587
USE_SSL = os.getenv('USE_SSL', '').lower() == 'true'  # Force SSL mode
SENDER_EMAIL = os.getenv('SENDER_EMAIL', '')  # Your Gmail address
SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', '')  # Gmail App Password

# Use Resend if API key is set, otherwise use SMTP
USE_RESEND = bool(RESEND_API_KEY)

def send_email_via_resend(to_email, subject, html_body, text_body=None, attachments=None):
    """
    Send email using Resend API (HTTP-based, works on Render)
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_body: HTML email body
        text_body: Plain text email body (optional)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not RESEND_API_KEY:
        print("❌ Resend API key not configured")
        return False
    
    if not RESEND_FROM_EMAIL:
        print("❌ RESEND_FROM_EMAIL not configured. Set it in environment variables.")
        return False
    
    if not to_email:
        print(f"⚠️ No recipient email provided")
        return False
    
    try:
        url = "https://api.resend.com/emails"
        data = {
            "from": RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_body
        }
        
        if text_body:
            data["text"] = text_body

        if attachments:
            encoded_attachments = []
            for att in attachments:
                try:
                    filename, content_bytes, mime_type = att
                    encoded_attachments.append({
                        "filename": filename,
                        "content": base64.b64encode(content_bytes).decode('utf-8'),
                        "content_type": mime_type
                    })
                except Exception:
                    continue
            if encoded_attachments:
                data["attachments"] = encoded_attachments
        
        json_data = json.dumps(data).encode('utf-8')
        
        req = urllib.request.Request(url, data=json_data, method='POST')
        req.add_header('Authorization', f'Bearer {RESEND_API_KEY}')
        req.add_header('Content-Type', 'application/json')
        
        print(f"📧 Sending email via Resend API to {to_email}...")
        with urllib.request.urlopen(req, timeout=10) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            if response.getcode() == 200:
                print(f"✅ Email sent successfully via Resend to {to_email}")
                print(f"   Resend ID: {response_data.get('id', 'N/A')}")
                return True
            else:
                print(f"❌ Resend API returned status {response.getcode()}: {response_data}")
                return False
                
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"❌ Resend API HTTP Error {e.code}: {error_body}")
        try:
            error_data = json.loads(error_body)
            print(f"   Error details: {error_data}")
        except:
            pass
        return False
    except Exception as e:
        print(f"❌ Error sending email via Resend: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def send_email_via_smtp(to_email, subject, html_body, text_body=None, attachments=None):
    """
    Send email using SMTP (Gmail, etc.) - for local development
    Works on local machines but may be blocked on Render free tier
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_body: HTML email body
        text_body: Plain text email body (optional)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        error_msg = "⚠️ SMTP not configured. Set SENDER_EMAIL and SENDER_PASSWORD environment variables."
        print(error_msg)
        print(f"   SENDER_EMAIL: {'SET' if SENDER_EMAIL else 'NOT SET'}")
        print(f"   SENDER_PASSWORD: {'SET' if SENDER_PASSWORD else 'NOT SET'}")
        return False
    
    if not to_email:
        print(f"⚠️ No recipient email provided")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('mixed')
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject

        # Add text and HTML parts
        alt_part = MIMEMultipart('alternative')
        if text_body:
            part1 = MIMEText(text_body, 'plain')
            alt_part.attach(part1)

        part2 = MIMEText(html_body, 'html')
        alt_part.attach(part2)

        msg.attach(alt_part)

        if attachments:
            for filename, content_bytes, mime_type in attachments:
                try:
                    main_type, sub_type = (mime_type.split('/', 1) + ['octet-stream'])[:2]
                except Exception:
                    main_type, sub_type = 'application', 'octet-stream'
                part = MIMEBase(main_type, sub_type)
                part.set_payload(content_bytes)
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f'attachment; filename="{filename}"')
                msg.attach(part)
        
        # Try to send email - use SSL (port 465) first, then STARTTLS (port 587)
        # Render often blocks port 587, so we try 465 first
        port_to_try = SMTP_PORT if SMTP_PORT > 0 else 465
        use_ssl_for_this_attempt = USE_SSL if SMTP_PORT > 0 else True
        
        try:
            if use_ssl_for_this_attempt:
                # Use SSL (port 465) - sometimes works better on Render
                print(f"📧 Attempting to send email via {SMTP_SERVER}:{port_to_try} using SSL...")
                server = smtplib.SMTP_SSL(SMTP_SERVER, port_to_try, timeout=10)
            else:
                # Use STARTTLS (port 587)
                print(f"📧 Attempting to send email via {SMTP_SERVER}:{port_to_try} using STARTTLS...")
                server = smtplib.SMTP(SMTP_SERVER, port_to_try, timeout=10)
                server.starttls()
            
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
            server.quit()
            
            print(f"✅ Email sent successfully to {to_email}")
            return True
        except (OSError, ConnectionError) as conn_error:
            # If SSL/port 465 failed and we haven't tried port 587 yet, try that
            if port_to_try == 465 and SMTP_PORT == 0 and '101' in str(conn_error):
                print(f"⚠️ Port 465 (SSL) failed with network error, trying port 587 (STARTTLS)...")
                try:
                    server = smtplib.SMTP(SMTP_SERVER, 587, timeout=10)
                    server.starttls()
                    server.login(SENDER_EMAIL, SENDER_PASSWORD)
                    server.send_message(msg)
                    server.quit()
                    print(f"✅ Email sent successfully to {to_email} via port 587")
                    return True
                except Exception as retry_error:
                    print(f"❌ Port 587 also failed: {str(retry_error)}")
                    raise conn_error  # Raise original error
            else:
                raise  # Re-raise if we've already tried both or have a specific port configured
        
    except smtplib.SMTPAuthenticationError as e:
        error_msg = f"SMTP Authentication Error: {str(e)}. Check SENDER_EMAIL and SENDER_PASSWORD."
        print(f"❌ {error_msg}")
        return False
    except smtplib.SMTPConnectError as e:
        error_msg = f"SMTP Connection Error: {str(e)}. Cannot connect to {SMTP_SERVER}."
        print(f"❌ {error_msg}")
        return False
    except (OSError, ConnectionError) as e:
        error_msg = f"Network Error: {str(e)}"
        if '101' in str(e) or 'Network is unreachable' in str(e):
            error_msg += f"\n   ⚠️ Render blocks outbound SMTP connections on free tier."
            error_msg += f"\n   Solutions: 1) Use Resend/SendGrid API (HTTP-based), 2) Upgrade Render plan, 3) Use different hosting"
        print(f"❌ {error_msg}")
        return False
    except smtplib.SMTPException as e:
        error_msg = f"SMTP Error: {str(e)}"
        print(f"❌ {error_msg}")
        return False
    except Exception as e:
        error_msg = f"Unexpected error sending email to {to_email}: {type(e).__name__}: {str(e)}"
        print(f"❌ {error_msg}")
        import traceback
        traceback.print_exc()
        return False

def send_email(to_email, subject, html_body, text_body=None, attachments=None):
    """
    Send email - automatically chooses Resend API (if configured) or SMTP (fallback)
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_body: HTML email body
        text_body: Plain text email body (optional)
        attachments: List of attachments (filename, content_bytes, mime_type)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    # Prefer Resend API (works on Render), fallback to SMTP for local dev
    if USE_RESEND:
        result = send_email_via_resend(to_email, subject, html_body, text_body, attachments)
        if result:
            return True
        # If Resend fails, fall back to SMTP (but log the attempt)
        print("⚠️ Resend failed, attempting SMTP fallback...")

    # Use SMTP (may not work on Render free tier)
    return send_email_via_smtp(to_email, subject, html_body, text_body, attachments)

def send_medication_alert(resident_name, medication_name, scheduled_time, staff_email, language='en'):
    """
    Send medication alert email
    
    Args:
        resident_name: Name of the resident
        medication_name: Name of the medication
        scheduled_time: Scheduled time for medication
        staff_email: Staff email to notify
        language: 'en' or 'es'
    """
    if language == 'es':
        subject = f"⚠️ Alerta de Medicamento: {resident_name}"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d32f2f;">⚠️ Alerta de Medicamento</h2>
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;"><strong>Medicamento no administrado a tiempo</strong></p>
                </div>
                <table style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold; width: 150px;">Residente:</td>
                        <td style="padding: 10px;">{resident_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Medicamento:</td>
                        <td style="padding: 10px;">{medication_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Hora Programada:</td>
                        <td style="padding: 10px;">{scheduled_time}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Fecha/Hora:</td>
                        <td style="padding: 10px;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                    </tr>
                </table>
                <div style="margin-top: 30px; padding: 15px; background-color: #e3f2fd; border-radius: 5px;">
                    <p style="margin: 0;">Por favor, verifique el sistema de Gestión de Cuidado de Ancianos para administrar el medicamento.</p>
                </div>
            </div>
        </body>
        </html>
        """
    else:  # English
        subject = f"⚠️ Medication Alert: {resident_name}"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d32f2f;">⚠️ Medication Alert</h2>
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;"><strong>Medication not taken on time</strong></p>
                </div>
                <table style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold; width: 150px;">Resident:</td>
                        <td style="padding: 10px;">{resident_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Medication:</td>
                        <td style="padding: 10px;">{medication_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Scheduled Time:</td>
                        <td style="padding: 10px;">{scheduled_time}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Alert Time:</td>
                        <td style="padding: 10px;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                    </tr>
                </table>
                <div style="margin-top: 30px; padding: 15px; background-color: #e3f2fd; border-radius: 5px;">
                    <p style="margin: 0;">Please check the Elder Care Management system to administer the medication.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    return send_email(staff_email, subject, html_body)

def send_vital_signs_alert(resident_name, vital_type, value, threshold, staff_email, language='en'):
    """
    Send vital signs alert email (e.g., high blood pressure, low oxygen)
    
    Args:
        resident_name: Name of the resident
        vital_type: Type of vital sign (e.g., "Blood Pressure", "Oxygen Saturation")
        value: Current value
        threshold: Threshold that was exceeded
        staff_email: Staff email to notify
        language: 'en' or 'es'
    """
    if language == 'es':
        subject = f"🚨 Alerta de Signos Vitales: {resident_name}"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d32f2f;">🚨 Alerta de Signos Vitales</h2>
                <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;"><strong>Valor crítico detectado</strong></p>
                </div>
                <table style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold; width: 150px;">Residente:</td>
                        <td style="padding: 10px;">{resident_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Tipo:</td>
                        <td style="padding: 10px;">{vital_type}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Valor Actual:</td>
                        <td style="padding: 10px; color: #d32f2f; font-weight: bold; font-size: 18px;">{value}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Umbral:</td>
                        <td style="padding: 10px;">{threshold}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Fecha/Hora:</td>
                        <td style="padding: 10px;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                    </tr>
                </table>
                <div style="margin-top: 30px; padding: 15px; background-color: #ffebee; border-radius: 5px;">
                    <p style="margin: 0;"><strong>Acción requerida:</strong> Por favor, revise inmediatamente al residente.</p>
                </div>
            </div>
        </body>
        </html>
        """
    else:  # English
        subject = f"🚨 Vital Signs Alert: {resident_name}"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d32f2f;">🚨 Vital Signs Alert</h2>
                <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;"><strong>Critical value detected</strong></p>
                </div>
                <table style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold; width: 150px;">Resident:</td>
                        <td style="padding: 10px;">{resident_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Type:</td>
                        <td style="padding: 10px;">{vital_type}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Current Value:</td>
                        <td style="padding: 10px; color: #d32f2f; font-weight: bold; font-size: 18px;">{value}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Threshold:</td>
                        <td style="padding: 10px;">{threshold}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Alert Time:</td>
                        <td style="padding: 10px;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                    </tr>
                </table>
                <div style="margin-top: 30px; padding: 15px; background-color: #ffebee; border-radius: 5px;">
                    <p style="margin: 0;"><strong>Action Required:</strong> Please check the resident immediately.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    return send_email(staff_email, subject, html_body)

def send_incident_alert(resident_name, incident_type, severity, staff_email, language='en'):
    """
    Send incident alert email
    
    Args:
        resident_name: Name of the resident
        incident_type: Type of incident
        severity: Severity level (e.g., "High", "Medium", "Low")
        staff_email: Staff email to notify
        language: 'en' or 'es'
    """
    if language == 'es':
        subject = f"⚠️ Alerta de Incidente: {resident_name}"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ff9800;">⚠️ Alerta de Incidente</h2>
                <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;"><strong>Nuevo incidente reportado</strong></p>
                </div>
                <table style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold; width: 150px;">Residente:</td>
                        <td style="padding: 10px;">{resident_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Tipo de Incidente:</td>
                        <td style="padding: 10px;">{incident_type}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Severidad:</td>
                        <td style="padding: 10px; color: #ff9800; font-weight: bold;">{severity}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Fecha/Hora:</td>
                        <td style="padding: 10px;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                    </tr>
                </table>
                <div style="margin-top: 30px; padding: 15px; background-color: #fff3e0; border-radius: 5px;">
                    <p style="margin: 0;">Por favor, revise el sistema de Gestión de Cuidado de Ancianos para más detalles.</p>
                </div>
            </div>
        </body>
        </html>
        """
    else:  # English
        subject = f"⚠️ Incident Alert: {resident_name}"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ff9800;">⚠️ Incident Alert</h2>
                <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;"><strong>New incident reported</strong></p>
                </div>
                <table style="width: 100%; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold; width: 150px;">Resident:</td>
                        <td style="padding: 10px;">{resident_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Incident Type:</td>
                        <td style="padding: 10px;">{incident_type}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Severity:</td>
                        <td style="padding: 10px; color: #ff9800; font-weight: bold;">{severity}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background-color: #f5f5f5; font-weight: bold;">Alert Time:</td>
                        <td style="padding: 10px;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                    </tr>
                </table>
                <div style="margin-top: 30px; padding: 15px; background-color: #fff3e0; border-radius: 5px;">
                    <p style="margin: 0;">Please check the Elder Care Management system for more details.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    return send_email(staff_email, subject, html_body)

def send_custom_alert(to_email, subject, message, language='en'):
    """
    Send custom alert email
    
    Args:
        to_email: Recipient email
        subject: Email subject
        message: Email message content
        language: 'en' or 'es'
    """
    if language == 'es':
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2196F3;">📧 Notificación del Sistema</h2>
                <div style="background-color: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <p style="margin: 0; white-space: pre-wrap;">{message}</p>
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
                    {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                </p>
            </div>
        </body>
        </html>
        """
    else:  # English
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2196F3;">📧 System Notification</h2>
                <div style="background-color: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <p style="margin: 0; white-space: pre-wrap;">{message}</p>
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
                    {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                </p>
            </div>
        </body>
        </html>
        """
    
    return send_email(to_email, subject, html_body)

