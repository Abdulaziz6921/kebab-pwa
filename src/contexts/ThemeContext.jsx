import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(undefined);

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored || THEMES.SYSTEM;
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEMES.DARK
        : THEMES.LIGHT;
    }
    return THEMES.LIGHT;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      if (theme === THEMES.SYSTEM) {
        setResolvedTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    let resolved;
    if (theme === THEMES.SYSTEM) {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEMES.DARK
        : THEMES.LIGHT;
    } else {
      resolved = theme;
    }
    setResolvedTheme(resolved);

    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove(THEMES.LIGHT, THEMES.DARK);
    root.classList.add(resolved);
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  };

  const value = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === THEMES.DARK,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
