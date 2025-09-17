import React from 'react';
import { AppView } from '../types';

interface TabNavigationProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  pantryItemCount: number;
  shoppingItemCount: number;
}

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count?: number;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, icon, label, count }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg transition-all ${
        isActive 
          ? 'bg-blue-500 text-white shadow-lg transform scale-105' 
          : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
          isActive 
            ? 'bg-white/20 text-white' 
            : 'bg-blue-100 text-blue-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
};

export const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeView, 
  onViewChange, 
  pantryItemCount, 
  shoppingItemCount 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-2 mb-6">
      <div className="flex gap-2">
        <TabButton
          isActive={activeView === AppView.Pantry}
          onClick={() => onViewChange(AppView.Pantry)}
          icon="🏠"
          label="Despensa"
          count={pantryItemCount}
        />
        <TabButton
          isActive={activeView === AppView.Shopping}
          onClick={() => onViewChange(AppView.Shopping)}
          icon="🛒"
          label="Lista de Compras"
          count={shoppingItemCount}
        />
      </div>
    </div>
  );
};