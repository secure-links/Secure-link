#!/usr/bin/env python3
"""
Script to create test tracking data for the Brain Link Tracker application.
This will populate the database with realistic tracking events for testing.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db, User
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from src.main import app
from datetime import datetime, timedelta
import random
import uuid

def create_test_data():
    """Create test tracking data"""
    
    with app.app_context():
        # Get the Brain user
        user = User.query.filter_by(username='Brain').first()
        if not user:
            print("User 'Brain' not found. Please create the user first.")
            return
        
        # Get or create a test link
        test_link = Link.query.filter_by(user_id=user.id).first()
        if not test_link:
            test_link = Link(
                user_id=user.id,
                title="Test Phishing Link",
                short_code="test123",
                target_url="https://example.com",
                bot_blocking_enabled=True,
                geo_targeting_enabled=True,
                allowed_countries='["US", "GB", "CA"]',
                blocked_countries='["CN", "RU"]'
            )
            db.session.add(test_link)
            db.session.commit()
        
        # Sample data for realistic tracking events
        countries_data = [
            {"country": "United States", "country_code": "US", "city": "New York", "region": "New York", "lat": 40.7128, "lon": -74.0060, "timezone": "America/New_York", "isp": "Verizon"},
            {"country": "United States", "country_code": "US", "city": "Los Angeles", "region": "California", "lat": 34.0522, "lon": -118.2437, "timezone": "America/Los_Angeles", "isp": "AT&T"},
            {"country": "United Kingdom", "country_code": "GB", "city": "London", "region": "England", "lat": 51.5074, "lon": -0.1278, "timezone": "Europe/London", "isp": "BT Group"},
            {"country": "Canada", "country_code": "CA", "city": "Toronto", "region": "Ontario", "lat": 43.6532, "lon": -79.3832, "timezone": "America/Toronto", "isp": "Rogers"},
            {"country": "Germany", "country_code": "DE", "city": "Berlin", "region": "Berlin", "lat": 52.5200, "lon": 13.4050, "timezone": "Europe/Berlin", "isp": "Deutsche Telekom"},
            {"country": "France", "country_code": "FR", "city": "Paris", "region": "Île-de-France", "lat": 48.8566, "lon": 2.3522, "timezone": "Europe/Paris", "isp": "Orange"},
        ]
        
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/118.0 Firefox/118.0",
        ]
        
        emails = [
            "john.doe@example.com",
            "sarah.smith@company.com", 
            "mike.johnson@email.co.uk",
            "lisa.brown@business.org",
            "david.wilson@corp.net",
            "emma.davis@startup.io",
            "alex.taylor@enterprise.com",
            "jessica.moore@agency.co",
        ]
        
        # Create tracking events for the last 7 days
        now = datetime.utcnow()
        
        for i in range(50):  # Create 50 test events
            # Random timestamp in the last 7 days
            days_ago = random.randint(0, 7)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            timestamp = now - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
            
            # Random location data
            location = random.choice(countries_data)
            
            # Random IP address
            ip_address = f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}"
            
            # Random user agent
            user_agent = random.choice(user_agents)
            
            # Random email (some events won't have captured emails)
            captured_email = random.choice(emails) if random.random() > 0.3 else None
            
            # Random bot detection
            is_bot = random.random() < 0.1  # 10% chance of being a bot
            
            # Random status based on probabilities
            status_rand = random.random()
            if is_bot:
                status = "blocked"
                blocked_reason = "bot_detected"
                email_opened = False
                redirected = False
                on_page = False
            elif status_rand < 0.1:
                status = "blocked"
                blocked_reason = random.choice(["country_blocked", "unknown_location", "social_referrer_facebook"])
                email_opened = False
                redirected = False
                on_page = False
            elif status_rand < 0.3:
                status = "email_opened"
                blocked_reason = None
                email_opened = True
                redirected = False
                on_page = False
            elif status_rand < 0.7:
                status = "redirected"
                blocked_reason = None
                email_opened = True
                redirected = True
                on_page = False
            else:
                status = "on_page"
                blocked_reason = None
                email_opened = True
                redirected = True
                on_page = True
            
            # Create tracking event
            event = TrackingEvent(
                link_id=test_link.id,
                timestamp=timestamp,
                ip_address=ip_address,
                user_agent=user_agent,
                country=location["country"],
                country_code=location["country_code"],
                city=location["city"],
                region=location["region"],
                latitude=location["lat"],
                longitude=location["lon"],
                timezone=location["timezone"],
                isp=location["isp"],
                captured_email=captured_email,
                captured_password=None,
                status=status,
                blocked_reason=blocked_reason,
                unique_id=str(uuid.uuid4()),
                email_opened=email_opened,
                redirected=redirected,
                on_page=on_page,
                is_bot=is_bot
            )
            
            db.session.add(event)
        
        # Commit all events
        db.session.commit()
        print(f"✓ Created 50 test tracking events for link: {test_link.title}")
        
        # Print summary
        total_events = TrackingEvent.query.filter_by(link_id=test_link.id).count()
        blocked_events = TrackingEvent.query.filter_by(link_id=test_link.id, status='blocked').count()
        email_opens = TrackingEvent.query.filter_by(link_id=test_link.id, email_opened=True).count()
        redirects = TrackingEvent.query.filter_by(link_id=test_link.id, redirected=True).count()
        on_page = TrackingEvent.query.filter_by(link_id=test_link.id, on_page=True).count()
        
        print(f"\n📊 Summary:")
        print(f"Total Events: {total_events}")
        print(f"Email Opens: {email_opens}")
        print(f"Redirects: {redirects}")
        print(f"On Page: {on_page}")
        print(f"Blocked: {blocked_events}")

if __name__ == "__main__":
    print("Creating test tracking data...")
    create_test_data()
    print("\n🎉 Test data creation completed!")

