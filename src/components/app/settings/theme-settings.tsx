
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sun, Moon, Sparkles, Palette } from "lucide-react";
import { Separator } from '@/components/ui/separator';

type Theme = 'light' | 'dark' | 'full-dark' | 'custom';

// Helper function to convert hex to HSL
const hexToHsl = (hex: string): string => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
};

// Helper function to get HSL from CSS variable
const getPrimaryHsl = () => {
    if (typeof window === 'undefined') return '263.4 99.3% 62.5%';
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue('--primary').trim();
}

export function ThemeSettings() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [customColor, setCustomColor] = useState('#7c3aed'); // Default custom color (purple)

  // Load saved theme from localStorage on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as Theme | null;
    const savedColor = localStorage.getItem('app-theme-custom-color');
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
    if (savedColor) {
      setCustomColor(savedColor);
    }
  }, []);
  
  // Apply theme when it changes
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'full-dark');
    document.documentElement.classList.add(theme);
    
    localStorage.setItem('app-theme', theme);
    
    if (theme === 'custom') {
        const hslColor = hexToHsl(customColor);
        document.documentElement.style.setProperty('--primary', hslColor);
        localStorage.setItem('app-theme-custom-color', customColor);
    } else {
        // Reset to default primary color when not on custom
        document.documentElement.style.removeProperty('--primary');
        localStorage.removeItem('app-theme-custom-color');
    }
  }, [theme, customColor]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTheme('custom');
    setCustomColor(e.target.value);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Theme</h2>
        <p className="text-muted-foreground">Customize the look and feel of the app.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Color Scheme</CardTitle>
            <CardDescription>Select a color scheme for the application interface.</CardDescription>
        </CardHeader>
        <CardContent>
            <RadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Label htmlFor="theme-light" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                    <Sun className="mb-3 h-6 w-6" />
                    Light
                </Label>
                 <Label htmlFor="theme-dark" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                    <Moon className="mb-3 h-6 w-6" />
                    Dark
                </Label>
                 <Label htmlFor="theme-full-dark" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    <RadioGroupItem value="full-dark" id="theme-full-dark" className="sr-only" />
                    <Sparkles className="mb-3 h-6 w-6" />
                    Amoled
                </Label>
                <Label htmlFor="theme-custom" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    <RadioGroupItem value="custom" id="theme-custom" className="sr-only" />
                    <Palette className="mb-3 h-6 w-6" />
                    Custom
                </Label>
            </RadioGroup>
        </CardContent>
      </Card>
      
      {theme === 'custom' && (
        <Card>
            <CardHeader>
                <CardTitle>Custom Theme</CardTitle>
                <CardDescription>Choose your own primary color for the interface.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Label htmlFor="custom-color-picker">Primary Color</Label>
                    <div className="relative">
                        <input 
                            id="custom-color-picker"
                            type="color" 
                            value={customColor} 
                            onChange={handleColorChange}
                            className="w-10 h-10 p-1 bg-card border rounded-md cursor-pointer"
                        />
                    </div>
                    <span className="font-mono text-muted-foreground">{customColor}</span>
                </div>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
