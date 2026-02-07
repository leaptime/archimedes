/**
 * @deprecated This module is deprecated. Use '@/lib/extensions' instead.
 * 
 * Migration guide:
 * - ExtensionDataProvider -> UnifiedExtensionProvider
 * - DynamicExtensionPoint -> ExtensionSlot
 * - useExtensionData -> useExtensions
 * - useSlotExtensions -> useSlotExtensions (same name, new location)
 * - useModelFields -> useModelFields (same name, new location)
 */

// Re-export from unified system for backward compatibility
export {
    ExtensionSlot as DynamicExtensionPoint,
    ExtensionSlot as ConditionalExtensionPoint,
    ExtensionFields,
    ExtensionFieldsDisplay,
    registerExtensionComponent,
    UnifiedExtensionProvider as ExtensionDataProvider,
    useExtensions as useExtensionData,
    useSlotExtensions,
    useModelFields,
} from '@/lib/extensions';

export type {
    ExtensionManifest,
    ExtensionFieldDef,
    ExtensionStats,
    RegisteredExtension,
} from '@/lib/extensions';
