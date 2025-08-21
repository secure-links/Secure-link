import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  BarChart3, 
  Link2, 
  Shield, 
  Globe, 
  Activity, 
  Settings, 
  LogOut, 
  Brain,
  Menu,
  X,
  Sun,
  Moon,
  Palette,
  UserCog
} from 'lucide-react'

// Import tab components
import OverviewTab from './tabs/OverviewTab'
import LinksTab from './tabs/LinksTab'
import LinkShortenerTab from './tabs/LinkShortenerTab'
import AnalyticsTab from './tabs/AnalyticsTab'
import GeographyTab from './tabs/GeographyTab'
import SecurityTab from './tabs/SecurityTab'
import LiveActivityTab from './tabs/LiveActivityTab'
import CampaignsTab from './tabs/CampaignsTab'
import SettingsTab from './tabs/SettingsTab'
import AdminTab from './tabs/AdminTab'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { theme, changeTheme, themes } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Navigation items
  const navigationItems = [
    { path: '/', icon: BarChart3, label: 'Analytics Overview', color: 'text-blue-500' },
    { path: '/links', icon: Link2, label: 'Tracking Links', color: 'text-green-500' },
    { path: '/shortener', icon: Link2, label: 'Link Shortener', color: 'text-cyan-500' },
    { path: '/analytics', icon: BarChart3, label: 'Advanced Analytics', color: 'text-purple-500' },
    { path: '/geography', icon: Globe, label: 'Geography', color: 'text-orange-500' },
    { path: '/security', icon: Shield, label: 'Security', color: 'text-red-500' },
    { path: '/activity', icon: Activity, label: 'Live Activity', color: 'text-emerald-500' },
    { path: '/campaigns', icon: Settings, label: 'Campaigns', color: 'text-indigo-500' },
    { path: '/admin', icon: UserCog, label: 'Admin', color: 'text-pink-500' },
    { path: '/settings', icon: Settings, label: 'Settings', color: 'text-gray-500' }
  ]

  const handleLogout = async () => {
    await logout()
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark': return <Moon className="h-4 w-4" />
      case 'light': return <Sun className="h-4 w-4" />
      default: return <Palette className="h-4 w-4" />
    }
  }

  const cycleTheme = () => {
    const currentIndex = themes.findIndex(t => t.value === theme)
    const nextIndex = (currentIndex + 1) % themes.length
    changeTheme(themes[nextIndex].value)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Brain Link Tracker</h1>
                <p className="text-sm text-muted-foreground">Advanced Analytics</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <UserCog className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setSidebarOpen(false)
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          <div className="space-y-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleTheme}
              className="w-full justify-start"
            >
              {getThemeIcon()}
              <span className="ml-2">{themes.find(t => t.value === theme)?.label} Theme</span>
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold">
                  {navigationItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Last updated: {currentTime.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={cycleTheme}>
                {getThemeIcon()}
              </Button>
              <div className="text-sm text-muted-foreground">
                Welcome, {user?.username}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Routes>
            <Route path="/" element={<OverviewTab />} />
            <Route path="/links" element={<LinksTab />} />
            <Route path="/shortener" element={<LinkShortenerTab />} />
            <Route path="/analytics" element={<AnalyticsTab />} />
            <Route path="/geography" element={<GeographyTab />} />
            <Route path="/security" element={<SecurityTab />} />
            <Route path="/activity" element={<LiveActivityTab />} />
            <Route path="/campaigns" element={<CampaignsTab />} />
            <Route path="/admin" element={<AdminTab />} />
            <Route path="/settings" element={<SettingsTab />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

