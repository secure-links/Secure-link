#!/usr/bin/env python3
"""
Comprehensive Production Test Suite for Brain Link Tracker
Tests all critical functionality before production launch
"""

import os
import sys
import time
import requests
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db, User
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from src.main import app

class ProductionTestSuite:
    def __init__(self):
        self.base_url = "http://localhost:5000"
        self.test_results = []
        self.critical_failures = []
        
    def log_test(self, test_name, status, message="", critical=False):
        """Log test results"""
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'critical': critical
        }
        self.test_results.append(result)
        
        status_symbol = "✅" if status == "PASS" else "❌"
        critical_marker = " [CRITICAL]" if critical else ""
        print(f"{status_symbol} {test_name}: {status}{critical_marker}")
        if message:
            print(f"   {message}")
            
        if status == "FAIL" and critical:
            self.critical_failures.append(result)
    
    def test_environment_variables(self):
        """Test that all required environment variables are set"""
        print("\n🔧 Testing Environment Variables...")
        
        required_vars = ['SECRET_KEY', 'DATABASE_URL']
        for var in required_vars:
            value = os.environ.get(var)
            if value:
                self.log_test(f"Environment Variable {var}", "PASS", f"Set (length: {len(value)})", critical=True)
            else:
                self.log_test(f"Environment Variable {var}", "FAIL", "Not set", critical=True)
    
    def test_database_connection(self):
        """Test database connectivity and basic operations"""
        print("\n🗄️ Testing Database Connection...")
        
        try:
            with app.app_context():
                # Test connection with newer SQLAlchemy syntax
                with db.engine.connect() as connection:
                    result = connection.execute(db.text("SELECT 1"))
                    self.log_test("Database Connection", "PASS", "Successfully connected to database", critical=True)
                
                # Test table creation
                db.create_all()
                self.log_test("Database Schema", "PASS", "Tables created successfully", critical=True)
                
                # Test basic operations
                test_user = User.query.filter_by(username='Brain').first()
                if test_user:
                    self.log_test("Test User Exists", "PASS", f"User 'Brain' found with ID {test_user.id}")
                else:
                    # Create test user
                    test_user = User(username='Brain', email='test@brainlinktracker.com')
                    test_user.set_password('Mayflower1!!')
                    db.session.add(test_user)
                    db.session.commit()
                    self.log_test("Test User Creation", "PASS", "Created test user 'Brain'")
                
        except Exception as e:
            self.log_test("Database Connection", "FAIL", f"Database error: {str(e)}", critical=True)
    
    def test_flask_application_startup(self):
        """Test Flask application startup and basic configuration"""
        print("\n🚀 Testing Flask Application...")
        
        try:
            # Test app configuration
            with app.app_context():
                secret_key = app.config.get('SECRET_KEY')
                if secret_key and len(secret_key) > 20:
                    self.log_test("Flask Secret Key", "PASS", f"Secret key configured (length: {len(secret_key)})", critical=True)
                else:
                    self.log_test("Flask Secret Key", "FAIL", "Secret key not properly configured", critical=True)
                
                # Test database URI
                db_uri = app.config.get('SQLALCHEMY_DATABASE_URI')
                if db_uri and 'postgresql' in db_uri:
                    self.log_test("Database URI", "PASS", "PostgreSQL configured for production", critical=True)
                elif db_uri and 'sqlite' in db_uri:
                    self.log_test("Database URI", "PASS", "SQLite configured (development mode)")
                else:
                    self.log_test("Database URI", "FAIL", "Database URI not configured", critical=True)
                
                # Test security settings
                if app.config.get('SESSION_COOKIE_SECURE'):
                    self.log_test("Security Settings", "PASS", "Secure cookies enabled")
                else:
                    self.log_test("Security Settings", "WARN", "Secure cookies disabled (development mode)")
                    
        except Exception as e:
            self.log_test("Flask Application", "FAIL", f"Application error: {str(e)}", critical=True)
    
    def test_api_endpoints(self):
        """Test all critical API endpoints"""
        print("\n🌐 Testing API Endpoints...")
        
        # Start Flask app in test mode
        app.config['TESTING'] = True
        client = app.test_client()
        
        try:
            # Test authentication endpoint
            response = client.post('/api/auth/login', 
                                 json={'username': 'Brain', 'password': 'Mayflower1!!'})
            if response.status_code == 200:
                self.log_test("Authentication API", "PASS", "Login endpoint working", critical=True)
            else:
                self.log_test("Authentication API", "FAIL", f"Login failed: {response.status_code}", critical=True)
            
            # Test analytics endpoints
            response = client.get('/api/link-stats')
            if response.status_code == 200:
                data = response.get_json()
                self.log_test("Analytics API", "PASS", f"Link stats endpoint working")
            else:
                self.log_test("Analytics API", "FAIL", f"Analytics endpoint failed: {response.status_code}")
            
            # Test geo analytics
            response = client.get('/api/geo-analytics')
            if response.status_code == 200:
                data = response.get_json()
                if data.get('success'):
                    self.log_test("Geo Analytics API", "PASS", "Geographic analytics working")
                else:
                    self.log_test("Geo Analytics API", "FAIL", "Geographic analytics returned error")
            else:
                self.log_test("Geo Analytics API", "FAIL", f"Geo analytics failed: {response.status_code}")
            
            # Test live activity
            response = client.get('/api/live-activity')
            if response.status_code == 200:
                data = response.get_json()
                if data.get('success'):
                    self.log_test("Live Activity API", "PASS", "Live activity endpoint working")
                else:
                    self.log_test("Live Activity API", "FAIL", "Live activity returned error")
            else:
                self.log_test("Live Activity API", "FAIL", f"Live activity failed: {response.status_code}")
            
            # Test security analytics
            response = client.get('/api/security-analytics')
            if response.status_code == 200:
                data = response.get_json()
                if data.get('success'):
                    self.log_test("Security Analytics API", "PASS", "Security analytics working")
                else:
                    self.log_test("Security Analytics API", "FAIL", "Security analytics returned error")
            else:
                self.log_test("Security Analytics API", "FAIL", f"Security analytics failed: {response.status_code}")
                
        except Exception as e:
            self.log_test("API Endpoints", "FAIL", f"API testing error: {str(e)}", critical=True)
    
    def test_tracking_functionality(self):
        """Test core tracking functionality"""
        print("\n📊 Testing Tracking Functionality...")
        
        client = app.test_client()
        
        try:
            with app.app_context():
                # Create a test link
                test_user = User.query.filter_by(username='Brain').first()
                if test_user:
                    test_link = Link(
                        user_id=test_user.id,
                        title="Production Test Link",
                        short_code="prodtest",
                        target_url="https://example.com",
                        bot_blocking_enabled=True,
                        geo_targeting_enabled=True
                    )
                    db.session.add(test_link)
                    db.session.commit()
                    
                    self.log_test("Test Link Creation", "PASS", f"Created test link with ID {test_link.id}")
                    
                    # Test tracking endpoint
                    response = client.get(f'/track/click/{test_link.short_code}')
                    if response.status_code in [200, 302]:  # 302 for redirect
                        self.log_test("Tracking Endpoint", "PASS", "Click tracking working")
                        
                        # Check if tracking event was created
                        tracking_event = TrackingEvent.query.filter_by(link_id=test_link.id).first()
                        if tracking_event:
                            self.log_test("Tracking Event Creation", "PASS", "Tracking event stored in database")
                        else:
                            self.log_test("Tracking Event Creation", "FAIL", "No tracking event found")
                    else:
                        self.log_test("Tracking Endpoint", "FAIL", f"Tracking failed: {response.status_code}")
                else:
                    self.log_test("Test Link Creation", "FAIL", "No test user found", critical=True)
                    
        except Exception as e:
            self.log_test("Tracking Functionality", "FAIL", f"Tracking test error: {str(e)}", critical=True)
    
    def test_frontend_static_files(self):
        """Test that frontend static files are accessible"""
        print("\n🎨 Testing Frontend Static Files...")
        
        client = app.test_client()
        
        try:
            # Test main index file
            response = client.get('/')
            if response.status_code == 200:
                content = response.get_data(as_text=True)
                if 'Brain Link Tracker' in content:
                    self.log_test("Frontend Index", "PASS", "Main page loads correctly")
                else:
                    self.log_test("Frontend Index", "FAIL", "Main page content incorrect")
            else:
                self.log_test("Frontend Index", "FAIL", f"Main page failed: {response.status_code}", critical=True)
            
            # Test static assets
            response = client.get('/assets/index-Ddf_rYuN.js')
            if response.status_code == 200:
                self.log_test("Static Assets", "PASS", "JavaScript assets accessible")
            else:
                self.log_test("Static Assets", "WARN", "Some static assets may not be accessible")
                
        except Exception as e:
            self.log_test("Frontend Static Files", "FAIL", f"Frontend test error: {str(e)}")
    
    def test_security_features(self):
        """Test security features and configurations"""
        print("\n🔒 Testing Security Features...")
        
        client = app.test_client()
        
        try:
            # Test CORS headers
            response = client.options('/api/auth/status')
            cors_header = response.headers.get('Access-Control-Allow-Origin')
            if cors_header:
                self.log_test("CORS Configuration", "PASS", "CORS headers present")
            else:
                self.log_test("CORS Configuration", "WARN", "CORS headers not found")
            
            # Test security headers
            response = client.get('/')
            if response.headers.get('X-Content-Type-Options'):
                self.log_test("Security Headers", "PASS", "Security headers present")
            else:
                self.log_test("Security Headers", "WARN", "Additional security headers recommended")
            
            # Test input validation
            response = client.post('/api/auth/login', json={'username': '<script>alert("xss")</script>'})
            if response.status_code in [400, 401]:
                self.log_test("Input Validation", "PASS", "Input validation working")
            else:
                self.log_test("Input Validation", "WARN", "Input validation may need improvement")
                
        except Exception as e:
            self.log_test("Security Features", "FAIL", f"Security test error: {str(e)}")
    
    def test_performance_basics(self):
        """Test basic performance characteristics"""
        print("\n⚡ Testing Performance...")
        
        client = app.test_client()
        
        try:
            # Test response times
            start_time = time.time()
            response = client.get('/api/link-stats')
            response_time = time.time() - start_time
            
            if response_time < 2.0:
                self.log_test("API Response Time", "PASS", f"Response time: {response_time:.2f}s")
            elif response_time < 5.0:
                self.log_test("API Response Time", "WARN", f"Slow response time: {response_time:.2f}s")
            else:
                self.log_test("API Response Time", "FAIL", f"Very slow response: {response_time:.2f}s")
            
            # Test concurrent requests
            import threading
            results = []
            
            def make_request():
                try:
                    resp = client.get('/api/auth/status')
                    results.append(resp.status_code)
                except:
                    results.append(500)
            
            threads = []
            for i in range(10):
                t = threading.Thread(target=make_request)
                threads.append(t)
                t.start()
            
            for t in threads:
                t.join()
            
            success_rate = len([r for r in results if r == 200]) / len(results)
            if success_rate >= 0.9:
                self.log_test("Concurrent Requests", "PASS", f"Success rate: {success_rate:.1%}")
            else:
                self.log_test("Concurrent Requests", "FAIL", f"Low success rate: {success_rate:.1%}")
                
        except Exception as e:
            self.log_test("Performance Testing", "FAIL", f"Performance test error: {str(e)}")
    
    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*60)
        print("🎯 PRODUCTION READINESS REPORT")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.test_results if r['status'] == 'FAIL'])
        warning_tests = len([r for r in self.test_results if r['status'] == 'WARN'])
        
        print(f"\n📊 Test Summary:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests} ✅")
        print(f"   Failed: {failed_tests} ❌")
        print(f"   Warnings: {warning_tests} ⚠️")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"   Success Rate: {success_rate:.1f}%")
        
        if self.critical_failures:
            print(f"\n🚨 CRITICAL FAILURES ({len(self.critical_failures)}):")
            for failure in self.critical_failures:
                print(f"   ❌ {failure['test']}: {failure['message']}")
            print("\n⚠️  PRODUCTION LAUNCH NOT RECOMMENDED - CRITICAL ISSUES FOUND")
        elif failed_tests > 0:
            print(f"\n⚠️  PRODUCTION LAUNCH WITH CAUTION - {failed_tests} NON-CRITICAL ISSUES")
        else:
            print(f"\n🎉 PRODUCTION READY - ALL TESTS PASSED!")
        
        # Save detailed report
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_tests': total_tests,
                'passed': passed_tests,
                'failed': failed_tests,
                'warnings': warning_tests,
                'success_rate': success_rate,
                'critical_failures': len(self.critical_failures)
            },
            'test_results': self.test_results,
            'critical_failures': self.critical_failures
        }
        
        with open('production_test_report.json', 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: production_test_report.json")
        
        return len(self.critical_failures) == 0 and failed_tests == 0

def main():
    """Run comprehensive production test suite"""
    print("🚀 Brain Link Tracker - Production Test Suite")
    print("=" * 60)
    
    test_suite = ProductionTestSuite()
    
    # Run all tests
    test_suite.test_environment_variables()
    test_suite.test_database_connection()
    test_suite.test_flask_application_startup()
    test_suite.test_api_endpoints()
    test_suite.test_tracking_functionality()
    test_suite.test_frontend_static_files()
    test_suite.test_security_features()
    test_suite.test_performance_basics()
    
    # Generate final report
    production_ready = test_suite.generate_report()
    
    return 0 if production_ready else 1

if __name__ == "__main__":
    exit(main())

