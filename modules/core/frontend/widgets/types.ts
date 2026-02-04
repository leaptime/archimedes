import { ComponentType } from 'react';
import { FieldInfo } from '../views/types';

// Widget Props
export interface WidgetProps {
    name: string;
    value: any;
    onChange: (value: any) => void;
    field: FieldInfo;
    readonly?: boolean;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    placeholder?: string;
    className?: string;
    options?: Record<string, any>;
}

// Widget Option Definition (for view designer)
export interface WidgetOptionDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'field';
    label: string;
    default?: any;
    choices?: { label: string; value: string }[];
    help?: string;
}

// Widget Definition
export interface WidgetDefinition<P = Record<string, any>> {
    component: ComponentType<WidgetProps & P>;
    displayName: string;
    supportedTypes: string[];
    defaultFor?: string[];
    options?: WidgetOptionDefinition[];
    extractProps?: (field: FieldInfo, options: Record<string, any>) => P;
    isEmpty?: (value: any) => boolean;
    validate?: (value: any, field: FieldInfo) => string | null;
    format?: (value: any, options?: Record<string, any>) => string;
    parse?: (value: string, options?: Record<string, any>) => any;
    preview?: ComponentType<{ value: any }>;
}

// Field Component Props
export interface FieldComponentProps {
    name: string;
    widget?: string;
    label?: string;
    required?: boolean | string;
    readonly?: boolean | string;
    invisible?: boolean | string;
    placeholder?: string;
    options?: Record<string, any>;
    className?: string;
    onChange?: (value: any) => void;
    // For standalone use
    value?: any;
    error?: string;
}

// Common option types
export interface CurrencyOptions {
    currency_field?: string;
    hide_symbol?: boolean;
    digits?: number;
}

export interface SelectOptions {
    choices?: { label: string; value: string | number }[];
    multiple?: boolean;
    searchable?: boolean;
    clearable?: boolean;
}

export interface RelationOptions {
    model?: string;
    domain?: any[];
    context?: Record<string, any>;
    limit?: number;
    create?: boolean;
    edit?: boolean;
}

export interface DateOptions {
    format?: string;
    min?: string;
    max?: string;
    showTime?: boolean;
}

export interface TextOptions {
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    rows?: number;
}
