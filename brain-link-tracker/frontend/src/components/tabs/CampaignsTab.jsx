import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Settings, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  BarChart3,
  TrendingUp,
  Users,
  MousePointer,
  Mail,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Download
} from 'lucide-react'

export default function CampaignsTab() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [expandedCampaign, setExpandedCampaign] = useState(null)
  const [campaignDetails, setCampaignDetails] = useState({})
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/campaigns', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaignDetails = async (campaignId) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/details`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCampaignDetails(prev => ({ ...prev, [campaignId]: data }))
      }
    } catch (error) {
      console.error('Failed to fetch campaign details:', error)
    }
  }

  const createCampaign = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newCampaign),
      })
      
      if (response.ok) {
        setShowCreateDialog(false)
        setNewCampaign({ name: '', description: '' })
        fetchCampaigns()
      }
    } catch (error) {
      console.error('Failed to create campaign:', error)
    }
  }

  const deleteCampaign = async (campaignId) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        fetchCampaigns()
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    }
  }

  const deleteAllCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns/all', {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        fetchCampaigns()
      }
    } catch (error) {
      console.error('Failed to delete all campaigns:', error)
    }
  }

  const toggleCampaignExpansion = (campaignId) => {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null)
    } else {
      setExpandedCampaign(campaignId)
      if (!campaignDetails[campaignId]) {
        fetchCampaignDetails(campaignId)
      }
    }
  }

  const exportCampaignData = async (campaignId) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/export`, {
        credentials: 'include'
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `campaign-${campaignId}-data.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export campaign data:', error)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Campaigns</h1>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="space-y-4">
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
            <Settings className="h-6 w-6 md:h-8 md:w-8 text-indigo-500" />
            Campaigns
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage and analyze your marketing campaigns</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
                <DialogDescription>
                  Set up a new marketing campaign to organize your tracking links
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="Summer Sale 2024"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-description">Description (Optional)</Label>
                  <Input
                    id="campaign-description"
                    placeholder="Campaign description"
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                  />
                </div>
                <Button onClick={createCampaign} className="w-full">
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {campaigns.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Campaigns</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all campaigns and their associated data from both the system and database. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAllCampaigns} className="bg-red-600 hover:bg-red-700">
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search campaigns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                {/* Campaign Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base md:text-lg truncate">{campaign.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {campaign.links_count || 0} links
                      </Badge>
                    </div>
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Campaign Stats */}
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-lg md:text-xl font-bold">{campaign.total_clicks || 0}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                    <div>
                      <p className="text-lg md:text-xl font-bold">{campaign.total_opens || 0}</p>
                      <p className="text-xs text-muted-foreground">Opens</p>
                    </div>
                    <div>
                      <p className="text-lg md:text-xl font-bold">{campaign.total_redirects || 0}</p>
                      <p className="text-xs text-muted-foreground">Redirects</p>
                    </div>
                    <div>
                      <p className="text-lg md:text-xl font-bold">{campaign.captured_emails || 0}</p>
                      <p className="text-xs text-muted-foreground">Emails</p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCampaignExpansion(campaign.id)}
                    >
                      {expandedCampaign === campaign.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => exportCampaignData(campaign.id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{campaign.name}" and all its associated data. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteCampaign(campaign.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Expanded Campaign Details */}
                {expandedCampaign === campaign.id && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Campaign Details</h4>
                    
                    {campaignDetails[campaign.id] ? (
                      <div className="space-y-4">
                        {/* Performance Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-lg font-bold text-green-500">
                              {campaignDetails[campaign.id].conversion_rate || 0}%
                            </p>
                            <p className="text-xs text-muted-foreground">Conversion Rate</p>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-lg font-bold text-blue-500">
                              {campaignDetails[campaign.id].engagement_rate || 0}%
                            </p>
                            <p className="text-xs text-muted-foreground">Engagement Rate</p>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-lg font-bold text-purple-500">
                              {campaignDetails[campaign.id].avg_session_duration || 0}s
                            </p>
                            <p className="text-xs text-muted-foreground">Avg Session</p>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-lg font-bold text-orange-500">
                              {campaignDetails[campaign.id].bounce_rate || 0}%
                            </p>
                            <p className="text-xs text-muted-foreground">Bounce Rate</p>
                          </div>
                        </div>

                        {/* Detailed Tracking Data Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Timestamp</th>
                                <th className="text-left p-2">Email</th>
                                <th className="text-left p-2">ISP</th>
                                <th className="text-left p-2 hidden md:table-cell">User Agent</th>
                                <th className="text-left p-2">IP</th>
                                <th className="text-left p-2">Country</th>
                                <th className="text-left p-2 hidden sm:table-cell">City</th>
                                <th className="text-left p-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {campaignDetails[campaign.id].tracking_data?.slice(0, 10).map((event, index) => (
                                <tr key={event.id || index} className="border-b hover:bg-muted/50">
                                  <td className="p-2 text-xs">
                                    {new Date(event.timestamp).toLocaleString()}
                                  </td>
                                  <td className="p-2">
                                    {event.captured_email ? (
                                      <div className="flex items-center gap-1">
                                        <Mail className="h-3 w-3 text-purple-500" />
                                        <span className="text-xs truncate">{event.captured_email}</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </td>
                                  <td className="p-2 text-xs">{event.isp}</td>
                                  <td className="p-2 text-xs hidden md:table-cell truncate max-w-32">
                                    {event.user_agent?.substring(0, 30)}...
                                  </td>
                                  <td className="p-2 text-xs font-mono">{event.ip_address}</td>
                                  <td className="p-2 text-xs">
                                    <div className="flex items-center gap-1">
                                      <img 
                                        src={`https://flagcdn.com/16x12/${event.country_code?.toLowerCase()}.png`}
                                        alt={`${event.country_name} flag`}
                                        className="w-4 h-3 rounded"
                                      />
                                      {event.country_name}
                                    </div>
                                  </td>
                                  <td className="p-2 text-xs hidden sm:table-cell">{event.city}</td>
                                  <td className="p-2">
                                    <Badge variant="outline" className="text-xs">
                                      {event.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading campaign details...</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <Settings className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">No campaigns found</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                {searchTerm ? 'No campaigns match your search criteria.' : 'Create your first campaign to organize your tracking links.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

