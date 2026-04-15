import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [modoOscuro, setModoOscuro] = useState(() => {
    return localStorage.getItem('modoOscuro') === 'true'
  })

  useEffect(() => {
    if (modoOscuro) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('modoOscuro', modoOscuro)
  }, [modoOscuro])

  const toggleModoOscuro = () => setModoOscuro(prev => !prev)

  return (
    <ThemeContext.Provider value={{ modoOscuro, toggleModoOscuro }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)