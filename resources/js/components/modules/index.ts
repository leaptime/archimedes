// Module Component Library
// Standardized components for consistent UI across all modules

// Page Layout
export { ModulePage, ModuleContent } from './ModulePage';
export { ModuleHeader } from './ModuleHeader';

// Data Display
export { ModuleStats, type StatCard } from './ModuleStats';
export { ModuleList, type Column, type Action } from './ModuleList';
export { ModuleCard, ModuleCardGrid } from './ModuleCard';
export { ModuleEmptyState } from './ModuleEmptyState';

// Forms
export { ModuleForm, ModuleFormActions } from './ModuleForm';
export { ModuleFormSection, FormRow, FormGroup } from './ModuleFormSection';
export { ModuleFormTabs } from './ModuleFormTabs';

// Filters
export { ModuleFilters, FilterGroup, FilterButton } from './ModuleFilters';
export { ModuleSearch } from './ModuleSearch';

// Fields
export * from './fields';

/**
 * Extensions - DEPRECATED
 * Use '@/lib/extensions' instead for the unified extension system.
 * 
 * These exports are kept for backward compatibility.
 */
export {
    UnifiedExtensionProvider as ExtensionProvider,
    ExtensionSlot as ExtensionPoint,
    ExtensionSlot as ConditionalExtensionPoint,
    FormExtensionSlot,
    DetailExtensionSlot,
    ListExtensionSlot,
    useSlotExtensions as useExtensions,
    registerExtension as useRegisterExtension,
} from '@/lib/extensions';

// Re-export the hook for checking extensions
import { useSlotExtensions } from '@/lib/extensions';
export const useHasExtensions = (slot: string) => useSlotExtensions(slot).hasExtensions;
