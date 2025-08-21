import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('original')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('brain-tracker-theme') || 'original'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (newTheme) => {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('dark', 'light', 'original')
    
    // Apply new theme
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else if (newTheme === 'light') {
      root.classList.add('light')
    } else {
      root.classList.add('original')
    }
  }

  const changeTheme = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('brain-tracker-theme', newTheme)
    applyTheme(newTheme)
  }

  const value = {
    theme,
    changeTheme,
    themes: [
      { value: 'original', label: 'Original', description: 'Purple gradient theme' },
      { value: 'light', label: 'Light', description: 'Clean light theme' },
      { value: 'dark', label: 'Dark', description: 'Dark professional theme' }
    ]
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

