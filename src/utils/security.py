import random
import hashlib
import time
import re
import requests
from datetime import datetime, timedelta
from flask import request
from user_agents import parse
import ipaddress
from urllib.parse import urlparse

class SecurityManager:
    """Advanced security manager for anti-flagging and bot detection"""
    
    def __init__(self):
        self.bot_patterns = [
            r'bot', r'crawler', r'spider', r'scraper', r'curl', r'wget',
            r'python', r'java', r'go-http', r'okhttp', r'apache',
            r'scanner', r'monitor', r'check', r'test', r'probe'
        ]
        
        self.suspicious_headers = [
            'x-forwarded-for', 'x-real-ip', 'x-cluster-client-ip',
            'x-forwarded', 'forwarded-for', 'forwarded'
        ]
        
        self.legitimate_user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.2088.76'
        ]
        
        self.rate_limits = {}
        self.ip_reputation_cache = {}
        
    def detect_bot(self, user_agent, ip_address, headers):
        """Advanced bot detection using multiple signals"""
        confidence_score = 0
        reasons = []
        
        # User agent analysis
        if user_agent:
            ua_lower = user_agent.lower()
            for pattern in self.bot_patterns:
                if re.search(pattern, ua_lower):
                    confidence_score += 30
                    reasons.append(f'Bot pattern in UA: {pattern}')
                    break
            
            # Parse user agent for more details
            try:
                parsed_ua = parse(user_agent)
                if not parsed_ua.is_pc and not parsed_ua.is_mobile and not parsed_ua.is_tablet:
                    confidence_score += 25
                    reasons.append('Non-standard device type')
                
                if parsed_ua.browser.family == 'Other':
                    confidence_score += 20
                    reasons.append('Unknown browser')
                    
            except Exception:
                confidence_score += 15
                reasons.append('Unparseable user agent')
        else:
            confidence_score += 40
            reasons.append('Missing user agent')
        
        # IP address analysis
        if ip_address:
            # Check if IP is in known bot ranges
            if self._is_suspicious_ip(ip_address):
                confidence_score += 35
                reasons.append('Suspicious IP range')
            
            # Check IP reputation
            reputation = self._get_ip_reputation(ip_address)
            if reputation == 'bad':
                confidence_score += 40
                reasons.append('Bad IP reputation')
            elif reputation == 'suspicious':
                confidence_score += 25
                reasons.append('Suspicious IP reputation')
        
        # Header analysis
        suspicious_header_count = 0
        for header in self.suspicious_headers:
            if header in headers:
                suspicious_header_count += 1
        
        if suspicious_header_count > 2:
            confidence_score += 20
            reasons.append('Multiple proxy headers')
        
        # Missing common headers
        common_headers = ['accept', 'accept-language', 'accept-encoding']
        missing_headers = [h for h in common_headers if h not in headers]
        if len(missing_headers) > 1:
            confidence_score += 15
            reasons.append('Missing common headers')
        
        # Determine if it's a bot
        is_bot = confidence_score >= 50
        threat_level = 'High' if confidence_score >= 70 else 'Medium' if confidence_score >= 40 else 'Low'
        
        return {
            'is_bot': is_bot,
            'confidence_score': min(confidence_score, 100),
            'threat_level': threat_level,
            'reasons': reasons
        }
    
    def _is_suspicious_ip(self, ip_address):
        """Check if IP is in suspicious ranges"""
        try:
            ip = ipaddress.ip_address(ip_address)
            
            # Known cloud/hosting provider ranges (simplified)
            suspicious_ranges = [
                '54.0.0.0/8',      # AWS
                '52.0.0.0/8',      # AWS
                '34.0.0.0/8',      # Google Cloud
                '35.0.0.0/8',      # Google Cloud
                '104.0.0.0/8',     # DigitalOcean
                '167.0.0.0/8',     # DigitalOcean
            ]
            
            for range_str in suspicious_ranges:
                if ip in ipaddress.ip_network(range_str):
                    return True
            
            return False
        except Exception:
            return False
    
    def _get_ip_reputation(self, ip_address):
        """Get IP reputation (cached)"""
        if ip_address in self.ip_reputation_cache:
            cache_entry = self.ip_reputation_cache[ip_address]
            if datetime.utcnow() - cache_entry['timestamp'] < timedelta(hours=1):
                return cache_entry['reputation']
        
        # Simple reputation check (in real implementation, use actual reputation APIs)
        reputation = 'good'  # Default
        
        # Cache the result
        self.ip_reputation_cache[ip_address] = {
            'reputation': reputation,
            'timestamp': datetime.utcnow()
        }
        
        return reputation
    
    def check_rate_limit(self, ip_address, limit_per_minute=10):
        """Check if IP is rate limited"""
        current_time = time.time()
        minute_window = int(current_time // 60)
        
        if ip_address not in self.rate_limits:
            self.rate_limits[ip_address] = {}
        
        ip_limits = self.rate_limits[ip_address]
        
        # Clean old entries
        old_windows = [w for w in ip_limits.keys() if w < minute_window - 5]
        for old_window in old_windows:
            del ip_limits[old_window]
        
        # Check current window
        if minute_window not in ip_limits:
            ip_limits[minute_window] = 0
        
        ip_limits[minute_window] += 1
        
        # Check if rate limit exceeded
        total_requests = sum(ip_limits.values())
        return total_requests > limit_per_minute
    
    def generate_dynamic_signature(self, base_url, timestamp=None):
        """Generate dynamic signatures to avoid pattern recognition"""
        if timestamp is None:
            timestamp = int(time.time())
        
        # Create a dynamic hash based on time and random factors
        random_factor = random.randint(1000, 9999)
        signature_data = f"{base_url}:{timestamp}:{random_factor}"
        signature = hashlib.md5(signature_data.encode()).hexdigest()[:8]
        
        return signature
    
    def get_random_user_agent(self):
        """Get a random legitimate user agent"""
        return random.choice(self.legitimate_user_agents)
    
    def add_security_headers(self, response):
        """Add security headers to response"""
        # Remove server identification
        response.headers.pop('Server', None)
        
        # Add security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'no-referrer'
        response.headers['Content-Security-Policy'] = "default-src 'self'"
        
        # Add fake server header to confuse scanners
        fake_servers = ['nginx/1.18.0', 'Apache/2.4.41', 'Microsoft-IIS/10.0']
        response.headers['Server'] = random.choice(fake_servers)
        
        return response
    
    def cloak_response(self, request_headers, user_agent):
        """Determine if response should be cloaked based on request characteristics"""
        # Check for security scanner signatures
        scanner_signatures = [
            'nmap', 'masscan', 'zmap', 'nikto', 'sqlmap', 'burp',
            'owasp', 'w3af', 'acunetix', 'nessus', 'openvas'
        ]
        
        if user_agent:
            ua_lower = user_agent.lower()
            for signature in scanner_signatures:
                if signature in ua_lower:
                    return True
        
        # Check for automated tool headers
        automated_headers = [
            'x-scanner', 'x-forwarded-for', 'x-originating-ip',
            'x-remote-ip', 'x-remote-addr'
        ]
        
        for header in automated_headers:
            if header.lower() in [h.lower() for h in request_headers.keys()]:
                return True
        
        return False
    
    def generate_decoy_response(self):
        """Generate a decoy response for suspicious requests"""
        decoy_responses = [
            {'status': 404, 'message': 'Not Found'},
            {'status': 403, 'message': 'Forbidden'},
            {'status': 500, 'message': 'Internal Server Error'},
            {'status': 503, 'message': 'Service Temporarily Unavailable'}
        ]
        
        return random.choice(decoy_responses)
    
    def rotate_endpoint(self, base_endpoint):
        """Generate rotated endpoint to avoid pattern recognition"""
        timestamp = int(time.time() // 3600)  # Change every hour
        rotation_hash = hashlib.md5(f"{base_endpoint}:{timestamp}".encode()).hexdigest()[:6]
        return f"{base_endpoint}_{rotation_hash}"
    
    def validate_request_timing(self, ip_address):
        """Validate request timing to detect automated behavior"""
        current_time = time.time()
        
        if ip_address not in self.rate_limits:
            self.rate_limits[ip_address] = {'last_request': current_time, 'intervals': []}
            return True
        
        last_request = self.rate_limits[ip_address]['last_request']
        interval = current_time - last_request
        
        # Store intervals for pattern analysis
        intervals = self.rate_limits[ip_address]['intervals']
        intervals.append(interval)
        
        # Keep only last 10 intervals
        if len(intervals) > 10:
            intervals.pop(0)
        
        # Update last request time
        self.rate_limits[ip_address]['last_request'] = current_time
        
        # Check for automated patterns (too regular intervals)
        if len(intervals) >= 5:
            avg_interval = sum(intervals) / len(intervals)
            variance = sum((x - avg_interval) ** 2 for x in intervals) / len(intervals)
            
            # If variance is very low, it might be automated
            if variance < 0.1 and avg_interval < 2:
                return False
        
        return True

# Global security manager instance
security_manager = SecurityManager()

