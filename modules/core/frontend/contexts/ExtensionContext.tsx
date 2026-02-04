import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ExtensionComponent {
  component: React.ComponentType<any>;
  priority: number;
  module: string;
}

export interface ExtensionRegistry {
  [slotName: string]: ExtensionComponent[];
}

export interface NavigationItem {
  label: string;
  icon?: string;
  path: string;
  permission?: string;
  children?: NavigationItem[];
}

export interface NavigationRegistry {
  main: NavigationItem[];
  settings: NavigationItem[];
  user: NavigationItem[];
}

export interface ExtensionContextValue {
  extensions: ExtensionRegistry;
  navigation: NavigationRegistry;
  registerExtension: (
    slotName: string,
    component: React.ComponentType<any>,
    options?: { priority?: number; module?: string }
  ) => void;
  unregisterExtension: (slotName: string, module: string) => void;
  getExtensions: (slotName: string) => ExtensionComponent[];
  registerNavigation: (
    section: keyof NavigationRegistry,
    item: NavigationItem,
    module: string
  ) => void;
  unregisterNavigation: (section: keyof NavigationRegistry, path: string) => void;
}

const defaultNavigation: NavigationRegistry = {
  main: [],
  settings: [],
  user: [],
};

const ExtensionContext = createContext<ExtensionContextValue | null>(null);

export function ExtensionProvider({ children }: { children: ReactNode }) {
  const [extensions, setExtensions] = useState<ExtensionRegistry>({});
  const [navigation, setNavigation] = useState<NavigationRegistry>(defaultNavigation);

  const registerExtension = useCallback(
    (
      slotName: string,
      component: React.ComponentType<any>,
      options: { priority?: number; module?: string } = {}
    ) => {
      setExtensions((prev) => {
        const existing = prev[slotName] || [];
        const newExtension: ExtensionComponent = {
          component,
          priority: options.priority ?? 100,
          module: options.module ?? 'unknown',
        };

        // Add and sort by priority (lower = first)
        const updated = [...existing, newExtension].sort(
          (a, b) => a.priority - b.priority
        );

        return {
          ...prev,
          [slotName]: updated,
        };
      });
    },
    []
  );

  const unregisterExtension = useCallback((slotName: string, module: string) => {
    setExtensions((prev) => {
      const existing = prev[slotName] || [];
      return {
        ...prev,
        [slotName]: existing.filter((ext) => ext.module !== module),
      };
    });
  }, []);

  const getExtensions = useCallback(
    (slotName: string): ExtensionComponent[] => {
      return extensions[slotName] || [];
    },
    [extensions]
  );

  const registerNavigation = useCallback(
    (section: keyof NavigationRegistry, item: NavigationItem, module: string) => {
      setNavigation((prev) => {
        const existing = prev[section] || [];
        // Avoid duplicates
        if (existing.some((nav) => nav.path === item.path)) {
          return prev;
        }
        return {
          ...prev,
          [section]: [...existing, { ...item, _module: module } as any],
        };
      });
    },
    []
  );

  const unregisterNavigation = useCallback(
    (section: keyof NavigationRegistry, path: string) => {
      setNavigation((prev) => ({
        ...prev,
        [section]: prev[section].filter((item) => item.path !== path),
      }));
    },
    []
  );

  return (
    <ExtensionContext.Provider
      value={{
        extensions,
        navigation,
        registerExtension,
        unregisterExtension,
        getExtensions,
        registerNavigation,
        unregisterNavigation,
      }}
    >
      {children}
    </ExtensionContext.Provider>
  );
}

export function useExtensionContext(): ExtensionContextValue {
  const context = useContext(ExtensionContext);
  if (!context) {
    throw new Error('useExtensionContext must be used within an ExtensionProvider');
  }
  return context;
}
