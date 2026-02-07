import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface Module {
    id: string;
    name: string;
    description: string;
    version: string;
    category: string;
    author: string;
    license: string;
    depends: string[];
    status: 'active' | 'inactive';
    path: string;
    extends: string[];
    permissions: string[];
    hasSettings: boolean;
    navigation: {
        main?: Array<{
            label: string;
            icon: string;
            path: string;
            permission?: string;
        }>;
    } | null;
}

export interface ModuleStats {
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
}

export interface ModuleDetail extends Module {
    extensions: Record<string, {
        fields: Record<string, any>;
        hasRelationships: boolean;
        hasComputed: boolean;
        hasScopes: boolean;
    }>;
    settings: Record<string, any>;
    routes: Record<string, string> | null;
}

async function fetchModules(): Promise<Module[]> {
    const response = await axios.get('/api/modules');
    return response.data.data;
}

async function fetchModuleStats(): Promise<ModuleStats> {
    const response = await axios.get('/api/modules/stats');
    return response.data.data;
}

async function fetchModuleDetail(moduleId: string): Promise<ModuleDetail> {
    const response = await axios.get(`/api/modules/${moduleId}`);
    return response.data.data;
}

export interface ModulePlugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    trustLevel: 'community' | 'verified' | 'certified' | 'core';
    extends: string[];
    capabilities: string[];
    slots: Array<{
        slot: string;
        component: string;
        priority: number;
    }>;
    fields: Array<{
        model: string;
        name: string;
        label: string;
        type: string;
    }>;
    isValid: boolean;
    errors: Record<string, string>;
    scope: 'global' | 'tenant';
}

async function fetchModulePlugins(moduleId: string): Promise<ModulePlugin[]> {
    const response = await axios.get(`/api/modules/${moduleId}/plugins`);
    return response.data.data;
}

export function useModules() {
    return useQuery({
        queryKey: ['modules'],
        queryFn: fetchModules,
    });
}

export function useModuleStats() {
    return useQuery({
        queryKey: ['modules', 'stats'],
        queryFn: fetchModuleStats,
    });
}

export function useModuleDetail(moduleId: string) {
    return useQuery({
        queryKey: ['modules', moduleId],
        queryFn: () => fetchModuleDetail(moduleId),
        enabled: !!moduleId,
    });
}

export function useModulePlugins(moduleId: string) {
    return useQuery({
        queryKey: ['modules', moduleId, 'plugins'],
        queryFn: () => fetchModulePlugins(moduleId),
        enabled: !!moduleId,
    });
}
