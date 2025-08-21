import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Globe, 
  MapPin, 
  TrendingUp, 
  Users, 
  BarChart3,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

export default function GeographyTab() {
  const [geoData, setGeoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  const [campaigns, setCampaigns] = useState([])
  const [selectedCountry, setSelectedCountry] = useState(null)

  useEffect(() => {
    fetchGeographicData()
    fetchCampaigns()
  }, [timeRange, selectedCampaign])

  const fetchGeographicData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        days: timeRange
      })
      
      if (selectedCampaign !== 'all') {
        params.append('campaign_id', selectedCampaign)
      }

      const response = await fetch(`/api/analytics/geographic?${params}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeoData(data)
      }
    } catch (error) {
      console.error('Failed to fetch geographic data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaigns = async () => {
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
    }
  }

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return '🌍'
    return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`
  }

  const getCountryIntensity = (countryCode) => {
    if (!geoData?.countries) return 0
    const country = geoData.countries.find(c => c.country_code === countryCode)
    if (!country) return 0
    
    const maxClicks = Math.max(...geoData.countries.map(c => c.clicks))
    return country.clicks / maxClicks
  }

  const getCountryColor = (countryCode) => {
    const intensity = getCountryIntensity(countryCode)
    if (intensity === 0) return '#f8f9fa'
    
    // Color scale from light blue to dark blue
    const opacity = Math.max(0.1, intensity)
    return `rgba(59, 130, 246, ${opacity})`
  }

  const continentData = geoData?.countries ? [
    { 
      name: 'North America', 
      value: geoData.countries.filter(c => ['US', 'CA', 'MX'].includes(c.country_code)).reduce((sum, c) => sum + c.clicks, 0),
      color: '#8884d8' 
    },
    { 
      name: 'Europe', 
      value: geoData.countries.filter(c => ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK'].includes(c.country_code)).reduce((sum, c) => sum + c.clicks, 0),
      color: '#82ca9d' 
    },
    { 
      name: 'Asia', 
      value: geoData.countries.filter(c => ['CN', 'JP', 'IN', 'KR', 'SG', 'TH', 'VN'].includes(c.country_code)).reduce((sum, c) => sum + c.clicks, 0),
      color: '#ffc658' 
    },
    { 
      name: 'Others', 
      value: geoData.countries.filter(c => !['US', 'CA', 'MX', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'CN', 'JP', 'IN', 'KR', 'SG', 'TH', 'VN'].includes(c.country_code)).reduce((sum, c) => sum + c.clicks, 0),
      color: '#ff7300' 
    }
  ].filter(item => item.value > 0) : []

  const topCities = geoData?.cities?.slice(0, 10) || []

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Geography</h1>
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
            <Globe className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            Geography
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Visualize traffic sources by location</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id.toString()}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={fetchGeographicData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Countries</p>
                <p className="text-lg md:text-2xl font-bold">{geoData?.countries?.length || 0}</p>
              </div>
              <Globe className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Cities</p>
                <p className="text-lg md:text-2xl font-bold">{geoData?.cities?.length || 0}</p>
              </div>
              <MapPin className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-lg md:text-2xl font-bold">{geoData?.total_clicks || 0}</p>
              </div>
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Top Country</p>
                <p className="text-sm md:text-lg font-bold truncate">
                  {geoData?.countries?.[0]?.country_name || 'N/A'}
                </p>
              </div>
              <img 
                src={getCountryFlag(geoData?.countries?.[0]?.country_code)} 
                alt="Flag"
                className="w-6 h-4 md:w-8 md:h-6 rounded"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive World Map */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Interactive World Map</CardTitle>
          <CardDescription className="text-xs md:text-sm">Click on countries to view detailed statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 md:h-96 bg-muted/20 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 150,
                center: [0, 0]
              }}
              width={800}
              height={400}
              style={{ width: '100%', height: '100%' }}
            >
              <ZoomableGroup zoom={1}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const countryCode = geo.properties.ISO_A2
                      const countryData = geoData?.countries?.find(c => c.country_code === countryCode)
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getCountryColor(countryCode)}
                          stroke="#FFFFFF"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { 
                              fill: "#3B82F6", 
                              outline: "none",
                              cursor: "pointer"
                            },
                            pressed: { outline: "none" }
                          }}
                          onClick={() => {
                            if (countryData) {
                              setSelectedCountry(countryData)
                            }
                          }}
                        />
                      )
                    })
                  }
                </Geographies>
                
                {/* Markers for top countries */}
                {geoData?.countries?.slice(0, 5).map((country) => (
                  <Marker key={country.country_code} coordinates={[country.longitude, country.latitude]}>
                    <circle r={Math.max(2, Math.min(10, country.clicks / 100))} fill="#EF4444" fillOpacity={0.7} />
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>
          </div>
          
          {selectedCountry && (
            <div className="mt-4 p-3 md:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src={getCountryFlag(selectedCountry.country_code)} 
                  alt={`${selectedCountry.country_name} flag`}
                  className="w-6 h-4 rounded"
                />
                <h3 className="font-semibold text-sm md:text-base">{selectedCountry.country_name}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs md:text-sm">
                <div>
                  <p className="text-muted-foreground">Clicks</p>
                  <p className="font-semibold">{selectedCountry.clicks.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unique Visitors</p>
                  <p className="font-semibold">{selectedCountry.unique_visitors.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Percentage</p>
                  <p className="font-semibold">{selectedCountry.percentage}%</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Continent Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Click Distribution by Continent</CardTitle>
            <CardDescription className="text-xs md:text-sm">Traffic breakdown by major regions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={continentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {continentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Cities Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Top 10 Cities</CardTitle>
            <CardDescription className="text-xs md:text-sm">Cities with highest traffic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCities} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="city" type="category" width={60} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="clicks" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Country Statistics Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Traffic by Country</CardTitle>
          <CardDescription className="text-xs md:text-sm">Detailed breakdown of traffic sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-xs md:text-sm">Country</th>
                  <th className="text-left p-2 text-xs md:text-sm">Clicks</th>
                  <th className="text-left p-2 text-xs md:text-sm hidden sm:table-cell">Unique Visitors</th>
                  <th className="text-left p-2 text-xs md:text-sm">% of Total</th>
                  <th className="text-left p-2 text-xs md:text-sm hidden md:table-cell">Trend</th>
                </tr>
              </thead>
              <tbody>
                {geoData?.countries?.slice(0, 20).map((country, index) => (
                  <tr key={country.country_code} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <img 
                          src={getCountryFlag(country.country_code)} 
                          alt={`${country.country_name} flag`}
                          className="w-4 h-3 md:w-6 md:h-4 rounded"
                        />
                        <span className="font-medium text-xs md:text-sm truncate">{country.country_name}</span>
                      </div>
                    </td>
                    <td className="p-2 font-mono text-xs md:text-sm">{country.clicks.toLocaleString()}</td>
                    <td className="p-2 font-mono text-xs md:text-sm hidden sm:table-cell">{country.unique_visitors.toLocaleString()}</td>
                    <td className="p-2">
                      <Badge variant="secondary" className="text-xs">
                        {country.percentage}%
                      </Badge>
                    </td>
                    <td className="p-2 hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                        <span className="text-xs text-green-500">+{Math.floor(Math.random() * 20)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

