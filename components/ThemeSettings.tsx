import React, { useState } from 'react';
import { useTheme, type PaletteType, type ColorPalette } from '../contexts/ThemeContext';
import { toast } from 'sonner';

const ThemeSettings: React.FC = () => {
  const {
    theme,
    palette,
    colors,
    customColors,
    setTheme,
    setPalette,
    setCustomColors,
    saveSettings
  } = useTheme();

  const [isExpanded, setIsExpanded] = useState(false);
  const [tempCustomColors, setTempCustomColors] = useState<ColorPalette>(customColors);
  const [isSaving, setIsSaving] = useState(false);

  const palettes: Array<{ type: PaletteType; name: string; desc: string; emoji: string }> = [
    { type: 'motivate', name: 'Motivate', desc: 'Energetic', emoji: '🚀' },
    { type: 'calm', name: 'Calm', desc: 'Zen', emoji: '🌿' },
    { type: 'power', name: 'Power', desc: 'Bold', emoji: '⚡' }
  ];

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handlePaletteSelect = (paletteType: PaletteType) => {
    setPalette(paletteType);
  };

  const handleCustomColorChange = (key: keyof ColorPalette, value: string) => {
    setTempCustomColors({ ...tempCustomColors, [key]: value });
    setCustomColors({ ...tempCustomColors, [key]: value });
  };

  const handleReset = () => {
    const defaultColors = { primary: '#ff6b6b', secondary: '#4ecdc4', accent: '#ffe66d' };
    setTempCustomColors(defaultColors);
    setCustomColors(defaultColors);
  };

  const handleApply = async () => {
    setIsSaving(true);
    try {
      await saveSettings();
      toast.success('Theme saved! Looking good! ✨');
    } catch (error) {
      toast.error('Failed to save theme settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="p-6 rounded-lg border-2 cursor-pointer"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--color-accent)',
      }}
    >
      <div className="flex items-center justify-between" onClick={() => setIsExpanded(!isExpanded)}>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          🎨 Design Your Vibe
        </h2>
        <button className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-6">
          {/* Theme Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Theme
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleThemeToggle}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${theme === 'dark' ? 'font-bold' : ''}`}
                style={{
                  background: theme === 'dark' ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.1)',
                  color: theme === 'dark' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                🌙 Dark
              </button>
              <button
                onClick={handleThemeToggle}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${theme === 'light' ? 'font-bold' : ''}`}
                style={{
                  background: theme === 'light' ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.1)',
                  color: theme === 'light' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                ☀️ Light
              </button>
            </div>
          </div>

          {/* Palette Selector */}
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              Color Palette
            </label>
            <div className="grid grid-cols-1 gap-3">
              {palettes.map((p) => (
                <button
                  key={p.type}
                  onClick={() => handlePaletteSelect(p.type)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                    palette === p.type ? 'border-opacity-100' : 'border-opacity-30'
                  }`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: palette === p.type ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ background: getPreviewColors(p.type).primary }}
                    ></div>
                    <div
                      className="w-6 h-6 rounded"
                      style={{ background: getPreviewColors(p.type).secondary }}
                    ></div>
                    <div
                      className="w-6 h-6 rounded"
                      style={{ background: getPreviewColors(p.type).accent }}
                    ></div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {p.emoji} {p.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {p.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Custom Colors
              </label>
              <button
                onClick={() => handlePaletteSelect('custom')}
                className="px-3 py-1 text-xs rounded-lg"
                style={{
                  background: palette === 'custom' ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.1)',
                  color: palette === 'custom' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                {palette === 'custom' ? 'Active' : 'Activate'}
              </button>
            </div>

            <div className={`space-y-3 ${palette !== 'custom' ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Primary
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={tempCustomColors.primary}
                    onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                    disabled={palette !== 'custom'}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempCustomColors.primary}
                    onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                    disabled={palette !== 'custom'}
                    className="flex-1 px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Secondary
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={tempCustomColors.secondary}
                    onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                    disabled={palette !== 'custom'}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempCustomColors.secondary}
                    onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                    disabled={palette !== 'custom'}
                    className="flex-1 px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Accent
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={tempCustomColors.accent}
                    onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                    disabled={palette !== 'custom'}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempCustomColors.accent}
                    onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                    disabled={palette !== 'custom'}
                    className="flex-1 px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleReset}
                disabled={palette !== 'custom'}
                className="w-full px-4 py-2 rounded-lg text-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)',
                }}
              >
                Reset to Default
              </button>
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            disabled={isSaving}
            className="w-full px-6 py-3 rounded-lg font-semibold text-white"
            style={{
              background: 'var(--color-accent)',
            }}
          >
            {isSaving ? 'Saving...' : 'Apply & Save'}
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function to get preview colors
const getPreviewColors = (paletteType: PaletteType): ColorPalette => {
  const palettes = {
    motivate: { primary: '#ff6b6b', secondary: '#4ecdc4', accent: '#ffe66d' },
    calm: { primary: '#a8e6cf', secondary: '#b8e6e6', accent: '#dcedc1' },
    power: { primary: '#ff4757', secondary: '#3742fa', accent: '#ffa502' },
    custom: { primary: '#ff6b6b', secondary: '#4ecdc4', accent: '#ffe66d' }
  };
  return palettes[paletteType];
};

export default ThemeSettings;
