import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const themes = {
  mermaid: {
    name: '粉色美人鱼',
    primary: '#f472b6', // pink-400
    secondary: '#fff1f2', // rose-50
    accent: '#2dd4bf', // teal-400
    bg: '/themes/mermaid/bg.png',
    logo: '/themes/mermaid/logo.png',
    cardColors: [
      'bg-pink-400',
      'bg-teal-400',
      'bg-rose-400',
      'bg-cyan-400'
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
  },
  kuromi: {
    name: '酷洛米',
    primary: '#9333ea', // purple-600
    secondary: '#faf5ff', // purple-50
    accent: '#d946ef', // fuchsia-500
    bg: '/themes/kuromi/bg.png',
    logo: '/themes/kuromi/logo.png',
    cardColors: [
      'bg-purple-600',
      'bg-slate-900',
      'bg-fuchsia-600',
      'bg-violet-600'
    ]
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'mermaid');

  useEffect(() => {
    localStorage.setItem('theme', currentTheme);
    document.body.setAttribute('data-theme', currentTheme);
    
    // Apply dynamic colors to CSS variables
    const theme = themes[currentTheme];
    document.documentElement.style.setProperty('--color-primary', theme.primary);
    document.documentElement.style.setProperty('--color-secondary', theme.secondary);
    document.documentElement.style.setProperty('--color-accent', theme.accent);
    document.documentElement.style.setProperty('--theme-bg-image', `url(${theme.bg})`);
  }, [currentTheme]);

  const toggleTheme = () => {
    const themeKeys = Object.keys(themes);
    const currentIndex = themeKeys.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setCurrentTheme(themeKeys[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme: themes[currentTheme], themeName: currentTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
