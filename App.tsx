import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PantryItemGroup, PantryItemInstance, NewPantryItem, Priority } from './types';
import { PantryList } from './components/PantryList';
import { AddReceiptView } from './components/AddReceiptView';
import { ManualAddItemView } from './components/ManualAddItemView';
import { Header } from './components/Header';
import { AppView } from './types';

const getSoonestExpiryDate = (group: PantryItemGroup): string => {
  if (!group.instances || group.instances.length === 0) {
    return '9999-12-31';
  }
  return group.instances.reduce((soonest, current) => {
    return new Date(current.expiryDate) < new Date(soonest.expiryDate) ? current : soonest;
  }).expiryDate;
};


const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.List);
  const [items, setItems] = useState<PantryItemGroup[]>([]);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem('pantryItems');
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to load items from localStorage", error);
      setItems([]);
    }
  }, []);

  const saveItems = useCallback((newItems: PantryItemGroup[]) => {
    try {
      const sortedItems = newItems.sort((a, b) => {
        const soonestA = new Date(getSoonestExpiryDate(a)).getTime();
        const soonestB = new Date(getSoonestExpiryDate(b)).getTime();
        return soonestA - soonestB;
      });
      localStorage.setItem('pantryItems', JSON.stringify(sortedItems));
      setItems(sortedItems);
    } catch (error)
      {
      console.error("Failed to save items to localStorage", error);
    }
  }, []);

  const handleAddItems = (newItems: NewPantryItem[], defaultPriority: Priority = 'Média' as Priority) => {
    const updatedPantry = [...items];

    newItems.forEach(newItem => {
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
        } else {
          existingGroup.instances.push({
            id: uuidv4(),
            quantity: newItem.quantity,
            expiryDate: newItem.expiryDate,
          });
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
      }
    });
    
    saveItems(updatedPantry);
    setView(AppView.List);
  };

  const handleManualAddItem = (newItem: NewPantryItem & { priority: Priority }) => {
    handleAddItems([newItem], newItem.priority);
  };

  const handleUpdateGroup = (updatedGroup: PantryItemGroup) => {
    const updatedItems = items.map(group => group.id === updatedGroup.id ? updatedGroup : group);
    saveItems(updatedItems);
  };

  const handleDeleteGroup = (groupId: string) => {
    const updatedItems = items.filter(group => group.id !== groupId);
    saveItems(updatedItems);
  };

  const handleUpdateInstance = (groupId: string, updatedInstance: PantryItemInstance) => {
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

  const handleDeleteInstance = (groupId: string, instanceId: string) => {
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
  
  const renderView = () => {
    switch(view) {
      case AppView.List:
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
      case AppView.AddReceipt:
        return (
          <AddReceiptView
            onAddItems={items => handleAddItems(items)}
            onBack={() => setView(AppView.List)}
          />
        );
      case AppView.AddManual:
        return (
          <ManualAddItemView
            onAddItem={handleManualAddItem}
            onBack={() => setView(AppView.List)}
          />
        );
      default:
        return <p>View not found</p>;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header />
      <main className="p-4 mx-auto max-w-4xl">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
