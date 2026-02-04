import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ViewExtension, SlotContentProps } from '../views/types';
import { viewRegistry } from '../views/registry';

interface SlotContextValue {
    viewId: string;
    record: Record<string, any>;
    setRecord: (data: Record<string, any>) => void;
    errors: Record<string, string>;
    setErrors: (errors: Record<string, string>) => void;
    readonly: boolean;
    getSlotExtensions: (slotName: string) => ViewExtension[];
}

const SlotContext = createContext<SlotContextValue | null>(null);

interface SlotProviderProps {
    viewId: string;
    record: Record<string, any>;
    onRecordChange: (data: Record<string, any>) => void;
    errors?: Record<string, string>;
    onErrorsChange?: (errors: Record<string, string>) => void;
    readonly?: boolean;
    children: ReactNode;
}

export function SlotProvider({
    viewId,
    record,
    onRecordChange,
    errors: initialErrors = {},
    onErrorsChange,
    readonly = false,
    children,
}: SlotProviderProps) {
    const [errors, setErrorsState] = useState(initialErrors);

    const setRecord = useCallback(
        (data: Record<string, any>) => {
            onRecordChange({ ...record, ...data });
        },
        [record, onRecordChange]
    );

    const setErrors = useCallback(
        (newErrors: Record<string, string>) => {
            setErrorsState(newErrors);
            onErrorsChange?.(newErrors);
        },
        [onErrorsChange]
    );

    const getSlotExtensions = useCallback(
        (slotName: string) => viewRegistry.getSlotExtensions(viewId, slotName),
        [viewId]
    );

    return (
        <SlotContext.Provider
            value={{
                viewId,
                record,
                setRecord,
                errors,
                setErrors,
                readonly,
                getSlotExtensions,
            }}
        >
            {children}
        </SlotContext.Provider>
    );
}

export function useSlotContext(): SlotContextValue {
    const context = useContext(SlotContext);
    if (!context) {
        throw new Error('useSlotContext must be used within a SlotProvider');
    }
    return context;
}

export function useSlotRecord() {
    const { record, setRecord, readonly } = useSlotContext();
    return { record, setRecord, readonly };
}

export function useSlotErrors() {
    const { errors, setErrors } = useSlotContext();
    return { errors, setErrors };
}
