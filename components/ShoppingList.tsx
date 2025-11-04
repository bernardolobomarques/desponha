import React, { useState, useMemo, useEffect } from 'react';
import type { ShoppingListItem, PantryItemGroup } from '../types';
import { AppView, Priority } from '../types';
import { smartShoppingEngine } from '../services/smartShoppingService';
import { supabase } from '../services/supabaseClient';
import { MLStats } from './MLStats';

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
  onRemove?: (itemName: string) => void;
  isCompleted: boolean;
}> = ({ item, onToggleCompleted, onRemove, isCompleted }) => {
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
            {item.reason === 'manual' && onRemove && (
              <button
                onClick={() => onRemove(item.name)}
                className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                title="Remover item manual"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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
  const [manualItems, setManualItems] = useState<string[]>([]);
  const [newItemName, setNewItemName] = useState('');

  // Generate smart shopping suggestions using ML engine + Supabase
  const [shoppingListItems, setShoppingListItems] = useState<ShoppingListItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Load suggestions when items or manual items change
  useEffect(() => {
    const loadSuggestions = async () => {
      setIsLoadingSuggestions(true);
      try {
        // 1. Buscar sugestões baseadas em padrões ML do Supabase
        const { data: mlSuggestions, error } = await supabase.rpc('get_shopping_suggestions', {
          p_user_id: 'user_123', // TODO: usar user ID real
          p_days_threshold: 7 // Sugerir produtos que precisam ser comprados nos próximos 7 dias (aumentado)
        });

        console.log('🔍 ML Suggestions from Supabase:', { mlSuggestions, error });

        const suggestions: ShoppingListItem[] = [];

        // Adicionar sugestões baseadas em ML
        if (!error && mlSuggestions && mlSuggestions.length > 0) {
          console.log(`✅ Found ${mlSuggestions.length} ML suggestions`);
          mlSuggestions.forEach((suggestion: any) => {
            suggestions.push({
              id: `ml-${suggestion.product_name}`,
              name: suggestion.product_name,
              suggestedQuantity: 1, // Pode ser ajustado baseado no histórico
              priority: (suggestion.days_until_needed <= 1 ? Priority.High : 
                       suggestion.days_until_needed <= 2 ? Priority.Medium : Priority.Low) as Priority,
              reason: 'consumption_pattern',
              estimatedNeed: suggestion.days_until_needed
            });
          });
        } else if (error) {
          console.error('❌ Supabase error:', error);
        } else {
          console.log('ℹ️ No ML suggestions found (banco vazio ou nenhum produto próximo do threshold)');
        }

        // 2. Adicionar sugestões baseadas em estoque baixo (fallback local)
        items.forEach(group => {
          const totalQuantity = group.instances.reduce((sum, inst) => sum + inst.quantity, 0);
          
          // Evitar duplicatas de sugestões ML
          const alreadySuggestedByML = suggestions.some(s => 
            s.name.toLowerCase() === group.name.toLowerCase()
          );
          
          if (totalQuantity <= 2 && totalQuantity > 0 && !alreadySuggestedByML) {
            suggestions.push({
              id: `${group.id}-lowstock`,
              name: group.name,
              suggestedQuantity: 3,
              priority: group.priority,
              reason: 'low_stock',
              estimatedNeed: 7
            });
          }
        });

        // 3. Adicionar itens manuais
        manualItems.forEach(itemName => {
          const alreadyInList = suggestions.some(s => 
            s.name.toLowerCase() === itemName.toLowerCase()
          );
          
          if (!alreadyInList) {
            suggestions.push({
              id: `manual-${itemName}`,
              name: itemName,
              suggestedQuantity: 1,
              priority: Priority.Medium,
              reason: 'manual'
            });
          }
        });

        console.log(`📋 Total suggestions generated: ${suggestions.length}`, suggestions);
        
        setShoppingListItems(suggestions);
      } catch (error) {
        console.error('❌ Erro ao gerar lista inteligente:', error);
        
        // Fallback para sugestões básicas em caso de erro
        const basicSuggestions: ShoppingListItem[] = [];
        items.forEach(group => {
          const totalQuantity = group.instances.reduce((sum, inst) => sum + inst.quantity, 0);
          
          if (totalQuantity <= 2 && totalQuantity > 0) {
            basicSuggestions.push({
              id: `${group.id}-lowstock`,
              name: group.name,
              suggestedQuantity: 3,
              priority: group.priority,
              reason: 'low_stock',
              estimatedNeed: 7
            });
          }
        });
        
        setShoppingListItems(basicSuggestions);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    loadSuggestions();
  }, [items, manualItems]);

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

  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() && !manualItems.includes(newItemName.trim())) {
      setManualItems(prev => [...prev, newItemName.trim()]);
      setNewItemName('');
    }
  };

  const handleRemoveManualItem = (itemToRemove: string) => {
    setManualItems(prev => prev.filter(item => item !== itemToRemove));
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

        {/* Add Manual Item */}
        <form onSubmit={handleAddManualItem} className="flex gap-2">
          <input
            type="text"
            placeholder="Adicionar item manualmente..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newItemName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>+</span>
            Adicionar
          </button>
        </form>
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
                    onRemove={item.reason === 'manual' ? handleRemoveManualItem : undefined}
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
                    onRemove={item.reason === 'manual' ? handleRemoveManualItem : undefined}
                    isCompleted={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ML Stats */}
      <MLStats />
    </div>
  );
};