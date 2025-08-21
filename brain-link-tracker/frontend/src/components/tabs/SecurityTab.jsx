import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Shield, 
  AlertTriangle, 
  Ban, 
  Eye, 
  Globe,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react'

export default function SecurityTab() {
  const [securityData, setSecurityData] = useState(null)
  const [settings, setSettings] = useState({
    bot_detection: true,
    proxy_blocking: true,
    vpn_blocking: false,
    geo_blocking: false,
    rate_limiting: true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSecurityData()
    fetchSecuritySettings()
  }, [])

  const fetchSecurityData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/security/overview', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setSecurityData(data)
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSecuritySettings = async () => {
    try {
      const response = await fetch('/api/security/settings', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch security settings:', error)
    }
  }

  const updateSetting = async (key, value) => {
    try {
      const response = await fetch('/api/security/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ [key]: value }),
      })
      
      if (response.ok) {
        setSettings(prev => ({ ...prev, [key]: value }))
      }
    } catch (error) {
      console.error('Failed to update setting:', error)
    }
  }

  const getThreatLevel = (score) => {
    if (score >= 80) return { level: 'High', color: 'text-red-500', bg: 'bg-red-100' }
    if (score >= 50) return { level: 'Medium', color: 'text-orange-500', bg: 'bg-orange-100' }
    return { level: 'Low', color: 'text-green-500', bg: 'bg-green-100' }
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Security</h1>
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
            <Shield className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
            Security
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Monitor and protect against threats</p>
        </div>
        
        <Button variant="outline" size="sm" onClick={fetchSecurityData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Threats Blocked</p>
                <p className="text-lg md:text-2xl font-bold">{securityData?.threats_blocked || 0}</p>
              </div>
              <Shield className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Bot Attempts</p>
                <p className="text-lg md:text-2xl font-bold">{securityData?.bot_attempts || 0}</p>
              </div>
              <Ban className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Proxy/VPN</p>
                <p className="text-lg md:text-2xl font-bold">{securityData?.proxy_attempts || 0}</p>
              </div>
              <Globe className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Suspicious IPs</p>
                <p className="text-lg md:text-2xl font-bold">{securityData?.suspicious_ips || 0}</p>
              </div>
              <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Configure protection mechanisms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label htmlFor="bot-detection" className="text-sm md:text-base font-medium">Bot Detection</Label>
                <p className="text-xs md:text-sm text-muted-foreground">Automatically detect and block bot traffic</p>
              </div>
              <Switch
                id="bot-detection"
                checked={settings.bot_detection}
                onCheckedChange={(checked) => updateSetting('bot_detection', checked)}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label htmlFor="proxy-blocking" className="text-sm md:text-base font-medium">Proxy Blocking</Label>
                <p className="text-xs md:text-sm text-muted-foreground">Block traffic from known proxy servers</p>
              </div>
              <Switch
                id="proxy-blocking"
                checked={settings.proxy_blocking}
                onCheckedChange={(checked) => updateSetting('proxy_blocking', checked)}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label htmlFor="vpn-blocking" className="text-sm md:text-base font-medium">VPN Blocking</Label>
                <p className="text-xs md:text-sm text-muted-foreground">Block traffic from VPN services</p>
              </div>
              <Switch
                id="vpn-blocking"
                checked={settings.vpn_blocking}
                onCheckedChange={(checked) => updateSetting('vpn_blocking', checked)}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label htmlFor="geo-blocking" className="text-sm md:text-base font-medium">Geographic Blocking</Label>
                <p className="text-xs md:text-sm text-muted-foreground">Block traffic from specific countries</p>
              </div>
              <Switch
                id="geo-blocking"
                checked={settings.geo_blocking}
                onCheckedChange={(checked) => updateSetting('geo_blocking', checked)}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label htmlFor="rate-limiting" className="text-sm md:text-base font-medium">Rate Limiting</Label>
                <p className="text-xs md:text-sm text-muted-foreground">Limit requests per IP address</p>
              </div>
              <Switch
                id="rate-limiting"
                checked={settings.rate_limiting}
                onCheckedChange={(checked) => updateSetting('rate_limiting', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Threats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Recent Security Events</CardTitle>
          <CardDescription className="text-xs md:text-sm">Latest blocked attempts and threats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {securityData?.recent_threats?.length > 0 ? (
              securityData.recent_threats.map((threat, index) => {
                const threatInfo = getThreatLevel(threat.risk_score)
                return (
                  <div key={threat.id || index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-muted/50 rounded-lg gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-full ${threatInfo.bg}`}>
                        <AlertTriangle className={`h-4 w-4 ${threatInfo.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="font-medium text-sm truncate">{threat.ip_address}</span>
                          <Badge variant="outline" className="text-xs w-fit">
                            {threat.threat_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {threat.country_name} • {threat.isp} • {threat.user_agent?.substring(0, 50)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                      <Badge variant="secondary" className={`text-xs ${threatInfo.color}`}>
                        {threatInfo.level} Risk
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(threat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent security events</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Blocked IPs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Blocked IP Addresses</CardTitle>
          <CardDescription className="text-xs md:text-sm">Currently blocked IP addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 md:space-y-3">
            {securityData?.blocked_ips?.length > 0 ? (
              securityData.blocked_ips.slice(0, 10).map((ip, index) => (
                <div key={ip.ip_address} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 md:p-3 border rounded-lg gap-2">
                  <div className="flex items-center gap-2 md:gap-3">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <div>
                      <span className="font-mono text-sm">{ip.ip_address}</span>
                      <p className="text-xs text-muted-foreground">
                        {ip.country_name} • Blocked {ip.block_count} times
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {ip.reason}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Unblock
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No blocked IP addresses</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

