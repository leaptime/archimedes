import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleSearchProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: () => void;
    placeholder?: string;
    debounce?: number;
    className?: string;
    showButton?: boolean;
}

export function ModuleSearch({
    value,
    onChange,
    onSearch,
    placeholder = 'Search...',
    debounce = 300,
    className,
    showButton = true,
}: ModuleSearchProps) {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localValue !== value) {
                onChange(localValue);
            }
        }, debounce);

        return () => clearTimeout(timer);
    }, [localValue, debounce]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onSearch) {
            onChange(localValue);
            onSearch();
        }
    };

    const handleClear = () => {
        setLocalValue('');
        onChange('');
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="pl-9 pr-9 h-9"
                />
                {localValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
            {showButton && onSearch && (
                <Button
                    size="sm"
                    onClick={() => {
                        onChange(localValue);
                        onSearch();
                    }}
                    className="h-9"
                >
                    Search
                </Button>
            )}
        </div>
    );
}
