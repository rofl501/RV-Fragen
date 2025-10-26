'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

export function DynamicFavicon() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    // Use resolvedTheme to handle system theme properly
    const currentTheme = resolvedTheme || theme;
    
    // Create favicon link element
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }

    // Set favicon based on theme
    if (currentTheme === 'dark') {
      favicon.href = '/RVlogo-darkmode.png';
    } else {
      favicon.href = '/RVlogo-lightmode.png';
    }

    // Also update apple-touch-icon for mobile
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.href = currentTheme === 'dark' ? '/RVlogo-darkmode.png' : '/RVlogo-lightmode.png';

  }, [theme, resolvedTheme]);

  return null; // This component doesn't render anything
}