import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PantryItemGroup, PantryItemInstance, NewPantryItem, Priority } from './types';
import { PantryList } from './components/PantryList';
import { ShoppingList } from './components/ShoppingList';
import { TabNavigation } from './components/TabNavigation';
import { AddReceiptView } from './components/AddReceiptView';
import { ManualAddItemView } from './components/ManualAddItemView';
import { Header } from './components/Header';
import { Auth } from './components/Auth';
import { AppView } from './types';
import { smartShoppingEngine } from './services/smartShoppingService';
import { supabase } from './services/supabaseClient';
import { normalizeProducts } from './services/productNormalizationService';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const getSoonestExpiryDate = (group: PantryItemGroup): string => {
  if (!group.instances || group.instances.length === 0) {
    return '9999-12-31';
  }
  return group.instances.reduce((soonest, current) => {
    return new Date(current.expiryDate) < new Date(soonest.expiryDate) ? current : soonest;
  }).expiryDate;
};


const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AppView>(AppView.Pantry);
  const [items, setItems] = useState<PantryItemGroup[]>([]);

  // Count shopping list suggestions (DEVE vir antes dos early returns)
  const shoppingListCount = useMemo(() => {
    let suggestions = 0;
    const now = new Date();

    items.forEach(group => {
      let totalQuantity = 0;
      let hasExpiredItems = false;
      
      group.instances.forEach(instance => {
        totalQuantity += instance.quantity;
        const expiryDate = new Date(instance.expiryDate);
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) hasExpiredItems = true;
      });

      // Count suggestions for low stock or expired items
      if (totalQuantity <= 2 && totalQuantity > 0) suggestions++;
      if (hasExpiredItems) suggestions++;
    });

    // Add base suggestions if needed
    if (suggestions < 2) suggestions += 2;
    
    return suggestions;
  }, [items]);

  // Carregar itens do Supabase ao iniciar
  useEffect(() => {
    const loadItemsFromSupabase = async () => {
      if (!user) return;

      try {
        console.log('📥 Carregando itens do Supabase...');
        
        const { data: purchases, error } = await supabase
          .from('purchases')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!purchases || purchases.length === 0) {
          console.log('📦 Nenhum item no banco de dados');
          setItems([]);
          return;
        }

        // Agrupar compras por produto
        const groupedItems: PantryItemGroup[] = [];
        purchases.forEach((purchase: any) => {
          const existingGroup = groupedItems.find(
            g => g.name.toLowerCase() === purchase.product_name.toLowerCase()
          );

          if (existingGroup) {
            // Adicionar instância ao grupo existente
            existingGroup.instances.push({
              id: purchase.id,
              quantity: purchase.quantity,
              expiryDate: purchase.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
          } else {
            // Criar novo grupo
            groupedItems.push({
              id: purchase.id,
              name: purchase.product_name,
              priority: 'Média' as Priority,
              instances: [{
                id: purchase.id,
                quantity: purchase.quantity,
                expiryDate: purchase.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              }]
            });
          }
        });

        // Ordenar por data de validade mais próxima
        const sortedItems = groupedItems.sort((a, b) => {
          const soonestA = new Date(getSoonestExpiryDate(a)).getTime();
          const soonestB = new Date(getSoonestExpiryDate(b)).getTime();
          return soonestA - soonestB;
        });

        setItems(sortedItems);
        console.log(`✅ ${sortedItems.length} produtos carregados do banco`);
      } catch (error) {
        console.error('❌ Erro ao carregar itens do Supabase:', error);
        setItems([]);
      }
    };

    loadItemsFromSupabase();
  }, [user]);

  const saveItems = useCallback((newItems: PantryItemGroup[]) => {
    const sortedItems = newItems.sort((a, b) => {
      const soonestA = new Date(getSoonestExpiryDate(a)).getTime();
      const soonestB = new Date(getSoonestExpiryDate(b)).getTime();
      return soonestA - soonestB;
    });
    setItems(sortedItems);
  }, []);

  const handleAddItems = async (newItems: NewPantryItem[], defaultPriority: Priority = 'Média' as Priority) => {
    console.log('🚀 Iniciando adição de produtos...');
    
    // 1. NORMALIZAR produtos com IA antes de processar
    const normalizedItems = await normalizeProducts(newItems, user!.id);
    
    console.log('📋 Produtos normalizados:', normalizedItems.map(p => 
      `"${p.originalName}" -> "${p.name}" ${p.isExisting ? '(EXISTENTE)' : '(NOVO)'}`
    ));
    
    const updatedPantry = [...items];

    normalizedItems.forEach(newItem => {
      const existingGroupIndex = updatedPantry.findIndex(
        group => group.name.trim().toLowerCase() === newItem.name.trim().toLowerCase()
      );

      if (existingGroupIndex > -1) {
        const existingGroup = updatedPantry[existingGroupIndex];
        const existingInstanceIndex = existingGroup.instances.findIndex(
          instance => instance.expiryDate === newItem.expiryDate
        );

        if (existingInstanceIndex > -1) {
          existingGroup.instances[existingInstanceIndex].quantity += newItem.quantity;
          console.log(`  ➕ Aumentou quantidade: ${newItem.name} (${existingGroup.instances[existingInstanceIndex].quantity})`);
        } else {
          existingGroup.instances.push({
            id: uuidv4(),
            quantity: newItem.quantity,
            expiryDate: newItem.expiryDate,
          });
          console.log(`  📦 Nova instância: ${newItem.name}`);
        }
      } else {
        updatedPantry.push({
          id: uuidv4(),
          name: newItem.name,
          priority: defaultPriority,
          instances: [{
            id: uuidv4(),
            quantity: newItem.quantity,
            expiryDate: newItem.expiryDate,
          }],
        });
        console.log(`  ✨ Novo produto: ${newItem.name}`);
      }
    });
    
    // 2. Registra as compras no sistema de ML para cada item NORMALIZADO
    const purchasePromises = normalizedItems.map(async (newItem) => {
      try {
        // 1. Registrar no Supabase
        const { error: supabaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: user!.id,
            product_name: newItem.name,
            quantity: newItem.quantity,
            purchase_date: new Date().toISOString(),
            expiry_date: newItem.expiryDate
          });

        if (supabaseError) {
          console.error('❌ Erro ao registrar compra no Supabase:', {
            error: supabaseError,
            message: supabaseError.message,
            details: supabaseError.details,
            hint: supabaseError.hint,
            code: supabaseError.code,
            produto: newItem
          });
          // Continua mesmo com erro - fallback para localStorage
        } else {
          console.log(`✅ Compra registrada no Supabase: ${newItem.name} (${newItem.quantity})`);
        }

        // 2. Registrar no sistema local (fallback)
        smartShoppingEngine.recordPurchase(newItem.name, newItem.quantity, newItem.expiryDate);
      } catch (error) {
        console.error('❌ Erro ao registrar compra:', error);
      }
    });

    // Aguardar todas as promises antes de continuar
    await Promise.all(purchasePromises);
    
    saveItems(updatedPantry);
    setView(AppView.Pantry);
  };

  const handleManualAddItem = (newItem: NewPantryItem & { priority: Priority }) => {
    handleAddItems([newItem], newItem.priority);
  };

  const handleUpdateGroup = async (updatedGroup: PantryItemGroup) => {
    const updatedItems = items.map(group => group.id === updatedGroup.id ? updatedGroup : group);
    saveItems(updatedItems);
    
    // TODO: Atualizar prioridade no banco se necessário
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!user) return;

    try {
      console.log('🗑️ Deletando grupo do banco...');
      
      // Deletar todas as compras do produto
      const groupToDelete = items.find(g => g.id === groupId);
      if (groupToDelete) {
        const { error } = await supabase
          .from('purchases')
          .delete()
          .eq('user_id', user.id)
          .eq('product_name', groupToDelete.name);

        if (error) {
          console.error('❌ Erro ao deletar do banco:', error);
        } else {
          console.log('✅ Grupo deletado do banco');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao deletar grupo:', error);
    }

    const updatedItems = items.filter(group => group.id !== groupId);
    saveItems(updatedItems);
  };

  const handleUpdateInstance = async (groupId: string, updatedInstance: PantryItemInstance) => {
    if (!user) return;

    try {
      console.log('🔄 Atualizando quantidade no banco...');
      
      // Atualizar quantidade no Supabase
      const { error } = await supabase
        .from('purchases')
        .update({ 
          quantity: updatedInstance.quantity,
          expiry_date: updatedInstance.expiryDate
        })
        .eq('id', updatedInstance.id);

      if (error) {
        console.error('❌ Erro ao atualizar no banco:', error);
      } else {
        console.log('✅ Quantidade atualizada no banco');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar instância:', error);
    }

    const updatedItems = items.map(group => {
        if (group.id === groupId) {
            const newInstances = group.instances.map(instance => 
                instance.id === updatedInstance.id ? updatedInstance : instance
            );
            return { ...group, instances: newInstances };
        }
        return group;
    });
    saveItems(updatedItems);
  };

  const handleDeleteInstance = async (groupId: string, instanceId: string) => {
    if (!user) return;

    try {
      console.log('🗑️ Deletando instância do banco...');
      
      // Deletar compra específica do Supabase
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', instanceId);

      if (error) {
        console.error('❌ Erro ao deletar instância do banco:', error);
      } else {
        console.log('✅ Instância deletada do banco');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar instância:', error);
    }

    const updatedItems: PantryItemGroup[] = [];
    items.forEach(group => {
        if (group.id === groupId) {
            const newInstances = group.instances.filter(instance => instance.id !== instanceId);
            // If there are instances left, update the group. Otherwise, the group is removed.
            if (newInstances.length > 0) {
                updatedItems.push({ ...group, instances: newInstances });
            }
        } else {
            updatedItems.push(group);
        }
    });
    saveItems(updatedItems);
  };

  // Early returns APÓS todos os hooks
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>🛒</div>
          <div style={{
            fontSize: '18px',
            color: '#6b7280'
          }}>Carregando...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }
  
  const renderView = () => {
    switch(view) {
      case AppView.Pantry:
        return (
          <PantryList
            items={items}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            onUpdateInstance={handleUpdateInstance}
            onDeleteInstance={handleDeleteInstance}
            onNavigate={setView}
          />
        );
      case AppView.Shopping:
        return (
          <ShoppingList
            items={items}
            onNavigate={setView}
          />
        );
      case AppView.AddReceipt:
        return (
          <AddReceiptView
            onAddItems={items => handleAddItems(items)}
            onBack={() => setView(AppView.Pantry)}
          />
        );
      case AppView.AddManual:
        return (
          <ManualAddItemView
            onAddItem={handleManualAddItem}
            onBack={() => setView(AppView.Pantry)}
          />
        );
      default:
        return <p>View not found</p>;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans text-slate-800">
      <Header />
      <main className="p-4 mx-auto max-w-7xl">
        {(view === AppView.Pantry || view === AppView.Shopping) && (
          <TabNavigation 
            activeView={view}
            onViewChange={setView}
            pantryItemCount={items.length}
            shoppingItemCount={shoppingListCount}
          />
        )}
        {renderView()}
      </main>
    </div>
  );
};

// Componente principal com Provider de autenticação
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
