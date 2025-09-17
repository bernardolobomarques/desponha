import React, { useMemo } from 'react';
import type { PantryItemGroup } from '../types';

interface DashboardProps {
    items: PantryItemGroup[];
}

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-4 ${color}`}>
        <div className="text-3xl">{icon}</div>
        <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ items }) => {
    const stats = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let expiringSoon = 0;
        let expired = 0;
        let totalQuantity = 0;

        items.forEach(group => {
            group.instances.forEach(instance => {
                totalQuantity += instance.quantity;
                const expiryDate = new Date(instance.expiryDate);
                const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysRemaining < 0) {
                    expired++;
                } else if (daysRemaining <= 3) {
                    expiringSoon++;
                }
            });
        });

        return {
            total: totalQuantity,
            expiringSoon,
            expired,
        };
    }, [items]);
    
    // Format total to handle decimals gracefully
    const formattedTotal = Number.isInteger(stats.total) ? stats.total : stats.total.toFixed(2).replace('.', ',');

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total de Itens" value={formattedTotal} icon="📦" color="bg-blue-100 text-blue-800" />
            <StatCard title="Itens Vencendo" value={stats.expiringSoon} icon="⏳" color="bg-orange-100 text-orange-800" />
            <StatCard title="Itens Vencidos" value={stats.expired} icon="❗️" color="bg-red-100 text-red-800" />
        </div>
    );
};
