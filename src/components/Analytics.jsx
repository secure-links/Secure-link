import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Shield, 
  Globe,
  MousePointer,
  Eye,
  Bot,
  Mail,
  Clock,
  Activity
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export function Analytics() {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalLinks: 0,
      totalClicks: 0,
      realVisitors: 0,
      capturedData: 0
    },
    clicksOverTime: [],
    deviceBreakdown: [],
    topCountries: [],
    hourlyActivity: []
  })
  const [loading, setLoading] = useState(false)
  const [timeframe, setTimeframe] = useState('7d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch link stats
      const linkStatsResponse = await fetch('/api/link-stats')
      const linkStats = await linkStatsResponse.json()
      
      // Fetch geo analytics for country data
      const geoResponse = await fetch('/api/geo-analytics')
      const geoData = await geoResponse.json()
      
      // Fetch live activity for device breakdown and hourly activity
      const activityResponse = await fetch('/api/live-activity?limit=1000')
      const activityData = await activityResponse.json()
      
      if (linkStats && geoData.success && activityData.success) {
        // Calculate captured data from activity events
        const capturedEmails = activityData.events?.filter(e => e.captured_email).length || 0
        
        // Process the data
        const processedAnalytics = {
          overview: {
            totalLinks: 0, // This would need a separate endpoint
            totalClicks: linkStats.total_clicks || 0,
            realVisitors: linkStats.real_visitors || 0,
            capturedData: capturedEmails
          },
          clicksOverTime: generateClicksOverTime(activityData.events || []),
          deviceBreakdown: generateDeviceBreakdown(activityData.events || []),
          topCountries: (geoData.countries || []).map(country => ({
            country: country.country,
            clicks: country.total_visits,
            percentage: country.total_visits > 0 ? ((country.total_visits / linkStats.total_clicks) * 100).toFixed(1) : 0
          })),
          hourlyActivity: generateHourlyActivity(activityData.events || [])
        }
        
        setAnalytics(processedAnalytics)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateClicksOverTime = (events) => {
    const last7Days = []
    const now = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.timestamp).toISOString().split('T')[0]
        return eventDate === dateStr
      })
      
      last7Days.push({
        date: dateStr,
        clicks: dayEvents.filter(e => e.redirected).length,
        visitors: new Set(dayEvents.map(e => e.ip_address)).size
      })
    }
    
    return last7Days
  }

  const generateDeviceBreakdown = (events) => {
    const deviceCounts = {}
    events.forEach(event => {
      const device = event.device_type || 'Unknown'
      deviceCounts[device] = (deviceCounts[device] || 0) + 1
    })
    
    const colors = { Desktop: '#3b82f6', Mobile: '#8b5cf6', Tablet: '#06b6d4', Unknown: '#6b7280' }
    
    return Object.entries(deviceCounts).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || '#6b7280'
    }))
  }

  const generateHourlyActivity = (events) => {
    const hourCounts = {}
    for (let i = 0; i < 24; i++) {
      hourCounts[i.toString().padStart(2, '0')] = 0
    }
    
    events.forEach(event => {
      if (event.redirected) {
        const hour = new Date(event.timestamp).getHours().toString().padStart(2, '0')
        hourCounts[hour]++
      }
    })
    
    return Object.entries(hourCounts).map(([hour, clicks]) => ({ hour, clicks }))
  }

  const StatCard = ({ title, value, icon: Icon, change, color = "blue" }) => (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value.toLocaleString()}</p>
            {change && (
              <p className={`text-sm mt-1 ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change > 0 ? '+' : ''}{change}% from last period
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-${color}-500/20`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Analytics Overview</h2>
          <p className="text-slate-400 mt-1">Comprehensive tracking and performance metrics</p>
        </div>
        <div className="flex space-x-2">
          {['24h', '7d', '30d', '90d'].map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(period)}
              className={timeframe === period ? 
                "bg-blue-600 hover:bg-blue-700" : 
                "border-slate-600 text-slate-300 hover:bg-slate-700"
              }
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Links"
          value={analytics.overview.totalLinks}
          icon={BarChart3}
          change={12}
          color="blue"
        />
        <StatCard
          title="Total Clicks"
          value={analytics.overview.totalClicks}
          icon={MousePointer}
          change={8.5}
          color="green"
        />
        <StatCard
          title="Real Visitors"
          value={analytics.overview.realVisitors}
          icon={Users}
          change={15.2}
          color="purple"
        />
        <StatCard
          title="Captured Data"
          value={analytics.overview.capturedData}
          icon={Mail}
          change={-2.1}
          color="orange"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks Over Time */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
              Clicks Over Time
            </CardTitle>
            <CardDescription className="text-slate-400">
              Daily clicks and unique visitors trend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.clicksOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Total Clicks"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stackId="2"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  name="Unique Visitors"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-400" />
              Device Breakdown
            </CardTitle>
            <CardDescription className="text-slate-400">
              Traffic distribution by device type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Globe className="w-5 h-5 mr-2 text-green-400" />
              Top Countries
            </CardTitle>
            <CardDescription className="text-slate-400">
              Geographic distribution of traffic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCountries.map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400 text-sm w-4">#{index + 1}</span>
                    <span className="text-white font-medium">{country.country}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full" 
                        style={{ width: `${country.percentage}%` }}
                      />
                    </div>
                    <span className="text-slate-300 text-sm w-12 text-right">
                      {country.clicks}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-400" />
              Hourly Activity
            </CardTitle>
            <CardDescription className="text-slate-400">
              Click distribution throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="clicks" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Bot Blocks</p>
                <p className="text-2xl font-bold text-white mt-1">234</p>
                <p className="text-green-400 text-sm mt-1">+18.7% blocked</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/20">
                <Bot className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Conversion Rate</p>
                <p className="text-2xl font-bold text-white mt-1">12.5%</p>
                <p className="text-green-400 text-sm mt-1">+2.3% improvement</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Avg. Session</p>
                <p className="text-2xl font-bold text-white mt-1">2m 34s</p>
                <p className="text-blue-400 text-sm mt-1">+12s increase</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Eye className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

