import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
    Search, 
    Filter, 
    X, 
    Building2, 
    User, 
    ShoppingCart,
    Package,
    LayoutGrid,
    List,
} from 'lucide-react';

export interface ContactFiltersState {
    search: string;
    type: 'all' | 'company' | 'individual';
    is_customer: boolean | null;
    is_vendor: boolean | null;
    category_id: number | null;
    industry_id: number | null;
    country_id: number | null;
}

interface ContactFiltersProps {
    filters: ContactFiltersState;
    onFiltersChange: (filters: ContactFiltersState) => void;
    options?: {
        categories?: Array<{ id: number; name: string; color?: string }>;
        industries?: Array<{ id: number; name: string }>;
        countries?: Array<{ id: number; name: string; code: string }>;
    };
    viewMode?: 'grid' | 'list';
    onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export function ContactFilters({
    filters,
    onFiltersChange,
    options = {},
    viewMode = 'grid',
    onViewModeChange,
}: ContactFiltersProps) {
    const activeFiltersCount = [
        filters.type !== 'all',
        filters.is_customer !== null,
        filters.is_vendor !== null,
        filters.category_id !== null,
        filters.industry_id !== null,
        filters.country_id !== null,
    ].filter(Boolean).length;

    const clearFilters = () => {
        onFiltersChange({
            ...filters,
            type: 'all',
            is_customer: null,
            is_vendor: null,
            category_id: null,
            industry_id: null,
            country_id: null,
        });
    };

    return (
        <div className="space-y-4">
            {/* Main search and actions row */}
            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search contacts..."
                        value={filters.search}
                        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                        className="pl-9"
                    />
                </div>

                {/* Type filter (quick buttons) */}
                <div className="hidden sm:flex items-center border border-border rounded-lg p-1">
                    <Button
                        variant={filters.type === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8"
                        onClick={() => onFiltersChange({ ...filters, type: 'all' })}
                    >
                        All
                    </Button>
                    <Button
                        variant={filters.type === 'company' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => onFiltersChange({ ...filters, type: 'company' })}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        Companies
                    </Button>
                    <Button
                        variant={filters.type === 'individual' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => onFiltersChange({ ...filters, type: 'individual' })}
                    >
                        <User className="w-3.5 h-3.5" />
                        Individuals
                    </Button>
                </div>

                {/* More filters */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="w-4 h-4" />
                            Filters
                            {activeFiltersCount > 0 && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                                    {activeFiltersCount}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Filters</h4>
                                {activeFiltersCount > 0 && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        Clear all
                                    </Button>
                                )}
                            </div>

                            {/* Type (mobile) */}
                            <div className="sm:hidden space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={filters.type}
                                    onValueChange={(v) => onFiltersChange({ ...filters, type: v as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="company">Companies</SelectItem>
                                        <SelectItem value="individual">Individuals</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Role filters */}
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="is_customer"
                                            checked={filters.is_customer === true}
                                            onCheckedChange={(checked) => 
                                                onFiltersChange({ ...filters, is_customer: checked ? true : null })
                                            }
                                        />
                                        <Label htmlFor="is_customer" className="text-sm font-normal flex items-center gap-1">
                                            <ShoppingCart className="w-3.5 h-3.5" />
                                            Customer
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="is_vendor"
                                            checked={filters.is_vendor === true}
                                            onCheckedChange={(checked) => 
                                                onFiltersChange({ ...filters, is_vendor: checked ? true : null })
                                            }
                                        />
                                        <Label htmlFor="is_vendor" className="text-sm font-normal flex items-center gap-1">
                                            <Package className="w-3.5 h-3.5" />
                                            Vendor
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            {/* Category */}
                            {options.categories && options.categories.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={filters.category_id?.toString() || 'all'}
                                        onValueChange={(v) => 
                                            onFiltersChange({ ...filters, category_id: v === 'all' ? null : parseInt(v) })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All categories</SelectItem>
                                            {options.categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        {cat.color && (
                                                            <div 
                                                                className="w-2 h-2 rounded-full" 
                                                                style={{ backgroundColor: cat.color }}
                                                            />
                                                        )}
                                                        {cat.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Industry */}
                            {options.industries && options.industries.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Industry</Label>
                                    <Select
                                        value={filters.industry_id?.toString() || 'all'}
                                        onValueChange={(v) => 
                                            onFiltersChange({ ...filters, industry_id: v === 'all' ? null : parseInt(v) })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All industries" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All industries</SelectItem>
                                            {options.industries.map((ind) => (
                                                <SelectItem key={ind.id} value={ind.id.toString()}>
                                                    {ind.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Country */}
                            {options.countries && options.countries.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Country</Label>
                                    <Select
                                        value={filters.country_id?.toString() || 'all'}
                                        onValueChange={(v) => 
                                            onFiltersChange({ ...filters, country_id: v === 'all' ? null : parseInt(v) })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All countries" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All countries</SelectItem>
                                            {options.countries.map((country) => (
                                                <SelectItem key={country.id} value={country.id.toString()}>
                                                    {country.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* View mode toggle */}
                {onViewModeChange && (
                    <div className="hidden sm:flex items-center border border-border rounded-lg p-1">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onViewModeChange('grid')}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onViewModeChange('list')}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Active filters display */}
            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    
                    {filters.type !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                            {filters.type === 'company' ? 'Companies' : 'Individuals'}
                            <X 
                                className="w-3 h-3 cursor-pointer" 
                                onClick={() => onFiltersChange({ ...filters, type: 'all' })}
                            />
                        </Badge>
                    )}
                    
                    {filters.is_customer === true && (
                        <Badge variant="secondary" className="gap-1">
                            Customers
                            <X 
                                className="w-3 h-3 cursor-pointer" 
                                onClick={() => onFiltersChange({ ...filters, is_customer: null })}
                            />
                        </Badge>
                    )}
                    
                    {filters.is_vendor === true && (
                        <Badge variant="secondary" className="gap-1">
                            Vendors
                            <X 
                                className="w-3 h-3 cursor-pointer" 
                                onClick={() => onFiltersChange({ ...filters, is_vendor: null })}
                            />
                        </Badge>
                    )}
                    
                    {filters.category_id && options.categories && (
                        <Badge variant="secondary" className="gap-1">
                            {options.categories.find(c => c.id === filters.category_id)?.name}
                            <X 
                                className="w-3 h-3 cursor-pointer" 
                                onClick={() => onFiltersChange({ ...filters, category_id: null })}
                            />
                        </Badge>
                    )}
                    
                    {filters.industry_id && options.industries && (
                        <Badge variant="secondary" className="gap-1">
                            {options.industries.find(i => i.id === filters.industry_id)?.name}
                            <X 
                                className="w-3 h-3 cursor-pointer" 
                                onClick={() => onFiltersChange({ ...filters, industry_id: null })}
                            />
                        </Badge>
                    )}
                    
                    {filters.country_id && options.countries && (
                        <Badge variant="secondary" className="gap-1">
                            {options.countries.find(c => c.id === filters.country_id)?.name}
                            <X 
                                className="w-3 h-3 cursor-pointer" 
                                onClick={() => onFiltersChange({ ...filters, country_id: null })}
                            />
                        </Badge>
                    )}
                    
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>
                        Clear all
                    </Button>
                </div>
            )}
        </div>
    );
}

export const defaultFilters: ContactFiltersState = {
    search: '',
    type: 'all',
    is_customer: null,
    is_vendor: null,
    category_id: null,
    industry_id: null,
    country_id: null,
};
