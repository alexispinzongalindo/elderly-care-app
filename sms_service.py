"""
SMS Notification Service using Email-to-SMS Gateways
FREE alternative to Twilio - no account approval needed, works immediately
Uses carrier email gateways (e.g., 7875551234@vtext.com for Verizon)

Supported Carriers (US/PR):
- Verizon: @vtext.com
- AT&T: @txt.att.net
- T-Mobile: @tmomail.net
- Sprint: @messaging.sprintpcs.com
- US Cellular: @email.uscc.net
- Cricket: @sms.cricketwireless.net
- Boost Mobile: @sms.myboostmobile.com
- Virgin Mobile: @vmobl.com
- MetroPCS: @mymetropcs.com
"""

import os
from email_service import send_email  # Reuse email infrastructure
import re

# Carrier email gateway mappings (US/PR)
CARRIER_GATEWAYS = {
    'verizon': '@vtext.com',
    'att': '@txt.att.net',
    'at&t': '@txt.att.net',
    't-mobile': '@tmomail.net',
    'tmobile': '@tmomail.net',
    'sprint': '@messaging.sprintpcs.com',
    'us cellular': '@email.uscc.net',
    'cricket': '@sms.cricketwireless.net',
    'boost': '@sms.myboostmobile.com',
    'virgin': '@vmobl.com',
    'metro': '@mymetropcs.com',
    'metropcs': '@mymetropcs.com',
    'claro': '@vtexto.com',  # Claro Puerto Rico
}

# Default carrier if not specified (Verizon is common in PR)
DEFAULT_CARRIER = 'verizon'

def normalize_phone(phone):
    """
    Normalize phone number to 10 digits (removes country code, spaces, dashes, etc.)
    
    Args:
        phone: Phone number in any format
    
    Returns:
        str: 10-digit phone number or None if invalid
    """
    if not phone:
        return None
    
    # Remove all non-digits
    digits = re.sub(r'\D', '', phone)
    
    # Remove leading 1 (US country code)
    if digits.startswith('1') and len(digits) == 11:
        digits = digits[1:]
    
    # Must be exactly 10 digits
    if len(digits) == 10:
        return digits
    
    return None

def get_sms_email(phone, carrier=None):
    """
    Convert phone number to carrier SMS email address
    
    Args:
        phone: Phone number (any format)
        carrier: Carrier name (optional, will use DEFAULT_CARRIER if not provided)
    
    Returns:
        str: Email address for SMS gateway (e.g., '7875551234@vtext.com')
              or None if phone is invalid
    """
    normalized = normalize_phone(phone)
    if not normalized:
        print(f"⚠️ Invalid phone number format: {phone}")
        return None
    
    # Use provided carrier or default
    carrier_key = (carrier or DEFAULT_CARRIER).lower().strip()
    
    # Get gateway suffix
    gateway = CARRIER_GATEWAYS.get(carrier_key)
    if not gateway:
        # If carrier not found, try default
        if carrier:
            print(f"⚠️ Unknown carrier '{carrier}', using default: {DEFAULT_CARRIER}")
        gateway = CARRIER_GATEWAYS[DEFAULT_CARRIER]
    
    sms_email = f"{normalized}{gateway}"
    return sms_email

def send_sms(phone, message, carrier=None, language='en'):
    """
    Send SMS via email-to-SMS gateway
    
    Args:
        phone: Recipient phone number (any format)
        message: SMS message text (will be truncated to 160 characters for best compatibility)
        carrier: Carrier name (optional, defaults to Verizon)
        language: 'en' or 'es' (not used for SMS, kept for API compatibility)
    
    Returns:
        bool: True if SMS sent successfully, False otherwise
    """
    # Truncate message to 160 characters (SMS limit)
    # Some carriers support longer messages, but 160 is safest
    if len(message) > 160:
        message = message[:157] + "..."
        print(f"⚠️ Message truncated to 160 characters for SMS compatibility")
    
    # Get SMS email address
    sms_email = get_sms_email(phone, carrier)
    if not sms_email:
        return False
    
    # Prepare SMS-friendly subject and body
    # Keep subject short (many carriers ignore it anyway)
    subject = "Alert" if language == 'en' else "Alerta"
    
    # Plain text body (SMS is text-only)
    text_body = message
    
    # Create simple HTML version (some carriers support it)
    html_body = f"<html><body><p>{message.replace(chr(10), '<br>')}</p></body></html>"
    
    # Send via email service (which uses Resend or SMTP)
    carrier_info = f" (carrier: {carrier or DEFAULT_CARRIER})" if carrier else f" (default carrier: {DEFAULT_CARRIER})"
    print(f"📱 Sending SMS to {phone}{carrier_info} via {sms_email}...")
    result = send_email(sms_email, subject, html_body, text_body)
    
    if result:
        print(f"✅ SMS sent successfully to {phone} via {sms_email}")
        print(f"   💡 If SMS not received, verify phone uses {carrier or DEFAULT_CARRIER} carrier or specify correct carrier")
    else:
        print(f"❌ Failed to send SMS to {phone} via {sms_email}")
    
    return result

def send_medication_alert_sms(resident_name, medication_name, scheduled_time, phone, carrier=None, language='en'):
    """
    Send medication alert SMS
    
    Args:
        resident_name: Name of the resident
        medication_name: Name of the medication
        scheduled_time: Scheduled time for medication
        phone: Staff/contact phone number
        carrier: Carrier name (optional)
        language: 'en' or 'es'
    """
    if language == 'es':
        message = f"⚠️ Alerta: {resident_name} - Medicamento '{medication_name}' no administrado a las {scheduled_time}"
    else:  # English
        message = f"⚠️ Alert: {resident_name} - Medication '{medication_name}' not taken at {scheduled_time}"
    
    return send_sms(phone, message, carrier, language)

def send_vital_signs_alert_sms(resident_name, vital_type, value, threshold, phone, carrier=None, language='en'):
    """
    Send vital signs alert SMS
    
    Args:
        resident_name: Name of the resident
        vital_type: Type of vital sign (e.g., "Blood Pressure", "Glucose")
        value: Current value
        threshold: Threshold that was exceeded
        phone: Staff/contact phone number
        carrier: Carrier name (optional)
        language: 'en' or 'es'
    """
    if language == 'es':
        message = f"🚨 Alerta: {resident_name} - {vital_type}: {value} (Umbral: {threshold})"
    else:  # English
        message = f"🚨 Alert: {resident_name} - {vital_type}: {value} (Threshold: {threshold})"
    
    return send_sms(phone, message, carrier, language)

def send_incident_alert_sms(resident_name, incident_type, severity, phone, carrier=None, language='en'):
    """
    Send incident alert SMS
    
    Args:
        resident_name: Name of the resident
        incident_type: Type of incident
        severity: Severity level
        phone: Staff/contact phone number
        carrier: Carrier name (optional)
        language: 'en' or 'es'
    """
    if language == 'es':
        message = f"⚠️ Incidente: {resident_name} - {incident_type} (Severidad: {severity})"
    else:  # English
        message = f"⚠️ Incident: {resident_name} - {incident_type} (Severity: {severity})"
    
    return send_sms(phone, message, carrier, language)

def send_custom_alert_sms(phone, message, carrier=None, language='en'):
    """
    Send custom alert SMS
    
    Args:
        phone: Recipient phone number
        message: Message content
        carrier: Carrier name (optional)
        language: 'en' or 'es' (not used, kept for API compatibility)
    """
    return send_sms(phone, message, carrier, language)

# Test function (can be called to test SMS sending)
if __name__ == '__main__':
    print("📱 SMS Service Test")
    print("=" * 50)
    
    # Example usage
    test_phone = input("Enter test phone number (10 digits): ").strip()
    if not test_phone:
        print("No phone number provided, exiting.")
        exit(1)
    
    test_message = "Test SMS from Elder Care Management System"
    result = send_sms(test_phone, test_message)
    
    if result:
        print("\n✅ Test SMS sent successfully!")
        print(f"   Check phone: {test_phone}")
    else:
        print("\n❌ Test SMS failed. Check email service configuration.")

