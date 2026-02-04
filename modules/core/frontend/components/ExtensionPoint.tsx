import React, { Suspense, ReactNode } from 'react';
import { useExtensions, useHasExtensions } from '../hooks/useExtensions';

interface ExtensionPointProps {
  /** Unique name for this extension point (e.g., "contacts.form.after-email") */
  name: string;
  /** Context data passed to all extensions */
  context?: Record<string, any>;
  /** Content to render before extensions */
  children?: ReactNode;
  /** Wrapper element for extensions */
  wrapper?: React.ComponentType<{ children: ReactNode }>;
  /** Fallback while extensions are loading */
  fallback?: ReactNode;
  /** Whether to render children even if no extensions */
  renderChildrenAlways?: boolean;
  /** Class name for the extension container */
  className?: string;
}

/**
 * Extension Point Component
 * 
 * Renders a slot where modules can inject components.
 * 
 * @example
 * // In a form component:
 * <ExtensionPoint 
 *   name="contacts.form.after-email" 
 *   context={{ contact, formData, setFormData }} 
 * />
 * 
 * @example
 * // With wrapper and children:
 * <ExtensionPoint 
 *   name="contacts.card.actions" 
 *   wrapper={({ children }) => <div className="flex gap-2">{children}</div>}
 * >
 *   <Button>Default Action</Button>
 * </ExtensionPoint>
 */
export function ExtensionPoint({
  name,
  context = {},
  children,
  wrapper: Wrapper,
  fallback = null,
  renderChildrenAlways = true,
  className,
}: ExtensionPointProps) {
  const extensions = useExtensions(name);
  const hasExtensions = extensions.length > 0;

  // If no extensions and no children to render
  if (!hasExtensions && !children) {
    return null;
  }

  // If no extensions but we have children
  if (!hasExtensions && children && renderChildrenAlways) {
    return <>{children}</>;
  }

  const content = (
    <>
      {renderChildrenAlways && children}
      {extensions.map((extension, index) => {
        const ExtComponent = extension.component;
        return (
          <Suspense key={`${name}-${extension.module}-${index}`} fallback={fallback}>
            <ExtComponent {...context} />
          </Suspense>
        );
      })}
    </>
  );

  if (Wrapper) {
    return <Wrapper>{content}</Wrapper>;
  }

  if (className) {
    return <div className={className}>{content}</div>;
  }

  return content;
}

/**
 * Conditional Extension Point - only renders if extensions exist
 */
export function ConditionalExtensionPoint(props: ExtensionPointProps) {
  const hasExtensions = useHasExtensions(props.name);
  
  if (!hasExtensions && !props.children) {
    return null;
  }

  return <ExtensionPoint {...props} />;
}

/**
 * Extension Slot for forms - provides form-specific context
 */
interface FormExtensionSlotProps<T> {
  name: string;
  data: T;
  setData: (data: T | ((prev: T) => T)) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  className?: string;
}

export function FormExtensionSlot<T extends Record<string, any>>({
  name,
  data,
  setData,
  errors = {},
  disabled = false,
  className,
}: FormExtensionSlotProps<T>) {
  return (
    <ExtensionPoint
      name={name}
      context={{ data, setData, errors, disabled }}
      className={className}
    />
  );
}

/**
 * Extension Slot for tables - provides row context
 */
interface TableExtensionSlotProps<T> {
  name: string;
  row: T;
  index: number;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function TableExtensionSlot<T>({
  name,
  row,
  index,
  selected = false,
  onSelect,
}: TableExtensionSlotProps<T>) {
  return (
    <ExtensionPoint
      name={name}
      context={{ row, index, selected, onSelect }}
    />
  );
}
