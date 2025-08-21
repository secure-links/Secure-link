import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MousePointer, 
  Shield, 
  Mail,
  Link2,
  Activity,
  RefreshCw,
  Eye,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

export default function OverviewTab() {
  const [overview, setOverview] = useState(null)
  const [trends, setTrends] = useState([])
  const [deviceData, setDeviceData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchOverviewData()
    fetchTrendsData()
    fetchDeviceData()
    fetchRecentActivity()
  }, [timeRange])

  const fetchOverviewData = async () => {
    try {
      const response = await fetch('/api/analytics/overview', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setOverview(data)
      }
    } catch (error) {
      console.error('Failed to fetch overview:', error)
    }
  }

  const fetchTrendsData = async () => {
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const response = await fetch(`/api/analytics/trends?days=${days}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setTrends(data)
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error)
    }
  }

  const fetchDeviceData = async () => {
    try {
      const response = await fetch('/api/analytics/devices', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setDeviceData(data.devices || [])
      }
    } catch (error) {
      console.error('Failed to fetch device data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/events/live?limit=10', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setRecentActivity(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
    }
  }

  const refreshData = () => {
    setLoading(true)
    fetchOverviewData()
    fetchTrendsData()
    fetchDeviceData()
    fetchRecentActivity()
  }

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />
      case 'tablet': return <Tablet className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Open': { variant: 'default', className: 'status-open' },
      'Redirected': { variant: 'secondary', className: 'status-redirected' },
      'On Page': { variant: 'outline', className: 'status-on-page' }
    }
    
    const config = statusConfig[status] || statusConfig['Open']
    return (
      <Badge variant={config.variant} className={`${config.className} text-xs`}>
        {status}
      </Badge>
    )
  }

  const deviceColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00']

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Analytics Overview</h1>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 md:p-6">
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
            <Activity className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            Analytics Overview
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Comprehensive tracking and performance metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-1">
            {['7d', '30d', '90d'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="text-xs px-2 md:px-3"
              >
                {range}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="metric-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Links</p>
                <p className="text-xl md:text-2xl font-bold">{overview?.total_links || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                  <span className="text-xs text-green-500">+12% from last period</span>
                </div>
              </div>
              <Link2 className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-xl md:text-2xl font-bold">{overview?.total_clicks?.toLocaleString() || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                  <span className="text-xs text-green-500">+{overview?.clicks_change_percent || 0}%</span>
                </div>
              </div>
              <MousePointer className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Real Visitors</p>
                <p className="text-xl md:text-2xl font-bold">{overview?.real_visitors?.toLocaleString() || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                  <span className="text-xs text-green-500">+15.2% from last period</span>
                </div>
              </div>
              <Users className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Captured Data</p>
                <p className="text-xl md:text-2xl font-bold">{overview?.captured_emails || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                  <span className="text-xs text-red-500">-2.1% from last period</span>
                </div>
              </div>
              <Mail className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Clicks Over Time */}
        <Card className="chart-container">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Clicks Over Time</CardTitle>
            <CardDescription className="text-xs md:text-sm">Daily clicks and unique visitors trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total_clicks" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Total Clicks"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="unique_visitors" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Unique Visitors"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card className="chart-container">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Device Breakdown</CardTitle>
            <CardDescription className="text-xs md:text-sm">Traffic distribution by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={deviceColors[index % deviceColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Recent Activity</CardTitle>
          <CardDescription className="text-xs md:text-sm">Latest tracking events and interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((event, index) => (
                <div key={event.id || index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-muted/50 rounded-lg gap-2">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    {getDeviceIcon(event.device_type)}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-medium text-sm truncate">
                          {event.captured_email || event.ip_address}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {event.country_name} • {event.city}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {event.link_title || event.link_short_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    {getStatusBadge(event.status)}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

