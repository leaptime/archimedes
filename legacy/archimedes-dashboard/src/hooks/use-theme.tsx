import { createContext, useContext, useEffect, useState } from "react";

// Color palette definitions
export type ColorPalette = 
  | "linear" 
  | "ocean" 
  | "sunset" 
  | "forest" 
  | "midnight" 
  | "monochrome";

export type IconStyle = "outline" | "solid";
export type FontSize = "compact" | "default" | "comfortable" | "large";
export type BorderRadius = "none" | "small" | "medium" | "large" | "full";

export interface ThemeConfig {
  colorPalette: ColorPalette;
  iconStyle: IconStyle;
  fontSize: FontSize;
  borderRadius: BorderRadius;
}

interface ThemeContextType {
  config: ThemeConfig;
  setColorPalette: (palette: ColorPalette) => void;
  setIconStyle: (style: IconStyle) => void;
  setFontSize: (size: FontSize) => void;
  setBorderRadius: (radius: BorderRadius) => void;
  resetToDefaults: () => void;
}

const defaultConfig: ThemeConfig = {
  colorPalette: "linear",
  iconStyle: "outline",
  fontSize: "default",
  borderRadius: "medium",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const stored = localStorage.getItem("theme-config");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate old palettes to new ones
        if (!["linear", "ocean", "sunset", "forest", "midnight", "monochrome"].includes(parsed.colorPalette)) {
          parsed.colorPalette = "linear";
        }
        return { ...defaultConfig, ...parsed };
      } catch {
        return defaultConfig;
      }
    }
    return defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem("theme-config", JSON.stringify(config));
    
    // Apply all theme attributes
    document.documentElement.setAttribute("data-palette", config.colorPalette);
    document.documentElement.setAttribute("data-icon-style", config.iconStyle);
    document.documentElement.setAttribute("data-font-size", config.fontSize);
    document.documentElement.setAttribute("data-radius", config.borderRadius);
  }, [config]);

  const setColorPalette = (palette: ColorPalette) => {
    setConfig((prev) => ({ ...prev, colorPalette: palette }));
  };

  const setIconStyle = (style: IconStyle) => {
    setConfig((prev) => ({ ...prev, iconStyle: style }));
  };

  const setFontSize = (size: FontSize) => {
    setConfig((prev) => ({ ...prev, fontSize: size }));
  };

  const setBorderRadius = (radius: BorderRadius) => {
    setConfig((prev) => ({ ...prev, borderRadius: radius }));
  };

  const resetToDefaults = () => {
    setConfig(defaultConfig);
  };

  return (
    <ThemeContext.Provider
      value={{
        config,
        setColorPalette,
        setIconStyle,
        setFontSize,
        setBorderRadius,
        resetToDefaults,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeConfig() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeConfig must be used within a ThemeProvider");
  }
  return context;
}

// Legacy hook for backward compatibility
export function useColorTheme() {
  const { config, setColorPalette } = useThemeConfig();
  return {
    colorTheme: config.colorPalette,
    setColorTheme: setColorPalette,
  };
}

// Palette definitions - minimal, refined
export const paletteDefinitions: {
  value: ColorPalette;
  label: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    sidebar: string;
    highlight: string;
  };
}[] = [
  {
    value: "linear",
    label: "Linear",
    description: "Clean monochrome with violet accent",
    colors: {
      primary: "hsl(258 90% 66%)",
      secondary: "hsl(0 0% 96%)",
      accent: "hsl(0 0% 94%)",
      sidebar: "hsl(0 0% 3%)",
      highlight: "hsl(258 80% 85%)",
    },
  },
  {
    value: "ocean",
    label: "Ocean",
    description: "Deep blues with coral warmth",
    colors: {
      primary: "hsl(200 80% 50%)",
      secondary: "hsl(180 60% 45%)",
      accent: "hsl(15 85% 60%)",
      sidebar: "hsl(210 40% 15%)",
      highlight: "hsl(200 70% 75%)",
    },
  },
  {
    value: "sunset",
    label: "Sunset",
    description: "Warm orange with purple",
    colors: {
      primary: "hsl(25 95% 55%)",
      secondary: "hsl(45 90% 50%)",
      accent: "hsl(280 60% 55%)",
      sidebar: "hsl(20 40% 12%)",
      highlight: "hsl(35 85% 70%)",
    },
  },
  {
    value: "forest",
    label: "Forest",
    description: "Deep greens with earth tones",
    colors: {
      primary: "hsl(150 60% 40%)",
      secondary: "hsl(90 45% 45%)",
      accent: "hsl(30 65% 50%)",
      sidebar: "hsl(160 35% 12%)",
      highlight: "hsl(140 50% 70%)",
    },
  },
  {
    value: "midnight",
    label: "Midnight",
    description: "Indigo with golden accent",
    colors: {
      primary: "hsl(240 60% 55%)",
      secondary: "hsl(220 50% 50%)",
      accent: "hsl(45 85% 55%)",
      sidebar: "hsl(240 40% 10%)",
      highlight: "hsl(230 55% 75%)",
    },
  },
  {
    value: "monochrome",
    label: "Monochrome",
    description: "Pure black and white",
    colors: {
      primary: "hsl(0 0% 9%)",
      secondary: "hsl(0 0% 96%)",
      accent: "hsl(0 0% 94%)",
      sidebar: "hsl(0 0% 3%)",
      highlight: "hsl(0 0% 50%)",
    },
  },
];

export const iconStyleOptions: { value: IconStyle; label: string }[] = [
  { value: "outline", label: "Light" },
  { value: "solid", label: "Bold" },
];

export const fontSizeOptions: { value: FontSize; label: string; scale: string }[] = [
  { value: "compact", label: "S", scale: "0.875" },
  { value: "default", label: "M", scale: "1" },
  { value: "comfortable", label: "L", scale: "1.05" },
  { value: "large", label: "XL", scale: "1.125" },
];

export const borderRadiusOptions: { value: BorderRadius; label: string; preview: string }[] = [
  { value: "none", label: "None", preview: "0" },
  { value: "small", label: "Sm", preview: "0.25rem" },
  { value: "medium", label: "Md", preview: "0.375rem" },
  { value: "large", label: "Lg", preview: "0.5rem" },
  { value: "full", label: "Xl", preview: "0.75rem" },
];

// Legacy export for backward compatibility
export type ColorTheme = ColorPalette;
export const themeOptions = paletteDefinitions.map((p) => ({
  value: p.value,
  label: p.label,
  color: p.colors.primary,
}));
