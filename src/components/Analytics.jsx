import React, { useState, useEffect } from 'react'
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

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('7d')
  const [analytics, setAnalytics] = useState({
    overview: {
      totalLinks: 0,
      totalClicks: 0,
      realVisitors: 0,
      capturedData: 0
    },
    clicksOverTime: [],
    topCountries: [],
    deviceTypes: [],
    browserStats: [],
    conversionFunnel: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch link stats
      const linkStatsResponse = await fetch('/api/link-stats')
      const linkStats = await linkStatsResponse.json()

      // Fetch geo analytics
      const geoResponse = await fetch('/api/geo-analytics')
      const geoData = await geoResponse.json()

      // Fetch events for additional analytics
      const eventsResponse = await fetch('/api/events')
      const eventsData = await eventsResponse.json()

      if (linkStats && geoData && eventsData) {
        const events = eventsData.events || []
        
        // Process data for charts
        const processedAnalytics = {
          overview: {
            totalLinks: linkStats.total_clicks || 0,
            totalClicks: linkStats.total_clicks || 0,
            realVisitors: linkStats.real_visitors || 0,
            capturedData: events.filter(e => e.captured_email).length
          },
          clicksOverTime: processClicksOverTime(events),
          topCountries: geoData.countries || [],
          deviceTypes: processDeviceTypes(events),
          browserStats: processBrowserStats(events),
          conversionFunnel: processConversionFunnel(events)
        }

        setAnalytics(processedAnalytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Keep default empty state on error
    }
    setLoading(false)
  }

  const processClicksOverTime = (events) => {
    const last7Days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.timestamp).toISOString().split('T')[0]
        return eventDate === dateStr
      })
      
      last7Days.push({
        date: dateStr,
        clicks: dayEvents.length,
        visitors: new Set(dayEvents.map(e => e.ip_address)).size
      })
    }
    
    return last7Days
  }

  const processDeviceTypes = (events) => {
    const deviceCounts = {}
    events.forEach(event => {
      const device = event.device_type || 'Unknown'
      deviceCounts[device] = (deviceCounts[device] || 0) + 1
    })
    
    return Object.entries(deviceCounts).map(([name, value]) => ({ name, value }))
  }

  const processBrowserStats = (events) => {
    const browserCounts = {}
    events.forEach(event => {
      const browser = event.browser || 'Unknown'
      browserCounts[browser] = (browserCounts[browser] || 0) + 1
    })
    
    return Object.entries(browserCounts).map(([name, value]) => ({ name, value }))
  }

  const processConversionFunnel = (events) => {
    const totalEvents = events.length
    const emailOpened = events.filter(e => e.email_opened).length
    const redirected = events.filter(e => e.redirected).length
    const onPage = events.filter(e => e.on_page).length
    const captured = events.filter(e => e.captured_email).length

    return [
      { stage: 'Email Sent', count: totalEvents, percentage: 100 },
      { stage: 'Email Opened', count: emailOpened, percentage: totalEvents ? (emailOpened / totalEvents) * 100 : 0 },
      { stage: 'Link Clicked', count: redirected, percentage: totalEvents ? (redirected / totalEvents) * 100 : 0 },
      { stage: 'Page Visited', count: onPage, percentage: totalEvents ? (onPage / totalEvents) * 100 : 0 },
      { stage: 'Data Captured', count: captured, percentage: totalEvents ? (captured / totalEvents) * 100 : 0 }
    ]
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

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
          title="Total Clicks"
          value={analytics.overview.totalClicks}
          icon={MousePointer}
          change={15.2}
          color="blue"
        />
        <StatCard
          title="Real Visitors"
          value={analytics.overview.realVisitors}
          icon={Users}
          change={8.7}
          color="green"
        />
        <StatCard
          title="Data Captured"
          value={analytics.overview.capturedData}
          icon={Mail}
          change={23.1}
          color="purple"
        />
        <StatCard
          title="Conversion Rate"
          value={analytics.overview.totalClicks > 0 ? 
            ((analytics.overview.capturedData / analytics.overview.totalClicks) * 100).toFixed(1) : 0}
          icon={TrendingUp}
          change={2.3}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks Over Time */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Clicks Over Time</CardTitle>
            <CardDescription className="text-slate-400">Daily click and visitor trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.clicksOverTime}>
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
                <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Top Countries</CardTitle>
            <CardDescription className="text-slate-400">Geographic distribution of clicks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topCountries.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="country" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="total_visits" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Types */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Device Types</CardTitle>
            <CardDescription className="text-slate-400">Distribution by device category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.deviceTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.deviceTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Conversion Funnel</CardTitle>
            <CardDescription className="text-slate-400">User journey progression</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.conversionFunnel} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="stage" type="category" stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Bot Traffic</p>
                <p className="text-2xl font-bold text-white mt-1">47</p>
                <p className="text-red-400 text-sm mt-1">-8.2% blocked</p>
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
                <p className="text-2xl font-bold text-white mt-1">
                  {analytics.overview.totalClicks > 0 ? 
                    ((analytics.overview.capturedData / analytics.overview.totalClicks) * 100).toFixed(1) : 0}%
                </p>
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

export default Analytics

