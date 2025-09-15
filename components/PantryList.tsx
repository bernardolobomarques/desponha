
import React from 'react';
import type { PantryItem } from '../types';
import { PantryItemCard } from './PantryItemCard';

interface PantryListProps {
  items: PantryItem[];
  onUpdateItem: (item: PantryItem) => void;
  onDeleteItem: (id: string) => void;
  onNavigateToAdd: () => void;
}

const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

export const PantryList: React.FC<PantryListProps> = ({ items, onUpdateItem, onDeleteItem, onNavigateToAdd }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-20 px-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold text-slate-700">Sua despensa está vazia!</h2>
        <p className="text-slate-500 mt-2 mb-6">Comece adicionando itens a partir de uma nota fiscal.</p>
        <button
          onClick={onNavigateToAdd}
          className="inline-flex items-center gap-2 bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors shadow-lg"
        >
          <AddIcon />
          Adicionar com Nota Fiscal
        </button>
      </div>
    );
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-700">Itens na Despensa ({items.length})</h2>
             <button
                onClick={onNavigateToAdd}
                className="inline-flex items-center gap-2 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors shadow-md"
            >
                <AddIcon />
                Adicionar Nota
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
            <PantryItemCard
                key={item.id}
                item={item}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
            />
            ))}
        </div>
    </div>
  );
};
