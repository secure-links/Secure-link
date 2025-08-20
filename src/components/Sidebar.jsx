import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  Link as LinkIcon, 
  Shield, 
  Globe, 
  Activity, 
  Target,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Tracking Links', href: '/tracking-links', icon: LinkIcon },
  { name: 'Security', href: '/security', icon: Shield },
  { name: 'Geography', href: '/geography', icon: Globe },
  { name: 'Live Activity', href: '/live-activity', icon: Activity },
  { name: 'Campaign', href: '/campaign', icon: Target },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div className={cn(
      "bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <LinkIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-semibold text-sm">Brain Link Tracker</h1>
                  <p className="text-slate-400 text-xs">Advanced Analytics Dashboard</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-white"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  isActive 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50">
          {!collapsed && (
            <div className="text-xs text-slate-500">
              <p>Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

