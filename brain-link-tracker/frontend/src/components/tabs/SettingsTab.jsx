import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Send, 
  Bell, 
  Shield, 
  Globe,
  User,
  Key,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react'

export default function SettingsTab() {
  const [settings, setSettings] = useState({
    // Telegram Settings
    telegram_bot_token: '',
    telegram_chat_id: '',
    telegram_enabled: false,
    telegram_frequency: 'daily',
    telegram_notifications: {
      campaign_summary: true,
      tracking_stats: true,
      captured_emails: true,
      security_alerts: true,
      live_activity: false
    },
    
    // General Settings
    default_redirect_url: '',
    enable_geolocation: true,
    enable_bot_detection: true,
    enable_proxy_detection: true,
    
    // Security Settings
    allowed_countries: [],
    blocked_countries: [],
    rate_limit_per_ip: 100,
    session_timeout: 3600,
    
    // Notification Settings
    email_notifications: true,
    browser_notifications: false,
    
    // API Settings
    api_rate_limit: 1000,
    webhook_url: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingTelegram, setTestingTelegram] = useState(false)
  const [telegramTestResult, setTelegramTestResult] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      })
      
      if (response.ok) {
        // Show success message
        console.log('Settings saved successfully')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const testTelegramIntegration = async () => {
    setTestingTelegram(true)
    setTelegramTestResult(null)
    
    try {
      const response = await fetch('/api/settings/telegram/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          bot_token: settings.telegram_bot_token,
          chat_id: settings.telegram_chat_id
        }),
      })
      
      const result = await response.json()
      setTelegramTestResult(result)
    } catch (error) {
      setTelegramTestResult({ success: false, message: 'Network error' })
    } finally {
      setTestingTelegram(false)
    }
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateNestedSetting = (parent, key, value) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: value
      }
    }))
  }

  const frequencyOptions = [
    { value: '30min', label: 'Every 30 minutes' },
    { value: '1hour', label: 'Every 1 hour' },
    { value: '2hours', label: 'Every 2 hours' },
    { value: '5hours', label: 'Every 5 hours' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ]

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
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
            <Settings className="h-6 w-6 md:h-8 md:w-8 text-gray-500" />
            Settings
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Configure your Brain Link Tracker preferences</p>
        </div>
        
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="telegram" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        {/* Telegram Integration */}
        <TabsContent value="telegram">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Telegram Integration
              </CardTitle>
              <CardDescription>
                Receive automated tracking updates directly in your Telegram bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="telegram-enabled" className="text-base font-medium">Enable Telegram Notifications</Label>
                  <p className="text-sm text-muted-foreground">Turn on to receive updates via Telegram</p>
                </div>
                <Switch
                  id="telegram-enabled"
                  checked={settings.telegram_enabled}
                  onCheckedChange={(checked) => updateSetting('telegram_enabled', checked)}
                />
              </div>

              {settings.telegram_enabled && (
                <>
                  {/* Bot Configuration */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bot-token">Bot Token</Label>
                      <Input
                        id="bot-token"
                        type="password"
                        placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                        value={settings.telegram_bot_token}
                        onChange={(e) => updateSetting('telegram_bot_token', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Get your bot token from @BotFather on Telegram
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="chat-id">Chat ID</Label>
                      <Input
                        id="chat-id"
                        placeholder="123456789"
                        value={settings.telegram_chat_id}
                        onChange={(e) => updateSetting('telegram_chat_id', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your Telegram chat ID where messages will be sent
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="frequency">Update Frequency</Label>
                      <Select 
                        value={settings.telegram_frequency} 
                        onValueChange={(value) => updateSetting('telegram_frequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div>
                    <Label className="text-base font-medium">Notification Types</Label>
                    <p className="text-sm text-muted-foreground mb-4">Choose what updates to receive</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="campaign-summary">Campaign Summary</Label>
                          <p className="text-xs text-muted-foreground">Clicks, visitors, opens, conversions</p>
                        </div>
                        <Switch
                          id="campaign-summary"
                          checked={settings.telegram_notifications.campaign_summary}
                          onCheckedChange={(checked) => updateNestedSetting('telegram_notifications', 'campaign_summary', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="tracking-stats">Tracking Link Stats</Label>
                          <p className="text-xs text-muted-foreground">Performance of individual links</p>
                        </div>
                        <Switch
                          id="tracking-stats"
                          checked={settings.telegram_notifications.tracking_stats}
                          onCheckedChange={(checked) => updateNestedSetting('telegram_notifications', 'tracking_stats', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="captured-emails">Captured Emails & Leads</Label>
                          <p className="text-xs text-muted-foreground">New email captures and lead info</p>
                        </div>
                        <Switch
                          id="captured-emails"
                          checked={settings.telegram_notifications.captured_emails}
                          onCheckedChange={(checked) => updateNestedSetting('telegram_notifications', 'captured_emails', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="security-alerts">Security Alerts</Label>
                          <p className="text-xs text-muted-foreground">Suspicious IPs, bot/proxy traffic</p>
                        </div>
                        <Switch
                          id="security-alerts"
                          checked={settings.telegram_notifications.security_alerts}
                          onCheckedChange={(checked) => updateNestedSetting('telegram_notifications', 'security_alerts', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="live-activity">Live Activity Updates</Label>
                          <p className="text-xs text-muted-foreground">Real-time click notifications</p>
                        </div>
                        <Switch
                          id="live-activity"
                          checked={settings.telegram_notifications.live_activity}
                          onCheckedChange={(checked) => updateNestedSetting('telegram_notifications', 'live_activity', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Test Integration */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label className="text-base font-medium">Test Integration</Label>
                        <p className="text-sm text-muted-foreground">Send a test message to verify setup</p>
                      </div>
                      <Button 
                        onClick={testTelegramIntegration} 
                        disabled={testingTelegram || !settings.telegram_bot_token || !settings.telegram_chat_id}
                        variant="outline"
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        {testingTelegram ? 'Testing...' : 'Send Test'}
                      </Button>
                    </div>

                    {telegramTestResult && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg ${
                        telegramTestResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                      }`}>
                        {telegramTestResult.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span className="text-sm">{telegramTestResult.message}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Basic configuration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="default-redirect">Default Redirect URL</Label>
                <Input
                  id="default-redirect"
                  placeholder="https://example.com"
                  value={settings.default_redirect_url}
                  onChange={(e) => updateSetting('default_redirect_url', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fallback URL when no specific redirect is set
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-geolocation">Enable Geolocation Tracking</Label>
                  <p className="text-sm text-muted-foreground">Track visitor location data</p>
                </div>
                <Switch
                  id="enable-geolocation"
                  checked={settings.enable_geolocation}
                  onCheckedChange={(checked) => updateSetting('enable_geolocation', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-bot-detection">Bot Detection</Label>
                  <p className="text-sm text-muted-foreground">Automatically detect and filter bot traffic</p>
                </div>
                <Switch
                  id="enable-bot-detection"
                  checked={settings.enable_bot_detection}
                  onCheckedChange={(checked) => updateSetting('enable_bot_detection', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-proxy-detection">Proxy Detection</Label>
                  <p className="text-sm text-muted-foreground">Detect and block proxy/VPN traffic</p>
                </div>
                <Switch
                  id="enable-proxy-detection"
                  checked={settings.enable_proxy_detection}
                  onCheckedChange={(checked) => updateSetting('enable_proxy_detection', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="rate-limit">Rate Limit per IP (per hour)</Label>
                <Input
                  id="rate-limit"
                  type="number"
                  value={settings.rate_limit_per_ip}
                  onChange={(e) => updateSetting('rate_limit_per_ip', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum requests per IP address per hour
                </p>
              </div>

              <div>
                <Label htmlFor="session-timeout">Session Timeout (seconds)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={settings.session_timeout}
                  onChange={(e) => updateSetting('session_timeout', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How long before user sessions expire
                </p>
              </div>

              <div>
                <Label htmlFor="allowed-countries">Allowed Countries (comma-separated country codes)</Label>
                <Textarea
                  id="allowed-countries"
                  placeholder="US,GB,CA,AU"
                  value={settings.allowed_countries.join(',')}
                  onChange={(e) => updateSetting('allowed_countries', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to allow all countries
                </p>
              </div>

              <div>
                <Label htmlFor="blocked-countries">Blocked Countries (comma-separated country codes)</Label>
                <Textarea
                  id="blocked-countries"
                  placeholder="CN,RU"
                  value={settings.blocked_countries.join(',')}
                  onChange={(e) => updateSetting('blocked_countries', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Countries to block from accessing links
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="browser-notifications">Browser Notifications</Label>
                  <p className="text-sm text-muted-foreground">Show desktop notifications</p>
                </div>
                <Switch
                  id="browser-notifications"
                  checked={settings.browser_notifications}
                  onCheckedChange={(checked) => updateSetting('browser_notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Settings
              </CardTitle>
              <CardDescription>Configure API access and webhooks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="api-rate-limit">API Rate Limit (requests per hour)</Label>
                <Input
                  id="api-rate-limit"
                  type="number"
                  value={settings.api_rate_limit}
                  onChange={(e) => updateSetting('api_rate_limit', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum API requests per hour
                </p>
              </div>

              <div>
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://your-server.com/webhook"
                  value={settings.webhook_url}
                  onChange={(e) => updateSetting('webhook_url', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL to receive real-time event notifications
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

