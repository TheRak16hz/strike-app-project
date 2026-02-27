import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definir paletas de colores (Basadas en la Web)
const THEMES = {
  light: {
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    primary: '#3b82f6', // Vibrant Blue
    primaryBg: '#eff6ff',
    brandGreen: '#10b981', // Emerald Green
    danger: '#ef4444',
    dangerBg: '#fee2e2',
    success: '#22c55e',
    successBg: '#dcfce3',
    cardCompleted: '#f1f5f9',
    inversePending: '#ef4444',
  },
  dark: {
    background: '#070a13', // hsl(222, 47%, 5%)
    card: '#0c1221', // hsl(222, 47%, 9%)
    text: '#f8fafc', // hsl(210, 40%, 98%)
    textSecondary: '#94a3b8', // hsl(215, 20%, 65%)
    border: '#1c2536', // hsl(216, 34%, 17%)
    primary: '#3b82f6', // hsl(217, 91%, 60%)
    primaryBg: '#1e3a8a',
    brandGreen: '#2dd48f', // hsl(158, 64%, 50%)
    danger: '#f87171',
    dangerBg: '#7f1d1d',
    success: '#4ade80',
    successBg: '#14532d',
    cardCompleted: '#070a13',
    inversePending: '#ef4444',
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('@theme');
        if (storedTheme !== null) setIsDark(storedTheme === 'dark');
      } catch (e) {
        console.error('Error loading preferences', e);
      }
    };
    loadPreferences();
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('@theme', newTheme ? 'dark' : 'light');
    } catch (e) {
      console.error('Error saving theme', e);
    }
  };

  const themeColors = isDark ? THEMES.dark : THEMES.light;
  const gradient = [themeColors.primary, themeColors.brandGreen];

  const colors = {
    ...themeColors,
    primaryGradient: gradient,
    isDark,
  };

  return (
    <ThemeContext.Provider value={{ colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
