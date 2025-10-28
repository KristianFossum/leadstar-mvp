import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type ThemeMode = 'dark' | 'light';
export type PaletteType = 'motivate' | 'calm' | 'power' | 'custom';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface ThemeSettings {
  theme: ThemeMode;
  palette: PaletteType;
  customColors: ColorPalette;
}

const PALETTES: Record<Exclude<PaletteType, 'custom'>, ColorPalette> = {
  motivate: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    accent: '#ffe66d'
  },
  calm: {
    primary: '#a8e6cf',
    secondary: '#b8e6e6',
    accent: '#dcedc1'
  },
  power: {
    primary: '#ff4757',
    secondary: '#3742fa',
    accent: '#ffa502'
  }
};

interface ThemeContextType {
  theme: ThemeMode;
  palette: PaletteType;
  colors: ColorPalette;
  customColors: ColorPalette;
  setTheme: (theme: ThemeMode) => void;
  setPalette: (palette: PaletteType) => void;
  setCustomColors: (colors: ColorPalette) => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  suggestPaletteForPersonality: (personality: any) => PaletteType | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [palette, setPaletteState] = useState<PaletteType>('motivate');
  const [customColors, setCustomColorsState] = useState<ColorPalette>(PALETTES.motivate);
  const [isLoading, setIsLoading] = useState(true);

  const colors = palette === 'custom' ? customColors : PALETTES[palette];

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.style.setProperty('--bg-primary', '#121212');
      root.style.setProperty('--bg-card', '#1e1e1e');
      root.style.setProperty('--text-primary', '#e0e0e0');
      root.style.setProperty('--text-secondary', '#b0b0b0');
    } else {
      root.style.setProperty('--bg-primary', '#f5f5f5');
      root.style.setProperty('--bg-card', '#ffffff');
      root.style.setProperty('--text-primary', '#1a1a1a');
      root.style.setProperty('--text-secondary', '#666666');
    }

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);

    // Add transition class
    root.classList.add('theme-transition');
  }, [theme, colors]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setThemeState(data.theme as ThemeMode);
        setPaletteState(data.palette as PaletteType);
        if (data.custom_colors) {
          setCustomColorsState(data.custom_colors as ColorPalette);
        }
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    try {
      const settings = {
        user_id: user.id,
        theme,
        palette,
        custom_colors: customColors
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(settings, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving theme settings:', error);
      throw error;
    }
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const setPalette = (newPalette: PaletteType) => {
    setPaletteState(newPalette);
  };

  const setCustomColors = (newColors: ColorPalette) => {
    setCustomColorsState(newColors);
  };

  const suggestPaletteForPersonality = (personality: any): PaletteType | null => {
    if (!personality || !personality.trait_scores) return null;

    const scores = personality.trait_scores;

    // High Openness → Motivate
    if (scores.openness && scores.openness >= 4) {
      return 'motivate';
    }

    // High Conscientiousness → Calm
    if (scores.conscientiousness && scores.conscientiousness >= 4) {
      return 'calm';
    }

    // High Extraversion → Power
    if (scores.extraversion && scores.extraversion >= 4) {
      return 'power';
    }

    return null;
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        palette,
        colors,
        customColors,
        setTheme,
        setPalette,
        setCustomColors,
        saveSettings,
        loadSettings,
        suggestPaletteForPersonality
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
