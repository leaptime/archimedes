/**
 * Unified Extension System
 * 
 * This module provides a single, unified API for all extension functionality:
 * - Static component registration (bundled modules)
 * - Dynamic component loading (API-driven third-party extensions)
 * - Form-aware context (record, errors, readonly state)
 * - Custom field management
 * 
 * ARCHITECTURE:
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    UnifiedExtensionProvider                  │
 * │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
 * │  │ Static Registry │  │ Dynamic Loader  │  │ Field Registry││
 * │  │ (bundled comps) │  │ (API extensions)│  │ (custom fields)││
 * │  └─────────────────┘  └─────────────────┘  └──────────────┘│
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      <ExtensionSlot>                         │
 * │  - Renders static + dynamic extensions                       │
 * │  - Provides form context if within FormProvider              │
 * │  - Handles loading/error states                              │
 * └─────────────────────────────────────────────────────────────┘
 */

export { UnifiedExtensionProvider, useExtensions, useSlotExtensions, useModelFields } from './provider';
export { ExtensionSlot, FormExtensionSlot, DetailExtensionSlot, ListExtensionSlot } from './slots';
export { ExtensionFields, ExtensionFieldsDisplay } from './fields';
export { registerExtension, registerExtensionComponent } from './registry';
export { FormProvider, useFormContext } from './form-context';

export type {
    ExtensionManifest,
    ExtensionComponent,
    ExtensionFieldDef,
    ExtensionStats,
    RegisteredExtension,
    SlotContext,
    FormContextValue,
} from './types';
