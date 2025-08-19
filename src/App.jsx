import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import Analytics from '@/components/Analytics'
import { TrackingLinks } from '@/components/TrackingLinks'
import { Security } from '@/components/Security'
import { Geography } from '@/components/Geography'
import LiveActivity from '@/components/LiveActivity'
import { Campaign } from '@/components/Campaign'
import { Login } from '@/components/Login'
import { ThemeProvider } from '@/components/ThemeProvider'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication status on app load
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth', {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (data.authenticated) {
        setIsAuthenticated(true)
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData) => {
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'DELETE',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsAuthenticated(false)
      setUser(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="brain-link-theme">
        <Login onLogin={handleLogin} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="brain-link-theme">
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Header user={user} onLogout={handleLogout} />
              <main className="flex-1 p-6">
                <Routes>
                  <Route path="/" element={<Navigate to="/analytics" replace />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/tracking-links" element={<TrackingLinks />} />
                  <Route path="/security" element={<Security />} />
                  <Route path="/geography" element={<Geography />} />
                  <Route path="/live-activity" element={<LiveActivity />} />
                  <Route path="/campaign" element={<Campaign />} />
                </Routes>
              </main>
            </div>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App

