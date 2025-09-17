import React, { useState, useMemo } from 'react';
import type { ShoppingListItem, PantryItemGroup, Priority } from '../types';
import { AppView } from '../types';

interface ShoppingListProps {
  items: PantryItemGroup[];
  onNavigate: (view: AppView) => void;
}

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const colors = {
    'Alta': 'bg-red-100 text-red-800',
    'Média': 'bg-yellow-100 text-yellow-800', 
    'Baixa': 'bg-green-100 text-green-800'
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority]}`}>
      {priority}
    </span>
  );
};

const ReasonBadge: React.FC<{ reason: ShoppingListItem['reason'] }> = ({ reason }) => {
  const reasonMap = {
    'low_stock': { text: 'Estoque Baixo', color: 'bg-orange-100 text-orange-800' },
    'expired': { text: 'Vencido', color: 'bg-red-100 text-red-800' },
    'consumption_pattern': { text: 'Padrão de Consumo', color: 'bg-blue-100 text-blue-800' },
    'manual': { text: 'Manual', color: 'bg-gray-100 text-gray-800' }
  };
  
  const { text, color } = reasonMap[reason];
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
      {text}
    </span>
  );
};

const ShoppingListItemCard: React.FC<{ 
  item: ShoppingListItem; 
  onToggleCompleted: (id: string) => void;
  isCompleted: boolean;
}> = ({ item, onToggleCompleted, isCompleted }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 transition-all ${isCompleted ? 'opacity-50 bg-gray-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={() => onToggleCompleted(item.id)}
              className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <h3 className={`text-lg font-semibold ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {item.name}
            </h3>
          </div>
          
          <div className="ml-8 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Quantidade sugerida:</span>
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
                {item.suggestedQuantity}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <PriorityBadge priority={item.priority} />
              <ReasonBadge reason={item.reason} />
            </div>
            
            {item.estimatedNeed && (
              <div className="text-sm text-gray-500">
                Estimado para: {item.estimatedNeed} dias
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyShoppingList: React.FC = () => (
  <div className="text-center py-20 px-6 bg-white rounded-lg shadow">
    <div className="text-6xl mb-4">🛒</div>
    <h2 className="text-xl font-semibold text-slate-700 mb-2">Lista de compras vazia!</h2>
    <p className="text-slate-500 mb-6">
      Sugestões aparecerão aqui baseadas no seu padrão de consumo e estoque baixo.
    </p>
    <div className="text-sm text-slate-400">
      💡 Em breve: Sugestões inteligentes baseadas no seu histórico de consumo
    </div>
  </div>
);

export const ShoppingList: React.FC<ShoppingListProps> = ({ items, onNavigate }) => {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Generate smart shopping suggestions based on pantry state
  const shoppingListItems = useMemo((): ShoppingListItem[] => {
    const suggestions: ShoppingListItem[] = [];
    const now = new Date();

    // Generate suggestions based on current pantry state
    items.forEach(group => {
      let totalQuantity = 0;
      let hasExpiredItems = false;
      let hasExpiringSoonItems = false;
      
      group.instances.forEach(instance => {
        totalQuantity += instance.quantity;
        const expiryDate = new Date(instance.expiryDate);
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) hasExpiredItems = true;
        if (daysRemaining <= 3 && daysRemaining >= 0) hasExpiringSoonItems = true;
      });

      // Add to shopping list if low stock (quantity <= 2)
      if (totalQuantity <= 2 && totalQuantity > 0) {
        suggestions.push({
          id: `${group.id}-lowstock`,
          name: group.name,
          suggestedQuantity: 5,
          priority: group.priority,
          reason: 'low_stock',
          estimatedNeed: 7
        });
      }
      
      // Add to shopping list if expired items
      if (hasExpiredItems) {
        suggestions.push({
          id: `${group.id}-expired`,
          name: group.name,
          suggestedQuantity: 3,
          priority: 'Alta' as Priority,
          reason: 'expired',
          estimatedNeed: 1
        });
      }
    });

    // Add some example future consumption-based suggestions
    if (suggestions.length < 3) {
      suggestions.push(
        {
          id: 'suggestion-1',
          name: 'Leite',
          suggestedQuantity: 2,
          priority: 'Média' as Priority,
          reason: 'consumption_pattern',
          estimatedNeed: 3
        },
        {
          id: 'suggestion-2', 
          name: 'Pão',
          suggestedQuantity: 1,
          priority: 'Alta' as Priority,
          reason: 'consumption_pattern',
          estimatedNeed: 1
        }
      );
    }

    return suggestions;
  }, [items]);

  const filteredItems = useMemo(() => {
    return shoppingListItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [shoppingListItems, searchQuery]);

  const pendingItems = filteredItems.filter(item => !completedItems.has(item.id));
  const completedItemsList = filteredItems.filter(item => completedItems.has(item.id));

  const handleToggleCompleted = (id: string) => {
    const newCompletedItems = new Set(completedItems);
    if (completedItems.has(id)) {
      newCompletedItems.delete(id);
    } else {
      newCompletedItems.add(id);
    }
    setCompletedItems(newCompletedItems);
  };

  const clearCompleted = () => {
    setCompletedItems(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              🛒 Lista de Compras
            </h1>
            <p className="text-gray-600 mt-1">
              Sugestões inteligentes baseadas no seu estoque
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{pendingItems.length}</div>
            <div className="text-sm text-gray-500">itens pendentes</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar itens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyShoppingList />
      ) : (
        <div className="space-y-6">
          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 text-sm font-medium rounded-full">
                  {pendingItems.length}
                </span>
                Itens para comprar
              </h2>
              <div className="space-y-3">
                {pendingItems.map(item => (
                  <ShoppingListItemCard
                    key={item.id}
                    item={item}
                    onToggleCompleted={handleToggleCompleted}
                    isCompleted={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Items */}
          {completedItemsList.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 text-sm font-medium rounded-full">
                    {completedItemsList.length}
                  </span>
                  Itens comprados
                </h2>
                <button
                  onClick={clearCompleted}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Limpar comprados
                </button>
              </div>
              <div className="space-y-3">
                {completedItemsList.map(item => (
                  <ShoppingListItemCard
                    key={item.id}
                    item={item}
                    onToggleCompleted={handleToggleCompleted}
                    isCompleted={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Future Feature Notice */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <div>
            <h3 className="font-semibold text-purple-900">Em breve: Sugestões inteligentes!</h3>
            <p className="text-purple-700 text-sm">
              Implementaremos tracking de consumo para gerar sugestões baseadas no seu padrão de uso real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};