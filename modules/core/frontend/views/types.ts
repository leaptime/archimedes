import { ComponentType } from 'react';

// View Types
export type ViewType = 'form' | 'list' | 'kanban' | 'card' | 'calendar';

export interface ViewDefinition {
    id: string;
    model: string;
    type: ViewType;
    title?: string;
    priority?: number;
    component: ComponentType<ViewProps>;
    schema?: ViewSchema;
}

export interface ViewProps {
    model: string;
    record?: Record<string, any>;
    records?: Record<string, any>[];
    onSave?: (data: Record<string, any>) => void;
    onCancel?: () => void;
    readonly?: boolean;
}

export interface ViewSchema {
    fields: FieldSchema[];
    slots: SlotSchema[];
    actions?: ActionSchema[];
}

export interface FieldSchema {
    name: string;
    type: string;
    widget?: string;
    label?: string;
    required?: boolean | string;
    readonly?: boolean | string;
    invisible?: boolean | string;
    placeholder?: string;
    options?: Record<string, any>;
    slot?: string;
}

export interface SlotSchema {
    name: string;
    label: string;
    description?: string;
    accepts: ('field' | 'group' | 'component')[];
}

export interface ActionSchema {
    name: string;
    label: string;
    type: 'object' | 'action';
    icon?: string;
}

// Field Information
export interface FieldInfo {
    name: string;
    type: string;
    label?: string;
    required?: boolean;
    readonly?: boolean;
    options?: Record<string, any>;
    widget?: string;
    relation?: string;
    selection?: [string, string][];
}

// Expression Context
export interface ExpressionContext {
    record: Record<string, any>;
    parent?: Record<string, any>;
    user?: {
        id: number;
        name: string;
        groups: string[];
    };
    env?: {
        isMobile: boolean;
        lang: string;
    };
}

// View Extension
export interface ViewExtension {
    view: string;
    slot: string;
    module: string;
    priority: number;
    component: ComponentType<SlotContentProps>;
}

export interface ViewModification {
    view: string;
    module: string;
    modifications: Modification[];
}

export interface Modification {
    target: ModificationTarget;
    position?: 'before' | 'after' | 'replace';
    modify?: Partial<FieldSchema>;
    insert?: any;
}

export interface ModificationTarget {
    field?: string;
    path?: string;
    component?: string;
}

export interface SlotContentProps {
    record: Record<string, any>;
    setRecord: (data: Record<string, any>) => void;
    errors?: Record<string, string>;
    readonly?: boolean;
}
