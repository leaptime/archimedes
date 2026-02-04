export interface TeamMember {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar: string;
    status: string;
    modules: string[];
    groups?: string[];
}

export interface TeamGroup {
    id: number;
    name: string;
    description: string;
    color: string;
    memberIds: number[];
    modules: string[];
}

export const teamMembers: TeamMember[] = [
    {
        id: 1,
        name: 'Alex Johnson',
        email: 'alex@company.com',
        role: 'Owner',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
        status: 'active',
        modules: ['All Modules'],
        groups: ['Leadership'],
    },
    {
        id: 2,
        name: 'Sarah Chen',
        email: 'sarah@company.com',
        role: 'Admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        status: 'active',
        modules: ['CRM 360', 'Analytics Hub'],
        groups: ['Sales Team'],
    },
    {
        id: 3,
        name: 'Mike Williams',
        email: 'mike@company.com',
        role: 'Member',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
        status: 'active',
        modules: ['Invoice Pro'],
        groups: ['Finance'],
    },
    {
        id: 4,
        name: 'Emily Davis',
        email: 'emily@company.com',
        role: 'Member',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
        status: 'active',
        modules: ['CRM 360'],
        groups: ['Sales Team'],
    },
    {
        id: 5,
        name: 'James Wilson',
        email: 'james@company.com',
        role: 'Member',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
        status: 'pending',
        modules: [],
        groups: [],
    },
];

export const teamGroups: TeamGroup[] = [
    {
        id: 1,
        name: 'Sales Team',
        description: 'Customer-facing sales representatives',
        color: 'blue',
        memberIds: [2, 4],
        modules: ['CRM 360', 'Analytics Hub'],
    },
    {
        id: 2,
        name: 'Finance',
        description: 'Accounting and financial operations',
        color: 'green',
        memberIds: [3],
        modules: ['Invoice Pro', 'Analytics Hub'],
    },
    {
        id: 3,
        name: 'Leadership',
        description: 'Executive team and managers',
        color: 'purple',
        memberIds: [1],
        modules: ['All Modules'],
    },
];
