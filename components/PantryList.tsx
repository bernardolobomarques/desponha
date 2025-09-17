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
    <div className="text-center py-20 px-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg border border-blue-200">
        <div className="text-8xl mb-6">🏠</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Sua despensa está vazia!</h2>
        <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
            Comece adicionando itens através da câmera para escanear notas fiscais ou adicione manualmente.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate(AppView.AddReceipt)}
              className="inline-flex items-center gap-3 bg-blue-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Escanear Nota Fiscal
            </button>
            <button
              onClick={() => onNavigate(AppView.AddManual)}
              className="inline-flex items-center gap-3 bg-gray-100 text-gray-700 font-semibold py-4 px-8 rounded-xl hover:bg-gray-200 transition-all border-2 border-gray-200 hover:border-gray-300"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Adicionar Manualmente
            </button>
        </div>
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

    const renderItemGroup = (title: string, groupItems: PantryItemGroup[], colorClass: string, sectionKey: string, icon: string) => {
        if (groupItems.length === 0) return null;
        const isCollapsed = collapsedSections[sectionKey];
        
        return (
            <div className="mb-8">
                <button 
                    onClick={() => toggleSection(sectionKey)} 
                    className="w-full text-left group hover:bg-gray-50 rounded-lg p-4 transition-colors"
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{icon}</span>
                            <h2 className={`text-xl font-bold ${colorClass}`}>
                                {title}
                            </h2>
                            <span className={`px-3 py-1 text-sm font-bold rounded-full bg-gray-100 ${colorClass}`}>
                                {groupItems.length}
                            </span>
                        </div>
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-6 w-6 transition-transform group-hover:scale-110 ${isCollapsed ? 'rotate-0' : 'rotate-180'} ${colorClass}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>
                {!isCollapsed && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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

    const FilterButton: React.FC<{ filterType: FilterType; text: string; count?: number }> = ({ filterType, text, count }) => (
        <button
            onClick={() => setActiveFilter(filterType)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all transform hover:scale-105 ${
                activeFilter === filterType 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
        >
            {text}
            {count !== undefined && count > 0 && (
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    activeFilter === filterType 
                        ? 'bg-white/20 text-white' 
                        : 'bg-blue-100 text-blue-600'
                }`}>
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="relative space-y-6">
            <Dashboard items={items} />

            {/* Search and Filter Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative w-full lg:flex-1">
                        <input
                            type="text"
                            placeholder="Pesquisar itens na despensa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-4 pl-12 pr-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                            aria-label="Pesquisar itens na despensa"
                        />
                        <svg 
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div className="flex items-center gap-3">
                        <FilterButton filterType="all" text="Todos" count={items.length} />
                        <FilterButton filterType="expiring" text="Vencendo" count={groupedItems.expiringSoon.length} />
                        <FilterButton filterType="expired" text="Vencidos" count={groupedItems.expired.length} />
                    </div>
                </div>
            </div>

            {/* Items Display */}
            <div className="space-y-6">
                {renderItemGroup('Itens Vencidos', groupedItems.expired, 'text-red-600', 'expired', '⚠️')}
                {renderItemGroup('Vencendo em Breve', groupedItems.expiringSoon, 'text-orange-600', 'expiringSoon', '⏰')}
                {renderItemGroup('Demais Itens', groupedItems.other, 'text-gray-700', 'other', '📦')}
            </div>

            <FloatingActionButton
                onAddReceipt={() => onNavigate(AppView.AddReceipt)}
                onAddManual={() => onNavigate(AppView.AddManual)}
            />
        </div>
    );
};
