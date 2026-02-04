import { useCallback, useMemo } from 'react';
import { useExtensionContext, ExtensionComponent, NavigationItem } from '../contexts/ExtensionContext';

/**
 * Hook to get extensions for a specific slot
 */
export function useExtensions(slotName: string): ExtensionComponent[] {
  const { getExtensions } = useExtensionContext();
  return useMemo(() => getExtensions(slotName), [getExtensions, slotName]);
}

/**
 * Hook to register an extension (typically in useEffect)
 */
export function useRegisterExtension(
  slotName: string,
  component: React.ComponentType<any>,
  options?: { priority?: number; module?: string }
) {
  const { registerExtension, unregisterExtension } = useExtensionContext();
  const module = options?.module ?? 'unknown';

  // Register on mount, unregister on unmount
  useMemo(() => {
    registerExtension(slotName, component, options);
    return () => unregisterExtension(slotName, module);
  }, [slotName, component, options, registerExtension, unregisterExtension, module]);
}

/**
 * Hook to get navigation items
 */
export function useNavigation(section: 'main' | 'settings' | 'user'): NavigationItem[] {
  const { navigation } = useExtensionContext();
  return navigation[section] || [];
}

/**
 * Hook to register navigation items
 */
export function useRegisterNavigation() {
  const { registerNavigation, unregisterNavigation } = useExtensionContext();

  const register = useCallback(
    (section: 'main' | 'settings' | 'user', item: NavigationItem, module: string) => {
      registerNavigation(section, item, module);
    },
    [registerNavigation]
  );

  const unregister = useCallback(
    (section: 'main' | 'settings' | 'user', path: string) => {
      unregisterNavigation(section, path);
    },
    [unregisterNavigation]
  );

  return { register, unregister };
}

/**
 * Hook to check if a slot has any extensions
 */
export function useHasExtensions(slotName: string): boolean {
  const extensions = useExtensions(slotName);
  return extensions.length > 0;
}

/**
 * Hook to get all registered extension slots
 */
export function useExtensionSlots(): string[] {
  const { extensions } = useExtensionContext();
  return Object.keys(extensions);
}
