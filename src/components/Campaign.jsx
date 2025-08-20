import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Target, 
  Plus, 
  Search, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Mail, 
  Eye, 
  MousePointer, 
  Shield,
  ChevronDown,
  ChevronRight,
  Trash2,
  Download,
  RefreshCw,
  Calendar,
  Globe,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Campaign = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState({});
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '' });

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch campaign details
  const fetchCampaignDetails = async (campaignId) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      const data = await response.json();
      if (data.success) {
        setCampaignDetails(prev => ({
          ...prev,
          [campaignId]: data
        }));
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error);
    }
  };

  // Create campaign
  const createCampaign = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign)
      });
      const data = await response.json();
      if (data.success) {
        setNewCampaign({ name: '', description: '' });
        setShowCreateForm(false);
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  // Delete campaign
  const deleteCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this campaign? This will permanently delete all associated links and tracking data.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        fetchCampaigns();
        setExpandedCampaign(null);
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  // Delete all campaigns
  const deleteAllCampaigns = async () => {
    if (!confirm('Are you sure you want to delete ALL campaigns? This will permanently delete all campaigns, links, and tracking data. This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/campaigns/delete-all', {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        fetchCampaigns();
        setExpandedCampaign(null);
        setCampaignDetails({});
      }
    } catch (error) {
      console.error('Error deleting all campaigns:', error);
    }
  };

  // Export campaign data
  const exportCampaignData = async (campaignId) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/export`);
      const data = await response.json();
      if (data.success) {
        // Convert to CSV and download
        const csvContent = convertToCSV(data.data);
        downloadCSV(csvContent, data.filename);
      }
    } catch (error) {
      console.error('Error exporting campaign data:', error);
    }
  };

  // Helper functions
  const convertToCSV = (data) => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return `"${value || ''}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Toggle campaign expansion
  const toggleCampaignExpansion = (campaignId) => {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null);
    } else {
      setExpandedCampaign(campaignId);
      if (!campaignDetails[campaignId]) {
        fetchCampaignDetails(campaignId);
      }
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (campaign.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate overview stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.total_clicks || 0), 0);
  const totalEmails = campaigns.reduce((sum, c) => sum + (c.captured_emails || 0), 0);

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Target className="w-8 h-8 mr-3 text-purple-400" />
            Campaign Management
          </h2>
          <p className="text-slate-400 mt-1">Organize and analyze your tracking campaigns</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => fetchCampaigns()}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Campaigns</p>
                <p className="text-2xl font-bold text-white mt-1">{totalCampaigns}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Active Campaigns</p>
                <p className="text-2xl font-bold text-white mt-1">{activeCampaigns}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Clicks</p>
                <p className="text-2xl font-bold text-white mt-1">{totalClicks.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/20">
                <MousePointer className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Emails Captured</p>
                <p className="text-2xl font-bold text-white mt-1">{totalEmails.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/20">
                <Mail className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
              <Button
                onClick={deleteAllCampaigns}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-400 hover:bg-red-600/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Campaign Form */}
      {showCreateForm && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Create New Campaign</CardTitle>
            <CardDescription className="text-slate-400">Set up a new tracking campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Campaign name"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <Textarea
              placeholder="Campaign description (optional)"
              value={newCampaign.description}
              onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={createCampaign}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-4 animate-spin" />
            <p className="text-slate-400">Loading campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardContent className="p-12 text-center">
              <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">No campaigns found</h3>
              <p className="text-slate-400 mb-4">Create your first campaign to start tracking</p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <div
                    className="w-full p-6 cursor-pointer hover:bg-slate-700/30 transition-colors"
                    onClick={() => toggleCampaignExpansion(campaign.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {expandedCampaign === campaign.id ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                        <div>
                          <h3 className="text-white font-semibold text-lg">{campaign.name}</h3>
                          <p className="text-slate-400 text-sm">{campaign.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-white font-bold">{campaign.total_clicks || 0}</p>
                          <p className="text-slate-400 text-xs">Clicks</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-bold">{campaign.unique_visitors || 0}</p>
                          <p className="text-slate-400 text-xs">Visitors</p>
                        </div>
                        <div className="text-center">
                          <p className="text-white font-bold">{campaign.captured_emails || 0}</p>
                          <p className="text-slate-400 text-xs">Emails</p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            campaign.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : campaign.status === 'paused'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }
                        >
                          {campaign.status}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              exportCampaignData(campaign.id);
                            }}
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCampaign(campaign.id);
                            }}
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-400 hover:bg-red-600/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  {expandedCampaign === campaign.id && campaignDetails[campaign.id] && (
                    <div className="px-6 pb-6 border-t border-slate-700">
                      <div className="mt-6 space-y-6">
                        {/* Campaign Analytics Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card className="bg-slate-700/30 border-slate-600">
                            <CardHeader>
                              <CardTitle className="text-white text-lg">Performance Over Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={campaignDetails[campaign.id].chart_data || []}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                  <XAxis dataKey="date" stroke="#9CA3AF" />
                                  <YAxis stroke="#9CA3AF" />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#1F2937',
                                      border: '1px solid #374151',
                                      borderRadius: '8px'
                                    }}
                                  />
                                  <Line type="monotone" dataKey="clicks" stroke="#8B5CF6" strokeWidth={2} />
                                  <Line type="monotone" dataKey="captures" stroke="#06B6D4" strokeWidth={2} />
                                </LineChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>

                          <Card className="bg-slate-700/30 border-slate-600">
                            <CardHeader>
                              <CardTitle className="text-white text-lg">Geographic Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={campaignDetails[campaign.id].geo_data?.slice(0, 5) || []}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                  <XAxis dataKey="country" stroke="#9CA3AF" />
                                  <YAxis stroke="#9CA3AF" />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#1F2937',
                                      border: '1px solid #374151',
                                      borderRadius: '8px'
                                    }}
                                  />
                                  <Bar dataKey="count" fill="#10B981" />
                                </BarChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Campaign Event Table */}
                        <Card className="bg-slate-700/30 border-slate-600">
                          <CardHeader>
                            <CardTitle className="text-white text-lg">Recent Activity</CardTitle>
                            <CardDescription className="text-slate-400">
                              Latest tracking events for this campaign
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-600">
                                <thead className="bg-slate-800">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Timestamp
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Recipient Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Location
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      ISP
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                      Threat
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-600">
                                  {campaignDetails[campaign.id].events?.slice(0, 10).map((event) => (
                                    <tr key={event.id} className="hover:bg-slate-600/30">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {new Date(event.timestamp).toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {event.recipient_email || 'N/A'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {event.city}, {event.country}
                                        {event.zip_code && ` ${event.zip_code}`}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {event.isp || 'Unknown'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge
                                          variant="secondary"
                                          className={
                                            event.status === 'On Page'
                                              ? 'bg-green-500/20 text-green-400'
                                              : event.status === 'Redirected'
                                              ? 'bg-blue-500/20 text-blue-400'
                                              : event.status === 'Opened'
                                              ? 'bg-yellow-500/20 text-yellow-400'
                                              : 'bg-red-500/20 text-red-400'
                                          }
                                        >
                                          {event.status}
                                        </Badge>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge
                                          variant="secondary"
                                          className={
                                            event.threat_level === 'Low'
                                              ? 'bg-green-500/20 text-green-400'
                                              : event.threat_level === 'Medium'
                                              ? 'bg-yellow-500/20 text-yellow-400'
                                              : 'bg-red-500/20 text-red-400'
                                          }
                                        >
                                          {event.threat_level || 'Low'}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {campaignDetails[campaign.id].events?.length > 10 && (
                              <div className="mt-4 text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                >
                                  View All Events ({campaignDetails[campaign.id].total_events})
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Campaign;

export { Campaign };

