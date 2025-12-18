"""
Email Notification Service for Elder Care Management
Uses FREE Gmail SMTP - $0/month forever
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

# Email configuration - Use environment variables or set directly
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SENDER_EMAIL = os.getenv('SENDER_EMAIL', '')  # Your Gmail address
SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', '')  # Gmail App Password

def send_email(to_email, subject, html_body, text_body=None):
    """
    Send email using Gmail SMTP (FREE)
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_body: HTML email body
        text_body: Plain text email body (optional)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        error_msg = "⚠️ Email not configured. Set SENDER_EMAIL and SENDER_PASSWORD environment variables."
        print(error_msg)
        print(f"   SENDER_EMAIL: {'SET' if SENDER_EMAIL else 'NOT SET'}")
        print(f"   SENDER_PASSWORD: {'SET' if SENDER_PASSWORD else 'NOT SET'}")
        print("   See EMAIL_SETUP.md for instructions")
        return False
    
    if not to_email:
        print(f"⚠️ No recipient email provided")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add text and HTML parts
        if text_body:
            part1 = MIMEText(text_body, 'plain')
            msg.attach(part1)
        
        part2 = MIMEText(html_body, 'html')
        msg.attach(part2)
        
        # Send email with timeout to prevent hanging
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)  # 10 second timeout
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"✅ Email sent successfully to {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        error_msg = f"SMTP Authentication Error: {str(e)}. Check SENDER_EMAIL and SENDER_PASSWORD."
        print(f"❌ {error_msg}")
        return False
    except smtplib.SMTPConnectError as e:
        error_msg = f"SMTP Connection Error: {str(e)}. Cannot connect to {SMTP_SERVER}:{SMTP_PORT}."
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

