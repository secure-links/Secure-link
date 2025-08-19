import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker as SimpleMarker } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import { interpolateReds } from 'd3-scale-chromatic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Globe, Search, Filter, BarChart, PieChart, Flag, MapPin, Users, TrendingUp } from 'lucide-react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Helper function to get country coordinates for markers
const getCountryCoordinates = (countryCode) => {
  const coordinates = {
    'US': [-95.7129, 37.0902],
    'GB': [-3.4360, 55.3781],
    'CA': [-106.3468, 56.1304],
    'AU': [133.7751, -25.2744],
    'DE': [10.4515, 51.1657],
    'FR': [2.2137, 46.2276],
    'JP': [138.2529, 36.2048],
    'CN': [104.1954, 35.8617],
    'IN': [78.9629, 20.5937],
    'BR': [-51.9253, -14.2350],
    'RU': [105.3188, 61.5240],
    'IT': [12.5674, 41.8719],
    'ES': [-3.7492, 40.4637],
    'MX': [-102.5528, 23.6345],
    'ZA': [22.9375, -30.5595],
    'KR': [127.7669, 35.9078],
    'NL': [5.2913, 52.1326],
    'SE': [18.6435, 60.1282],
    'NO': [8.4689, 60.4720],
    'CH': [8.2275, 46.8182],
    'BE': [4.4699, 50.5039],
    'AT': [14.5501, 47.5162],
    'DK': [9.5018, 56.2639],
    'FI': [25.7482, 61.9241],
    'IE': [-8.2439, 53.4129],
    'PT': [-8.2245, 39.3999],
    'GR': [21.8243, 39.0742],
    'PL': [19.1343, 51.9194],
    'CZ': [15.4730, 49.8175],
    'HU': [19.5033, 47.1625],
    'SK': [19.6990, 48.6690],
    'SI': [14.9955, 46.1512],
    'HR': [15.2000, 45.1000],
    'BG': [25.4858, 42.7339],
    'RO': [24.9668, 45.9432],
    'LT': [23.8813, 55.1694],
    'LV': [24.6032, 56.8796],
    'EE': [25.0136, 58.5953],
    'TR': [35.2433, 38.9637],
    'IL': [34.8516, 32.7940],
    'SA': [45.0792, 23.8859],
    'AE': [53.8478, 23.4241],
    'EG': [30.8025, 26.8206],
    'NG': [8.6753, 9.0820],
    'KE': [37.9062, -0.0236],
    'TH': [100.9925, 15.8700],
    'VN': [108.2772, 14.0583],
    'MY': [101.9758, 4.2105],
    'SG': [103.8198, 1.3521],
    'ID': [113.9213, -0.7893],
    'PH': [121.7740, 12.8797],
    'AR': [-63.6167, -38.4161],
    'CL': [-71.5430, -35.6751],
    'PE': [-75.0152, -9.1900],
    'CO': [-74.2973, 4.5709],
    'VE': [-66.5897, 6.4238],
    'EC': [-78.1834, -1.8312],
    'UY': [-55.7658, -32.5228],
    'PY': [-58.4438, -23.4425],
    'BO': [-63.5887, -16.2902],
    'NZ': [174.8860, -40.9006],
    'FJ': [179.4144, -16.5780]
  };
  return coordinates[countryCode] || null;
};

const GeographyComponent = () => {
  const [geoData, setGeoData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('countries'); // 'countries' or 'cities'
  const [geographies, setGeographies] = useState([]);

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const response = await fetch("/api/geo-analytics");
        const data = await response.json();
        if (data.success) {
          setGeoData(data.countries.map((country, index) => ({
            id: index + 1,
            country: country.country,
            country_code: country.country_code || "",
            cities: data.cities.filter(city => city.country === country.country).map(city => ({ name: city.city, visits: city.unique_visits })),
            visits: country.total_visits,
            unique: country.unique_visits,
            captured: country.captured_emails,
            conversion: country.conversion_rate,
          })));
        }
      } catch (error) {
        console.error("Error fetching geo analytics:", error);
      }
    };
    fetchGeoData();

    fetch(geoUrl)
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error("Failed to load geography data");
      })
      .then((topojson) => {
        setGeographies(topojson.objects.countries.geometries);
      })
      .catch((error) => {
        console.error("Error loading geography data:", error);
      });
  }, []);

  const filteredCountries = geoData.filter(country =>
    country.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const colorScale = scaleQuantile()
    .domain(geoData.map(d => d.visits))
    .range(Array(9).fill(0).map((_, i) => interpolateReds(i / 8)));

  const totalUniqueCountries = geoData.length;
  const totalUniqueCities = geoData.reduce((acc, country) => acc + country.cities.length, 0);
  const topCountry = geoData.reduce((prev, current) => (prev.visits > current.visits ? prev : current), { visits: 0 });
  const globalReach = (geoData.reduce((acc, country) => acc + country.visits, 0) / 1000).toFixed(1); // Assuming 1000 is max possible visits for 100% reach

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Globe className="w-8 h-8 mr-3 text-purple-400" />
            Geography Analytics
          </h2>
          <p className="text-slate-400 mt-1">Geographic distribution and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant={viewMode === 'countries' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('countries')}
            className={viewMode === 'countries' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
          >
            <Flag className="w-4 h-4 mr-2" />
            Countries
          </Button>
          <Button
            variant={viewMode === 'cities' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cities')}
            className={viewMode === 'cities' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Cities
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Countries</p>
                <p className="text-2xl font-bold text-white mt-1">{totalUniqueCountries}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Flag className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Cities</p>
                <p className="text-2xl font-bold text-white mt-1">{totalUniqueCities}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <MapPin className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Top Country</p>
                <p className="text-2xl font-bold text-white mt-1 flex items-center">
                  {topCountry.country_code && (
                    <img
                      src={`https://flagcdn.com/16x12/${topCountry.country_code.toLowerCase()}.png`}
                      alt={topCountry.country}
                      className="w-6 h-6 mr-2"
                    />
                  )}
                  {topCountry.country || 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/20">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Global Reach</p>
                <p className="text-2xl font-bold text-white mt-1">{globalReach}%</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/20">
                <Globe className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* World Map */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Global Activity Map
          </CardTitle>
          <CardDescription className="text-slate-400">Visualizing traffic distribution worldwide</CardDescription>
        </CardHeader>
        <CardContent className="p-6 h-[500px]">
          <ComposableMap
            projectionConfig={{
              scale: 150,
              rotation: [-11, 0, 0],
            }}
            width={800}
            height={500}
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies: currentGeographies }) =>
                currentGeographies.map((geo) => {
                  const countryData = geoData.find((s) => s.country_code === geo.properties.ISO_A2);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={countryData ? colorScale(countryData.visits) : "#333"}
                      stroke="#EAEAEC"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          outline: "none",
                        },
                        hover: {
                          fill: "#666",
                          outline: "none",
                        },
                        pressed: {
                          fill: "#999",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
            {geoData.map(({ country_code, country, visits, unique, captured, conversion, cities }) => {
              // Use predefined coordinates for major countries since centroid calculation is complex
              const coordinates = getCountryCoordinates(country_code);
              if (!coordinates) return null;
              return (
                <SimpleMarker key={country_code} coordinates={coordinates}>
                  <g
                    fill="none"
                    stroke="#FF5533"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(-12, -24)"
                  >
                    <circle cx="12" cy="10" r="3" />
                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" />
                  </g>
                  <text
                    textAnchor="middle"
                    y={15}
                    style={{ fontFamily: "system-ui", fill: "#5D5A6D", fontSize: "8px" }}
                  >
                    {country}
                  </text>
                </SimpleMarker>
              );
            })}
          </ComposableMap>
        </CardContent>
      </Card>

      {/* Top Performing Countries */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <BarChart className="w-5 h-5 mr-2" />
            Top Performing Countries
          </CardTitle>
          <CardDescription className="text-slate-400">Countries with highest engagement and activity</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {filteredCountries.length > 0 ? (
              filteredCountries.sort((a, b) => b.visits - a.visits).map((country, index) => (
                <div key={country.id} className="flex items-center justify-between bg-slate-700/30 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400 font-bold text-lg">#{index + 1}</span>
                    <img
                      src={`https://flagcdn.com/16x12/${country.country_code.toLowerCase()}.png`}
                      alt={country.country}
                      className="w-6 h-6 rounded-full"
                    />
                    <div>
                      <p className="text-white font-medium">{country.country}</p>
                      <p className="text-slate-400 text-sm">{country.cities.length} cities</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-white font-bold">{country.visits}</p>
                      <p className="text-slate-400 text-xs">Visits</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold">{country.unique}</p>
                      <p className="text-slate-400 text-xs">Unique</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold">{country.captured}</p>
                      <p className="text-slate-400 text-xs">Captured</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      {country.conversion.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No geographic data found</h3>
                <p className="text-slate-400">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Country/Region Ranking */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Country/Region Ranking
          </CardTitle>
          <CardDescription className="text-slate-400">Sortable ranking of countries by performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 text-white"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Visits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Unique</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Captured</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredCountries.map((country) => (
                  <tr key={country.id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white flex items-center space-x-2">
                      <img
                        src={`https://flagcdn.com/16x12/${country.country_code.toLowerCase()}.png`}
                        alt={country.country}
                        className="w-5 h-5 rounded-full"
                      />
                      <span>{country.country}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{country.visits}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{country.unique}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{country.captured}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{country.conversion.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { GeographyComponent as Geography };

