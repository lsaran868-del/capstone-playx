import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'cyber';

export interface ThemeInfo {
  id: Theme;
  name: string;
  subtitle: string;
  icon: string;
}

export const AVAILABLE_THEMES: ThemeInfo[] = [
  { id: 'dark', name: 'Midnight Violet', subtitle: 'Default Deep Purple & Pink', icon: 'moon' },
  { id: 'light', name: 'Luminous Violet', subtitle: 'Clean Light & Brand Accents', icon: 'sun' },
  { id: 'cyber', name: 'Cyber Neon', subtitle: 'Electric Cyan & Synthwave Abyss', icon: 'zap' }
];

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  isLight: boolean;
  isCyber: boolean;
  themeName: string;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('playx_theme') as Theme | null;
    return (saved === 'light' || saved === 'cyber' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'cyber') {
      root.classList.add('dark', 'cyber');
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark', 'cyber');
    } else {
      // Default: dark
      root.classList.add('dark');
      root.classList.remove('light', 'cyber');
    }
    localStorage.setItem('playx_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'cyber';
      return 'dark';
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const currentThemeInfo = AVAILABLE_THEMES.find((t) => t.id === theme) || AVAILABLE_THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
        isCyber: theme === 'cyber',
        themeName: currentThemeInfo.name,
        toggleTheme,
        setTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
