import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Activity, 
  Users, 
  Eye, 
  ExternalLink, 
  Mail,
  RefreshCw,
  Search,
  Filter,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  MapPin
} from 'lucide-react'

export default function LiveActivityTab() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchLiveEvents()
    
    let interval
    if (autoRefresh) {
      interval = setInterval(fetchLiveEvents, 5000) // Refresh every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchLiveEvents = async () => {
    try {
      const response = await fetch('/api/events/live?limit=50', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch live events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4 text-blue-500" />
      case 'tablet': return <Tablet className="h-4 w-4 text-green-500" />
      default: return <Monitor className="h-4 w-4 text-purple-500" />
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Opened': return <Eye className="h-4 w-4 text-blue-500" />
      case 'Redirected': return <ExternalLink className="h-4 w-4 text-green-500" />
      case 'On Page': return <Activity className="h-4 w-4 text-orange-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Opened': { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      'Redirected': { variant: 'secondary', className: 'bg-green-100 text-green-800' },
      'On Page': { variant: 'outline', className: 'bg-orange-100 text-orange-800' }
    }
    
    const config = statusConfig[status] || statusConfig['Opened']
    return (
      <Badge variant={config.variant} className={`${config.className} text-xs`}>
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    )
  }

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return '🌍'
    return `https://flagcdn.com/16x12/${countryCode.toLowerCase()}.png`
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.captured_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.country_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.city?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter
    const matchesCountry = countryFilter === 'all' || event.country_code === countryFilter
    
    return matchesSearch && matchesStatus && matchesCountry
  })

  const uniqueCountries = [...new Set(events.map(e => e.country_code).filter(Boolean))]

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Live Activity</h1>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 md:h-8 md:w-8 text-emerald-500" />
            Live Activity
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Monitor live events in real time</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLiveEvents}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Active Now</p>
                <p className="text-lg md:text-2xl font-bold">
                  {events.filter(e => new Date() - new Date(e.timestamp) < 300000).length}
                </p>
              </div>
              <Users className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Events</p>
                <p className="text-lg md:text-2xl font-bold">{events.length}</p>
              </div>
              <Activity className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Emails Captured</p>
                <p className="text-lg md:text-2xl font-bold">
                  {events.filter(e => e.captured_email).length}
                </p>
              </div>
              <Mail className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Countries</p>
                <p className="text-lg md:text-2xl font-bold">{uniqueCountries.length}</p>
              </div>
              <Globe className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, IP, country, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Opened">Opened</SelectItem>
            <SelectItem value="Redirected">Redirected</SelectItem>
            <SelectItem value="On Page">On Page</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {uniqueCountries.map((code) => {
              const event = events.find(e => e.country_code === code)
              return (
                <SelectItem key={code} value={code}>
                  <div className="flex items-center gap-2">
                    <img 
                      src={getCountryFlag(code)} 
                      alt={`${event?.country_name} flag`}
                      className="w-4 h-3 rounded"
                    />
                    {event?.country_name}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Recent Activity</CardTitle>
          <CardDescription className="text-xs md:text-sm flex items-center gap-2">
            Real-time tracking events and user interactions
            <Badge variant="secondary" className="text-xs">
              {filteredEvents.length} events
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 text-xs font-medium text-muted-foreground">Timestamp</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground">Tracking ID</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground">Email Captured</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground">IP Address</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground">Country</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground">City</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground">Zip Code</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground">ISP</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground">Device Type</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground">User Agent</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event, index) => {
                    const isRecent = new Date() - new Date(event.timestamp) < 60000 // Less than 1 minute
                    const isActive = new Date() - new Date(event.timestamp) < 30000 // Less than 30 seconds
                    return (
                      <tr 
                        key={event.id || index} 
                        className={`border-b transition-all duration-300 ${
                          isRecent ? 'bg-green-50/50' : ''
                        }`}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
                            <span className="text-sm">
                              {new Date(event.timestamp).toLocaleDateString('en-US', { 
                                month: 'numeric', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}, {new Date(event.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {event.link_short_code || event.link_id || 'N/A'}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {event.captured_email ? (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-purple-500" />
                              <span className="text-sm">{event.captured_email}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">None</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-sm">{event.ip_address}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <img 
                              src={getCountryFlag(event.country_code)} 
                              alt={`${event.country} flag`}
                              className="w-4 h-3 rounded"
                            />
                            <span className="text-sm font-medium">{event.country || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="text-sm">{event.city || 'Unknown'}</span>
                        </td>
                        <td className="py-3">
                          <span className="text-sm">{event.zip_code || event.postal_code || 'N/A'}</span>
                        </td>
                        <td className="py-3">
                          <span className="text-sm">{event.isp || event.org || 'Unknown'}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(event.device_type)}
                            <span className="text-sm capitalize">{event.device_type || 'Desktop'}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="text-xs text-muted-foreground truncate max-w-32" title={event.user_agent}>
                            {event.user_agent ? `${event.browser || 'Unknown'} (${event.os || 'Unknown'})` : 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {isActive && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                event.status === 'redirected' ? 'bg-green-100 text-green-800' :
                                event.status === 'blocked' ? 'bg-red-100 text-red-800' :
                                event.status === 'opened' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {event.status === 'redirected' ? 'Redirected' :
                               event.status === 'blocked' ? 'Blocked' :
                               event.status === 'opened' ? 'Opened' :
                               isActive ? 'On Page' : 'Active'}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 md:py-12 text-muted-foreground">
              <Activity className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">No live activity</h3>
              <p className="text-sm md:text-base">
                {searchTerm || statusFilter !== 'all' || countryFilter !== 'all' 
                  ? 'No events match your current filters.' 
                  : 'Waiting for new tracking events...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

