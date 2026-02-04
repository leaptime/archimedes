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

// Extensions
export {
    ExtensionProvider,
    ExtensionPoint,
    ConditionalExtensionPoint,
    FormExtensionSlot,
    DetailExtensionSlot,
    ListExtensionSlot,
    useExtensions,
    useHasExtensions,
    useRegisterExtension,
} from './ExtensionPoint';
