import { motion } from 'framer-motion';
import { TeamMember } from './types';

interface TeamStatsProps {
    members: TeamMember[];
}

export function TeamStats({ members }: TeamStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-5"
            >
                <p className="text-sm text-muted-foreground mb-1">Total Members</p>
                <p className="text-3xl font-bold text-foreground">{members.length}</p>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl border border-border p-5"
            >
                <p className="text-sm text-muted-foreground mb-1">Active</p>
                <p className="text-3xl font-bold text-emerald-600">
                    {members.filter((m) => m.status === 'active').length}
                </p>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl border border-border p-5"
            >
                <p className="text-sm text-muted-foreground mb-1">Pending Invites</p>
                <p className="text-3xl font-bold text-amber-500">
                    {members.filter((m) => m.status === 'pending').length}
                </p>
            </motion.div>
        </div>
    );
}
