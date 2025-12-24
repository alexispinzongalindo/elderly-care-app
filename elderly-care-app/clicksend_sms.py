"""
ClickSend SMS Service Integration
Alternative to email-to-SMS gateways - more reliable but costs ~$0.09/SMS
Supports SMS and WhatsApp Business API

Setup:
1. Sign up at https://clicksend.com
2. Get API key from dashboard
3. Set environment variable: CLICKSEND_API_KEY=your_api_key
4. Set environment variable: CLICKSEND_USERNAME=your_username (or email)
5. (Optional) Set CLICKSEND_WHATSAPP_ENABLED=true for WhatsApp support
"""

import os
import json
import urllib.request
import urllib.parse
import urllib.error
import base64
from sms_service import normalize_phone  # Reuse phone normalization

# ClickSend Configuration
# Strip whitespace to avoid auth issues from copy/paste
CLICKSEND_API_KEY = os.getenv('CLICKSEND_API_KEY', '').strip()
CLICKSEND_USERNAME = os.getenv('CLICKSEND_USERNAME', '').strip()  # Your ClickSend username/email
CLICKSEND_WHATSAPP_ENABLED = os.getenv('CLICKSEND_WHATSAPP_ENABLED', '').lower().strip() == 'true'

# ClickSend API endpoints
CLICKSEND_SMS_API = "https://rest.clicksend.com/v3/sms/send"
CLICKSEND_WHATSAPP_API = "https://rest.clicksend.com/v3/whatsapp/messages"

def send_sms_via_clicksend(phone, message, carrier=None, language='en'):
    """
    Send SMS via ClickSend API

    Args:
        phone: Recipient phone number (any format)
        message: SMS message text
        carrier: Carrier name (not needed for ClickSend, kept for API compatibility)
        language: 'en' or 'es' (not used, kept for API compatibility)

    Returns:
        bool: True if SMS sent successfully, False otherwise
    """
    if not CLICKSEND_API_KEY:
        print("❌ ClickSend API key not configured. Set CLICKSEND_API_KEY environment variable.")
        return False

    if not CLICKSEND_USERNAME:
        print("❌ ClickSend username not configured. Set CLICKSEND_USERNAME environment variable.")
        return False

    # Normalize phone number
    normalized = normalize_phone(phone)
    if not normalized:
        print(f"⚠️ Invalid phone number format: {phone}")
        return False

    # Format phone with country code (US/PR: +1)
    formatted_phone = f"+1{normalized}"

    # Truncate message to 160 characters for SMS compatibility
    if len(message) > 160:
        message = message[:157] + "..."
        print(f"⚠️ Message truncated to 160 characters for SMS compatibility")

    try:
        # Prepare request data
        # ClickSend API v3 format requires "source" field (can be phone number or identifier)
        message_data = {
            "source": "sdk",  # ClickSend SDK identifier (or use a phone number if you have one)
            "body": message,
            "to": formatted_phone
        }
        # Note: "from" field is NOT used in ClickSend v3 API - use "source" instead
        
        data = {
            "messages": [message_data]
        }

        json_data = json.dumps(data).encode('utf-8')

        # Create request with basic auth
        # ClickSend uses username:api_key format for Basic Auth
        auth_string = f"{CLICKSEND_USERNAME}:{CLICKSEND_API_KEY}"
        auth_bytes = auth_string.encode('utf-8')
        auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')

        req = urllib.request.Request(CLICKSEND_SMS_API, data=json_data, method='POST')
        req.add_header('Authorization', f'Basic {auth_b64}')
        req.add_header('Content-Type', 'application/json')

        # Debug: Log request details (but don't log full auth string)
        print(f"📱 Sending SMS via ClickSend to {formatted_phone}...")
        print(f"   Username: {CLICKSEND_USERNAME}")
        print(f"   API Key: {'SET' if CLICKSEND_API_KEY else 'NOT SET'} (length: {len(CLICKSEND_API_KEY) if CLICKSEND_API_KEY else 0})")
        print(f"   Request URL: {CLICKSEND_SMS_API}")
        print(f"   Request body: {json.dumps(data, indent=2)}", flush=True)
        with urllib.request.urlopen(req, timeout=10) as response:
            response_data = json.loads(response.read().decode('utf-8'))

            if response.getcode() == 200:
                # Check response for success
                if response_data.get('response_code') == 'SUCCESS' or response_data.get('http_code') == 200:
                    print(f"✅ SMS sent successfully via ClickSend to {formatted_phone}")
                    print(f"   ClickSend Message ID: {response_data.get('data', {}).get('messages', [{}])[0].get('message_id', 'N/A')}")
                    return True
                else:
                    print(f"❌ ClickSend API returned error: {response_data}")
                    return False
            else:
                print(f"❌ ClickSend API returned status {response.getcode()}: {response_data}")
                return False

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"❌ ClickSend API HTTP Error {e.code}: {error_body}")
        
        # Parse error response for details
        try:
            error_data = json.loads(error_body)
            print(f"   📋 Parsed error response:")
            for key, value in error_data.items():
                print(f"      {key}: {value}")
        except:
            print(f"   📋 Raw error response: {error_body}")
        
        if e.code == 401:
            print(f"\n   🔍 401 UNAUTHORIZED - Authentication Failed")
            print(f"   📝 Credentials being used:")
            print(f"      - Username: '{CLICKSEND_USERNAME}' (length: {len(CLICKSEND_USERNAME)})")
            print(f"      - API Key: {'SET' if CLICKSEND_API_KEY else 'NOT SET'} (length: {len(CLICKSEND_API_KEY) if CLICKSEND_API_KEY else 0})")
            print(f"      - First 4 chars of API key: {CLICKSEND_API_KEY[:4] if len(CLICKSEND_API_KEY) >= 4 else 'N/A'}...")
            print(f"\n   💡 Troubleshooting steps:")
            print(f"      1. Verify credentials in ClickSend dashboard (API section)")
            print(f"      2. Check for hidden spaces - credentials have been trimmed")
            print(f"      3. Ensure account is fully activated")
            print(f"      4. Verify account has credits/balance")
            print(f"      5. Try regenerating API key in ClickSend dashboard")
            print(f"      6. If using email as username, try using actual username instead")
            
            # Log auth string format (without exposing full key)
            auth_preview = f"{CLICKSEND_USERNAME}:[HIDDEN]"
            print(f"\n   🔐 Auth string format: {auth_preview}")
        
        return False
    except Exception as e:
        print(f"❌ Error sending SMS via ClickSend: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def send_whatsapp_via_clicksend(phone, message, language='en'):
    """
    Send WhatsApp message via ClickSend (requires WhatsApp Business API setup)

    Args:
        phone: Recipient phone number (any format)
        message: Message text
        language: 'en' or 'es' (not used, kept for API compatibility)

    Returns:
        bool: True if message sent successfully, False otherwise
    """
    if not CLICKSEND_WHATSAPP_ENABLED:
        print("⚠️ ClickSend WhatsApp not enabled. Set CLICKSEND_WHATSAPP_ENABLED=true")
        return False

    if not CLICKSEND_API_KEY or not CLICKSEND_USERNAME:
        print("❌ ClickSend credentials not configured")
        return False

    # Normalize phone number
    normalized = normalize_phone(phone)
    if not normalized:
        print(f"⚠️ Invalid phone number format: {phone}")
        return False

    # Format phone with country code
    formatted_phone = f"+1{normalized}"

    try:
        # Prepare request data for WhatsApp
        data = {
            "to": formatted_phone,
            "body": message,
            "from": None  # ClickSend will use default WhatsApp Business number
        }

        json_data = json.dumps(data).encode('utf-8')

        # Create request with basic auth
        auth_string = f"{CLICKSEND_USERNAME}:{CLICKSEND_API_KEY}"
        auth_bytes = auth_string.encode('utf-8')
        auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')

        req = urllib.request.Request(CLICKSEND_WHATSAPP_API, data=json_data, method='POST')
        req.add_header('Authorization', f'Basic {auth_b64}')
        req.add_header('Content-Type', 'application/json')

        print(f"💬 Sending WhatsApp via ClickSend to {formatted_phone}...")
        with urllib.request.urlopen(req, timeout=10) as response:
            response_data = json.loads(response.read().decode('utf-8'))

            if response.getcode() == 200:
                print(f"✅ WhatsApp sent successfully via ClickSend to {formatted_phone}")
                return True
            else:
                print(f"❌ ClickSend WhatsApp API returned status {response.getcode()}: {response_data}")
                return False

    except Exception as e:
        print(f"❌ Error sending WhatsApp via ClickSend: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

# Compatibility functions matching sms_service.py interface
def send_sms(phone, message, carrier=None, language='en'):
    """Send SMS via ClickSend - matches sms_service.py interface"""
    return send_sms_via_clicksend(phone, message, carrier, language)

def send_medication_alert_sms(resident_name, medication_name, scheduled_time, phone, carrier=None, language='en'):
    """Send medication alert SMS via ClickSend"""
    if language == 'es':
        message = f"⚠️ Alerta: {resident_name} - Medicamento '{medication_name}' no administrado a las {scheduled_time}"
    else:
        message = f"⚠️ Alert: {resident_name} - Medication '{medication_name}' not taken at {scheduled_time}"

    return send_sms_via_clicksend(phone, message, carrier, language)

def send_vital_signs_alert_sms(resident_name, vital_type, value, threshold, phone, carrier=None, language='en'):
    """Send vital signs alert SMS via ClickSend"""
    if language == 'es':
        message = f"🚨 Alerta: {resident_name} - {vital_type}: {value} (Umbral: {threshold})"
    else:
        message = f"🚨 Alert: {resident_name} - {vital_type}: {value} (Threshold: {threshold})"

    return send_sms_via_clicksend(phone, message, carrier, language)

def send_incident_alert_sms(resident_name, incident_type, severity, phone, carrier=None, language='en'):
    """Send incident alert SMS via ClickSend"""
    if language == 'es':
        message = f"⚠️ Incidente: {resident_name} - {incident_type} (Severidad: {severity})"
    else:
        message = f"⚠️ Incident: {resident_name} - {incident_type} (Severity: {severity})"

    return send_sms_via_clicksend(phone, message, carrier, language)

def send_custom_alert_sms(phone, message, carrier=None, language='en'):
    """Send custom alert SMS via ClickSend"""
    return send_sms_via_clicksend(phone, message, carrier, language)

# Test function
if __name__ == '__main__':
    print("📱 ClickSend SMS Service Test")
    print("=" * 50)

    if not CLICKSEND_API_KEY:
        print("❌ CLICKSEND_API_KEY not set")
        exit(1)

    if not CLICKSEND_USERNAME:
        print("❌ CLICKSEND_USERNAME not set")
        exit(1)

    test_phone = input("Enter test phone number (10 digits): ").strip()
    if not test_phone:
        print("No phone number provided, exiting.")
        exit(1)

    test_message = "Test SMS from Elder Care Management System via ClickSend"
    result = send_sms_via_clicksend(test_phone, test_message)

    if result:
        print("\n✅ Test SMS sent successfully!")
        print(f"   Check phone: {test_phone}")
    else:
        print("\n❌ Test SMS failed. Check ClickSend configuration.")
