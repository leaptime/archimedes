import React, { 
    createContext, 
    useContext, 
    useState, 
    useCallback, 
    useMemo,
    ReactNode 
} from 'react';
import { FormContextValue } from './types';

const FormContext = createContext<FormContextValue | null>(null);

interface FormProviderProps {
    children: ReactNode;
    data: Record<string, unknown>;
    onDataChange: (data: Record<string, unknown>) => void;
    errors?: Record<string, string>;
    onErrorsChange?: (errors: Record<string, string>) => void;
    disabled?: boolean;
    readonly?: boolean;
}

/**
 * Form Provider
 * 
 * Provides form context (data, errors, disabled state) to extension slots.
 * Wrap your form with this to enable form-aware extensions.
 * 
 * @example
 * <FormProvider
 *   data={formData}
 *   onDataChange={setFormData}
 *   errors={errors}
 * >
 *   <form>
 *     <input ... />
 *     <ExtensionSlot name="myform.after-field" />
 *   </form>
 * </FormProvider>
 */
export function FormProvider({
    children,
    data,
    onDataChange,
    errors: initialErrors = {},
    onErrorsChange,
    disabled = false,
    readonly = false,
}: FormProviderProps) {
    const [errors, setErrorsState] = useState(initialErrors);
    const [isDirty, setIsDirty] = useState(false);

    const setData = useCallback(
        (newData: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => {
            if (typeof newData === 'function') {
                onDataChange(newData(data));
            } else {
                onDataChange({ ...data, ...newData });
            }
            setIsDirty(true);
        },
        [data, onDataChange]
    );

    const setErrors = useCallback(
        (newErrors: Record<string, string>) => {
            setErrorsState(newErrors);
            onErrorsChange?.(newErrors);
        },
        [onErrorsChange]
    );

    const value: FormContextValue = useMemo(() => ({
        data,
        setData,
        errors,
        setErrors,
        disabled,
        readonly,
        isDirty,
    }), [data, setData, errors, setErrors, disabled, readonly, isDirty]);

    return (
        <FormContext.Provider value={value}>
            {children}
        </FormContext.Provider>
    );
}

/**
 * Hook to access form context
 * Returns null if not inside a FormProvider
 */
export function useFormContext(): FormContextValue | null {
    return useContext(FormContext);
}

/**
 * Hook to require form context
 * Throws if not inside a FormProvider
 */
export function useRequiredFormContext(): FormContextValue {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error('useRequiredFormContext must be used within a FormProvider');
    }
    return context;
}

/**
 * Hook to get form data
 */
export function useFormData(): {
    data: Record<string, unknown>;
    setData: (data: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
    isDirty: boolean;
} | null {
    const context = useFormContext();
    if (!context) return null;
    
    return {
        data: context.data,
        setData: context.setData,
        isDirty: context.isDirty,
    };
}

/**
 * Hook to get form errors
 */
export function useFormErrors(): {
    errors: Record<string, string>;
    setErrors: (errors: Record<string, string>) => void;
} | null {
    const context = useFormContext();
    if (!context) return null;
    
    return {
        errors: context.errors,
        setErrors: context.setErrors,
    };
}
