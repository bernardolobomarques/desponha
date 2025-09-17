import React, { useState, useMemo } from 'react';
import type { PantryItemGroup, PantryItemInstance } from '../types';
import { AppView } from '../types';
import { PantryItemCard } from './PantryItemCard';
import { Dashboard } from './Dashboard';
import { FloatingActionButton } from './FloatingActionButton';

interface PantryListProps {
  items: PantryItemGroup[];
  onUpdateGroup: (group: PantryItemGroup) => void;
  onDeleteGroup: (id: string) => void;
  onUpdateInstance: (groupId: string, instance: PantryItemInstance) => void;
  onDeleteInstance: (groupId: string, instanceId: string) => void;
  onNavigate: (view: AppView) => void;
}

type FilterType = 'all' | 'expiring' | 'expired';

const getSoonestDaysRemaining = (group: PantryItemGroup): number => {
    if (!group.instances || group.instances.length === 0) {
        return Infinity;
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const soonestInstance = group.instances.reduce((soonest, current) => 
        new Date(current.expiryDate) < new Date(soonest.expiryDate) ? current : soonest
    );
    const expiryDate = new Date(soonestInstance.expiryDate);
    return Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const EmptyState: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => (
    <div className="text-center py-20 px-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold text-slate-700">Sua despensa está vazia!</h2>
        <p className="text-slate-500 mt-2 mb-6">Comece adicionando itens a partir de uma nota fiscal ou manualmente.</p>
        <button
          onClick={() => onNavigate(AppView.AddReceipt)}
          className="inline-flex items-center gap-2 bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors shadow-lg"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Adicionar Itens
        </button>
    </div>
);

export const PantryList: React.FC<PantryListProps> = ({ items, onUpdateGroup, onDeleteGroup, onUpdateInstance, onDeleteInstance, onNavigate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const itemNameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (!itemNameMatch) return false;

            const daysRemaining = getSoonestDaysRemaining(item);
            
            if (activeFilter === 'expiring') return daysRemaining <= 3 && daysRemaining >= 0;
            if (activeFilter === 'expired') return daysRemaining < 0;
            return true;
        });
    }, [items, searchQuery, activeFilter]);

    const groupedItems = useMemo(() => {
        const groups: { expired: PantryItemGroup[], expiringSoon: PantryItemGroup[], other: PantryItemGroup[] } = {
            expired: [],
            expiringSoon: [],
            other: [],
        };

        filteredItems.forEach(item => {
            const daysRemaining = getSoonestDaysRemaining(item);
            if (daysRemaining < 0) {
                groups.expired.push(item);
            } else if (daysRemaining <= 3) {
                groups.expiringSoon.push(item);
            } else {
                groups.other.push(item);
            }
        });
        return groups;
    }, [filteredItems]);

    const toggleSection = (sectionName: string) => {
        setCollapsedSections(prev => ({...prev, [sectionName]: !prev[sectionName]}));
    };

    if (items.length === 0) {
        return <EmptyState onNavigate={onNavigate} />;
    }

    const renderItemGroup = (title: string, groupItems: PantryItemGroup[], colorClass: string, sectionKey: string) => {
        if (groupItems.length === 0) return null;
        const isCollapsed = collapsedSections[sectionKey];
        return (
            <div className="mb-8">
                <button onClick={() => toggleSection(sectionKey)} className="w-full text-left">
                    <div className="flex justify-between items-center mb-4 border-b-2 pb-2" >
                        <h2 className={`text-xl font-bold ${colorClass}`}>{title} ({groupItems.length})</h2>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </button>
                {!isCollapsed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupItems.map(item => (
                            <PantryItemCard 
                                key={item.id} 
                                item={item} 
                                onUpdateGroup={onUpdateGroup}
                                onDeleteGroup={onDeleteGroup}
                                onUpdateInstance={onUpdateInstance}
                                onDeleteInstance={onDeleteInstance}
                             />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    const FilterButton: React.FC<{ filterType: FilterType; text: string; }> = ({ filterType, text }) => (
        <button
            onClick={() => setActiveFilter(filterType)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeFilter === filterType ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
            {text}
        </button>
    );

    return (
        <div className="relative">
            <Dashboard items={items} />

            <div className="my-6 p-4 bg-white rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Pesquisar itens..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        aria-label="Pesquisar itens na despensa"
                    />
                    <div className="flex items-center gap-2">
                        <FilterButton filterType="all" text="Todos" />
                        <FilterButton filterType="expiring" text="Vencendo" />
                        <FilterButton filterType="expired" text="Vencidos" />
                    </div>
                </div>
            </div>

            {renderItemGroup('Vencidos', groupedItems.expired, 'text-red-600', 'expired')}
            {renderItemGroup('Vencendo em Breve', groupedItems.expiringSoon, 'text-orange-600', 'expiringSoon')}
            {renderItemGroup('Demais Itens', groupedItems.other, 'text-slate-700', 'other')}

            <FloatingActionButton
                onAddReceipt={() => onNavigate(AppView.AddReceipt)}
                onAddManual={() => onNavigate(AppView.AddManual)}
            />
        </div>
    );
};
