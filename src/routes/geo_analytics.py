from flask import Blueprint, jsonify, request
from src.models.tracking_event import TrackingEvent
from src.models.link import Link
from sqlalchemy import func, distinct
from collections import defaultdict

geo_analytics_bp = Blueprint('geo_analytics', __name__)

@geo_analytics_bp.route('/api/geo-analytics', methods=['GET'])
def get_geo_analytics():
    """Get geographic analytics data"""
    try:
        # Get all tracking events with geographic data
        events = TrackingEvent.query.filter(
            TrackingEvent.country.isnot(None),
            TrackingEvent.city.isnot(None)
        ).all()
        
        # Process country data
        country_data = defaultdict(lambda: {
            'country': '',
            'country_code': '',
            'total_visits': 0,
            'unique_visits': 0,
            'captured_emails': 0,
            'conversion_rate': 0.0,
            'ip_addresses': set()
        })
        
        # Process city data
        city_data = defaultdict(lambda: {
            'city': '',
            'country': '',
            'unique_visits': 0,
            'ip_addresses': set()
        })
        
        for event in events:
            country_key = event.country
            city_key = f"{event.city}, {event.country}"
            
            # Update country data
            country_info = country_data[country_key]
            country_info['country'] = event.country
            country_info['country_code'] = event.country_code or ''
            country_info['total_visits'] += 1
            country_info['ip_addresses'].add(event.ip_address)
            
            if event.captured_email:
                country_info['captured_emails'] += 1
            
            # Update city data
            city_info = city_data[city_key]
            city_info['city'] = event.city
            city_info['country'] = event.country
            city_info['ip_addresses'].add(event.ip_address)
        
        # Convert to final format
        countries = []
        for country_key, data in country_data.items():
            data['unique_visits'] = len(data['ip_addresses'])
            data['conversion_rate'] = (data['captured_emails'] / data['total_visits'] * 100) if data['total_visits'] > 0 else 0
            # Remove ip_addresses set before returning
            del data['ip_addresses']
            countries.append(data)
        
        cities = []
        for city_key, data in city_data.items():
            data['unique_visits'] = len(data['ip_addresses'])
            # Remove ip_addresses set before returning
            del data['ip_addresses']
            cities.append(data)
        
        # Sort by total visits
        countries.sort(key=lambda x: x['total_visits'], reverse=True)
        cities.sort(key=lambda x: x['unique_visits'], reverse=True)
        
        return jsonify({"success": True, 
            'success': True,
            'countries': countries,
            'cities': cities,
            'total_countries': len(countries),
            'total_cities': len(cities)
        })
        
    except Exception as e:
        print(f"Geo analytics error: {e}")
        return jsonify({"success": True, 
            'success': False,
            'error': str(e),
            'countries': [],
            'cities': [],
            'total_countries': 0,
            'total_cities': 0
        }), 500

@geo_analytics_bp.route('/api/geo-analytics/map-data', methods=['GET'])
def get_map_data():
    """Get data specifically formatted for map visualization"""
    try:
        # Get events with coordinates
        events = TrackingEvent.query.filter(
            TrackingEvent.latitude.isnot(None),
            TrackingEvent.longitude.isnot(None),
            TrackingEvent.country.isnot(None)
        ).all()
        
        # Group by country for map coloring
        country_stats = defaultdict(lambda: {
            'country': '',
            'country_code': '',
            'visits': 0,
            'unique_ips': set(),
            'coordinates': []
        })
        
        for event in events:
            country_key = event.country
            stats = country_stats[country_key]
            stats['country'] = event.country
            stats['country_code'] = event.country_code or ''
            stats['visits'] += 1
            stats['unique_ips'].add(event.ip_address)
            
            # Add coordinates for markers
            if event.latitude and event.longitude:
                stats['coordinates'].append({
                    'lat': float(event.latitude),
                    'lng': float(event.longitude),
                    'city': event.city,
                    'visits': 1  # This would be aggregated in a real implementation
                })
        
        # Convert to final format
        map_data = []
        for country_key, stats in country_stats.items():
            # Aggregate coordinates by city
            city_coords = defaultdict(lambda: {'lat': 0, 'lng': 0, 'visits': 0, 'city': ''})
            for coord in stats['coordinates']:
                city_key = coord['city']
                city_coords[city_key]['lat'] = coord['lat']
                city_coords[city_key]['lng'] = coord['lng']
                city_coords[city_key]['city'] = coord['city']
                city_coords[city_key]['visits'] += coord['visits']
            
            map_data.append({
                'country': stats['country'],
                'country_code': stats['country_code'],
                'visits': stats['visits'],
                'unique_visitors': len(stats['unique_ips']),
                'markers': list(city_coords.values())
            })
        
        return jsonify({"success": True, 
            'success': True,
            'map_data': map_data
        })
        
    except Exception as e:
        print(f"Map data error: {e}")
        return jsonify({"success": True, 
            'success': False,
            'error': str(e),
            'map_data': []
        }), 500

