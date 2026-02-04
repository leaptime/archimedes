import { Settings2, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  useThemeConfig,
  paletteDefinitions,
  iconStyleOptions,
  fontSizeOptions,
  borderRadiusOptions,
} from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function ThemeConfigurator() {
  const {
    config,
    setColorPalette,
    setIconStyle,
    setFontSize,
    setBorderRadius,
    resetToDefaults,
  } = useThemeConfig();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80 overflow-y-auto border-l border-border">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-[15px] font-medium">Appearance</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Color Palette */}
          <section>
            <h4 className="text-[13px] font-medium text-foreground mb-3">Theme</h4>
            <div className="grid grid-cols-3 gap-2">
              {paletteDefinitions.map((palette) => (
                <button
                  key={palette.value}
                  onClick={() => setColorPalette(palette.value)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-3 rounded-md border transition-colors",
                    config.colorPalette === palette.value
                      ? "border-foreground bg-accent"
                      : "border-border hover:border-foreground/30 hover:bg-accent/50"
                  )}
                >
                  <div className="flex h-4 w-full overflow-hidden rounded">
                    <div className="flex-1 h-full" style={{ backgroundColor: palette.colors.sidebar }} />
                    <div className="flex-1 h-full" style={{ backgroundColor: palette.colors.primary }} />
                    <div className="flex-1 h-full" style={{ backgroundColor: palette.colors.secondary }} />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{palette.label}</span>
                  {config.colorPalette === palette.value && (
                    <Check className="absolute top-1.5 right-1.5 w-3 h-3 text-foreground" />
                  )}
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Corner Radius */}
          <section>
            <h4 className="text-[13px] font-medium text-foreground mb-3">Corners</h4>
            <div className="flex gap-1">
              {borderRadiusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBorderRadius(option.value)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 py-2 rounded-md border transition-colors",
                    config.borderRadius === option.value
                      ? "border-foreground bg-accent"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  <div
                    className="w-4 h-4 bg-foreground/80"
                    style={{ borderRadius: option.preview }}
                  />
                  <span className="text-[10px] text-muted-foreground">{option.label}</span>
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Font Size */}
          <section>
            <h4 className="text-[13px] font-medium text-foreground mb-3">Text Size</h4>
            <div className="flex gap-1">
              {fontSizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFontSize(option.value)}
                  className={cn(
                    "flex-1 py-2 rounded-md border transition-colors text-center",
                    config.fontSize === option.value
                      ? "border-foreground bg-accent"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  <span className="text-[12px] font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Icon Style */}
          <section>
            <h4 className="text-[13px] font-medium text-foreground mb-3">Icons</h4>
            <div className="flex gap-2">
              {iconStyleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setIconStyle(option.value)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-md border transition-colors",
                    config.iconStyle === option.value
                      ? "border-foreground bg-accent"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  {option.value === "outline" ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  )}
                  <span className="text-[12px]">{option.label}</span>
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Reset */}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
            className="w-full h-8 text-[13px] text-muted-foreground hover:text-foreground gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
