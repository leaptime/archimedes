import React, { Suspense, ReactNode } from 'react';
import { useSlotContext } from './SlotContext';
import { cn } from '@/lib/utils';

interface SlotProps {
    name: string;
    children?: ReactNode;
    className?: string;
    fallback?: ReactNode;
    wrapper?: React.ComponentType<{ children: ReactNode }>;
}

/**
 * Slot component - defines an extension point where modules can inject content
 */
export function Slot({ 
    name, 
    children, 
    className, 
    fallback = null,
    wrapper: Wrapper,
}: SlotProps) {
    const { getSlotExtensions, record, setRecord, errors, readonly } = useSlotContext();
    const extensions = getSlotExtensions(name);

    // If no extensions and no children, render nothing
    if (extensions.length === 0 && !children) {
        return null;
    }

    const content = (
        <>
            {children}
            {extensions.map((ext, index) => {
                const ExtComponent = ext.component;
                return (
                    <Suspense key={`${ext.module}-${index}`} fallback={fallback}>
                        <ExtComponent
                            record={record}
                            setRecord={setRecord}
                            errors={errors}
                            readonly={readonly}
                        />
                    </Suspense>
                );
            })}
        </>
    );

    if (Wrapper) {
        return <Wrapper>{content}</Wrapper>;
    }

    if (className) {
        return <div className={cn(className)}>{content}</div>;
    }

    return <>{content}</>;
}

/**
 * Conditional slot - only renders if there are extensions
 */
export function ConditionalSlot(props: SlotProps) {
    const { getSlotExtensions } = useSlotContext();
    const extensions = getSlotExtensions(props.name);

    if (extensions.length === 0 && !props.children) {
        return null;
    }

    return <Slot {...props} />;
}

/**
 * Slot with separator - adds visual separator when content exists
 */
export function SlotWithSeparator({ 
    name, 
    className,
    separatorClassName = 'border-t border-border my-4 pt-4',
}: { 
    name: string; 
    className?: string;
    separatorClassName?: string;
}) {
    const { getSlotExtensions } = useSlotContext();
    const extensions = getSlotExtensions(name);

    if (extensions.length === 0) {
        return null;
    }

    return (
        <div className={cn(separatorClassName, className)}>
            <Slot name={name} />
        </div>
    );
}
