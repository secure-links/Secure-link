import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.events) {
          setEvents(data.events);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
    setIsLoading(false);
  };

  const filterEvents = () => {
    let filtered = events;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.tracking_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.ip_address?.includes(searchTerm) ||
        event.captured_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.city?.toLowerCase().includes(searchTerm.toLowerCase())
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
          case 'captured':
            return event.captured_email;
          default:
            return true;
        }
      });
    }

    setFilteredEvents(filtered);
  };

  const exportData = () => {
    const csvContent = [
      ['Timestamp', 'Tracking ID', 'Captured Email', 'IP Address', 'Country', 'City', 'ISP', 'Status'].join(','),
      ...filteredEvents.map(event => [
        event.timestamp,
        event.tracking_id,
        event.captured_email || '',
        event.ip_address,
        event.country,
        event.city,
        event.isp,
        event.status
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'blocked':
        return 'text-red-400 bg-red-900/20';
      case 'processed':
        return 'text-green-400 bg-green-900/20';
      case 'redirected':
        return 'text-blue-400 bg-blue-900/20';
      default:
        return 'text-yellow-400 bg-yellow-900/20';
    }
  };

  const getDetailedStatus = (event) => {
    if (event.status === 'blocked') {
      return 'Blocked';
    } else if (event.on_page) {
      return 'On Page';
    } else if (event.redirected) {
      return 'Redirected';
    } else if (event.email_opened) {
      return 'Opened';
    } else {
      return 'Active';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Live Activity</h2>
          <p className="text-slate-400 mt-1">Real-time tracking events and user interactions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`border-slate-600 ${autoRefresh ? 'text-green-400' : 'text-slate-300'} hover:bg-slate-700`}
          >
            <Activity className="w-4 h-4 mr-2" />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            disabled={isLoading}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Events</p>
                <p className="text-2xl font-bold text-white mt-1">{events.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Email Opens</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {events.filter(e => e.email_opened).length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <Mail className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Redirects</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {events.filter(e => e.redirected).length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Globe className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Data Captured</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {events.filter(e => e.captured_email).length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/20">
                <Shield className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by tracking ID, email, IP, country, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="opened">Email Opened</SelectItem>
                  <SelectItem value="redirected">Redirected</SelectItem>
                  <SelectItem value="on_page">On Page</SelectItem>
                  <SelectItem value="captured">Data Captured</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription className="text-slate-400">
            Showing {filteredEvents.length} of {events.length} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Timestamp</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Tracking ID</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">IP Address</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Location</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Captured Email</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      {isLoading ? 'Loading events...' : 'No events found'}
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-slate-400" />
                          {formatTimestamp(event.timestamp)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                          {event.tracking_id}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-sm">
                        {event.ip_address}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                          {event.city}, {event.country}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(event.status)}>
                          {getDetailedStatus(event)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {event.captured_email ? (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-green-400" />
                            {event.captured_email}
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveActivity;

