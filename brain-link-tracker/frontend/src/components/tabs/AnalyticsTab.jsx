import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MousePointer, 
  Shield, 
  Mail,
  RefreshCw,
  Download,
  Calendar
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

export default function AnalyticsTab() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('clicks')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const response = await fetch(`/api/analytics/advanced?days=${days}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00']

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Advanced Analytics</h1>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 md:p-6">
                <div className="h-32 bg-muted rounded"></div>
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
            <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            Advanced Analytics
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Links</p>
                <p className="text-lg md:text-2xl font-bold">{analytics?.total_links || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                  <span className="text-xs text-green-500">+12%</span>
                </div>
              </div>
              <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-lg md:text-2xl font-bold">{analytics?.total_clicks?.toLocaleString() || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                  <span className="text-xs text-green-500">+8.5%</span>
                </div>
              </div>
              <MousePointer className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Real Visitors</p>
                <p className="text-lg md:text-2xl font-bold">{analytics?.real_visitors?.toLocaleString() || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                  <span className="text-xs text-green-500">+15.2%</span>
                </div>
              </div>
              <Users className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Captured Data</p>
                <p className="text-lg md:text-2xl font-bold">{analytics?.captured_emails || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                  <span className="text-xs text-red-500">-2.1%</span>
                </div>
              </div>
              <Mail className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Clicks Over Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Clicks Over Time</CardTitle>
            <CardDescription className="text-xs md:text-sm">Daily clicks and unique visitors trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.daily_trends || []}>
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
                  <Area 
                    type="monotone" 
                    dataKey="total_clicks" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Total Clicks"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="unique_visitors" 
                    stackId="2"
                    stroke="#82ca9d" 
                    fill="#82ca9d"
                    fillOpacity={0.6}
                    name="Unique Visitors"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Device Breakdown</CardTitle>
            <CardDescription className="text-xs md:text-sm">Traffic distribution by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.device_breakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(analytics?.device_breakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Hourly Activity</CardTitle>
          <CardDescription className="text-xs md:text-sm">Click distribution throughout the day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.hourly_activity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}:00`}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => `${value}:00`}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="clicks" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Top Countries</CardTitle>
            <CardDescription className="text-xs md:text-sm">Geographic distribution of traffic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analytics?.top_countries || []).slice(0, 10).map((country, index) => (
                <div key={country.country_code} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{index + 1}</span>
                    <img 
                      src={`https://flagcdn.com/24x18/${country.country_code.toLowerCase()}.png`}
                      alt={`${country.country_name} flag`}
                      className="w-6 h-4 rounded"
                    />
                    <span className="text-sm font-medium">{country.country_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{country.clicks}</span>
                    <Badge variant="secondary" className="text-xs">
                      {country.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Browser Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Browser Distribution</CardTitle>
            <CardDescription className="text-xs md:text-sm">Most popular browsers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analytics?.browser_stats || []).slice(0, 10).map((browser, index) => (
                <div key={browser.browser} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{index + 1}</span>
                    <span className="text-sm font-medium">{browser.browser}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{browser.count}</span>
                    <Badge variant="secondary" className="text-xs">
                      {browser.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Performance Metrics</CardTitle>
          <CardDescription className="text-xs md:text-sm">Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-lg md:text-2xl font-bold text-green-500">
                {analytics?.conversion_rate || 0}%
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">Conversion Rate</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-lg md:text-2xl font-bold text-blue-500">
                {analytics?.avg_session_duration || 0}s
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">Avg Session</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-lg md:text-2xl font-bold text-purple-500">
                {analytics?.bounce_rate || 0}%
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">Bounce Rate</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-lg md:text-2xl font-bold text-orange-500">
                {analytics?.return_visitor_rate || 0}%
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">Return Visitors</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

