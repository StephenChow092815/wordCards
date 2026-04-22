import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const themes = {
  magic: {
    name: '魔法森林',
    primary: '#ec4899', // pink-500
    secondary: '#fdf2f8', // pink-50
    accent: '#f472b6', // pink-400
    bg: '/themes/magic/bg.png',
    logo: '/themes/magic/logo.png',
    cardColors: [
      'bg-rose-400',
      'bg-pink-400',
      'bg-purple-400',
      'bg-amber-400'
    ]
  },
  frozen: {
    name: '冰雪奇缘',
    primary: '#0ea5e9', // sky-500
    secondary: '#f0f9ff', // sky-50
    accent: '#38bdf8', // sky-400
    bg: '/themes/elsa/bg.png',
    logo: '/themes/elsa/logo.png',
    cardColors: [
      'bg-sky-400',
      'bg-blue-400',
      'bg-indigo-400',
      'bg-cyan-400'
    ]
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'magic');

  useEffect(() => {
    localStorage.setItem('theme', currentTheme);
    document.body.setAttribute('data-theme', currentTheme);
    
    // Apply dynamic colors to CSS variables
    const theme = themes[currentTheme];
    document.documentElement.style.setProperty('--color-primary', theme.primary);
    document.documentElement.style.setProperty('--color-secondary', theme.secondary);
    document.documentElement.style.setProperty('--color-accent', theme.accent);
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'magic' ? 'frozen' : 'magic');
  };

  return (
    <ThemeContext.Provider value={{ theme: themes[currentTheme], themeName: currentTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
