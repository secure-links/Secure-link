import re
import requests
from user_agents import parse
from datetime import datetime, timedelta
import json

# Common bot user agents patterns
BOT_PATTERNS = [
    r'bot', r'crawler', r'spider', r'scraper', r'curl', r'wget', r'python',
    r'java', r'php', r'perl', r'ruby', r'go-http', r'okhttp', r'apache',
    r'nginx', r'monitoring', r'uptime', r'check', r'test', r'scan',
    r'facebook', r'twitter', r'linkedin', r'telegram', r'whatsapp',
    r'googlebot', r'bingbot', r'slurp', r'duckduckbot', r'baiduspider'
]

# Suspicious IP ranges (example - can be expanded)
SUSPICIOUS_IP_RANGES = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8'
]

def is_bot(user_agent, ip_address=None):
    """
    Detect if the request is from a bot based on user agent and other factors
    """
    if not user_agent:
        return True
    
    user_agent_lower = user_agent.lower()
    
    # Check against bot patterns
    for pattern in BOT_PATTERNS:
        if re.search(pattern, user_agent_lower):
            return True
    
    # Parse user agent for additional checks
    try:
        parsed_ua = parse(user_agent)
        
        # Check if it's a known bot
        if parsed_ua.is_bot:
            return True
            
        # Check for suspicious browser/OS combinations
        if not parsed_ua.browser.family or not parsed_ua.os.family:
            return True
            
        # Check for very old or unusual browsers
        if parsed_ua.browser.family in ['Other', 'Generic']:
            return True
            
    except Exception:
        # If parsing fails, consider it suspicious
        return True
    
    return False

def get_geolocation(ip_address):
    """
    Get geolocation information for an IP address
    Using a free IP geolocation service
    """
    try:
        # Using ipapi.co free service (1000 requests per day)
        response = requests.get(f'https://ipapi.co/{ip_address}/json/', timeout=5)
        if response.status_code == 200:
            data = response.json()
            return {
                'country': data.get('country_name', 'Unknown'),
                'country_code': data.get('country_code', ''),
                'city': data.get('city', 'Unknown'),
                'region': data.get('region', ''),
                'zip_code': data.get('postal', ''),
                'latitude': data.get('latitude'),
                'longitude': data.get('longitude'),
                'timezone': data.get('timezone', ''),
                'isp': data.get('org', '')
            }
    except Exception as e:
        print(f"Geolocation error: {e}")
    
    return {
        'country': 'Unknown',
        'country_code': '',
        'city': 'Unknown',
        'region': '',
        'latitude': None,
        'longitude': None,
        'timezone': '',
        'isp': ''
    }

def is_country_allowed(country_code, allowed_countries, blocked_countries):
    """
    Check if a country is allowed based on whitelist/blacklist
    """
    if not country_code:
        return True
    
    # If there's a whitelist, only allow countries in it
    if allowed_countries:
        return country_code.upper() in [c.upper() for c in allowed_countries]
    
    # If there's a blacklist, block countries in it
    if blocked_countries:
        return country_code.upper() not in [c.upper() for c in blocked_countries]
    
    # If no restrictions, allow all
    return True

def is_city_allowed(city, allowed_cities, blocked_cities):
    """
    Check if a city is allowed based on whitelist/blacklist
    """
    if not city:
        return True
    
    city_lower = city.lower()
    
    # If there's a whitelist, only allow cities in it
    if allowed_cities:
        return city_lower in [c.lower() for c in allowed_cities]
    
    # If there's a blacklist, block cities in it
    if blocked_cities:
        return city_lower not in [c.lower() for c in blocked_cities]
    
    # If no restrictions, allow all
    return True

def check_rate_limit(ip_address, link_id, max_requests=10, time_window=60):
    """
    Simple in-memory rate limiting (in production, use Redis)
    """
    # This is a simplified implementation
    # In production, you'd use Redis or a proper rate limiting service
    return True  # For now, always allow

def generate_short_code(length=6):
    """
    Generate a random short code for links
    """
    import random
    import string
    
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def parse_user_agent_details(user_agent):
    """
    Parse user agent to extract device, browser, and OS information
    """
    try:
        parsed = parse(user_agent)
        return {
            'device_type': 'Mobile' if parsed.is_mobile else ('Tablet' if parsed.is_tablet else 'Desktop'),
            'browser': f"{parsed.browser.family} {parsed.browser.version_string}".strip(),
            'os': f"{parsed.os.family} {parsed.os.version_string}".strip()
        }
    except Exception:
        return {
            'device_type': 'Unknown',
            'browser': 'Unknown',
            'os': 'Unknown'
        }

def is_suspicious_request(user_agent, referer, ip_address):
    """
    Additional security checks for suspicious requests
    """
    suspicious_score = 0
    
    # Check user agent
    if not user_agent or len(user_agent) < 10:
        suspicious_score += 3
    
    # Check for common attack patterns in user agent
    attack_patterns = ['<script', 'javascript:', 'eval(', 'alert(', 'document.cookie']
    for pattern in attack_patterns:
        if pattern.lower() in user_agent.lower():
            suspicious_score += 5
    
    # Check referer
    if referer:
        # Check for suspicious referer patterns
        suspicious_referers = ['localhost', '127.0.0.1', 'file://', 'data:']
        for sus_ref in suspicious_referers:
            if sus_ref in referer.lower():
                suspicious_score += 2
    
    # Return True if suspicious score is high
    return suspicious_score >= 5

def get_client_ip(request):
    """
    Get the real client IP address from request headers
    """
    # Check for forwarded headers (common in production behind proxies)
    forwarded_ips = request.headers.get('X-Forwarded-For')
    if forwarded_ips:
        # Take the first IP in the chain
        return forwarded_ips.split(',')[0].strip()
    
    # Check other common headers
    real_ip = request.headers.get('X-Real-IP')
    if real_ip:
        return real_ip
    
    # Fallback to remote address
    return request.remote_addr or '127.0.0.1'

