import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PantryItem, NewPantryItem, Priority } from './types';
import { PantryList } from './components/PantryList';
import { AddReceiptView } from './components/AddReceiptView';
import { Header } from './components/Header';
import { AppView } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.List);
  const [items, setItems] = useState<PantryItem[]>([]);

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

  const saveItems = useCallback((newItems: PantryItem[]) => {
    try {
      const sortedItems = newItems.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
      localStorage.setItem('pantryItems', JSON.stringify(sortedItems));
      setItems(sortedItems);
    } catch (error) {
      console.error("Failed to save items to localStorage", error);
    }
  }, []);

  const handleAddItems = (newItems: NewPantryItem[]) => {
    const updatedPantry = [...items];
    const itemsToAdd: PantryItem[] = [];

    newItems.forEach(newItem => {
      const existingItemIndex = updatedPantry.findIndex(
        pantryItem => pantryItem.name.trim().toLowerCase() === newItem.name.trim().toLowerCase()
      );

      if (existingItemIndex > -1) {
        // Item exists, update quantity and expiry date
        const existingItem = updatedPantry[existingItemIndex];
        existingItem.quantity += newItem.quantity;
        // Keep the newer expiry date
        if (new Date(newItem.expiryDate) > new Date(existingItem.expiryDate)) {
          existingItem.expiryDate = newItem.expiryDate;
        }
      } else {
        // Item is new, queue for addition
        itemsToAdd.push({
          ...newItem,
          id: uuidv4(),
          priority: 'Média' as Priority,
        });
      }
    });
    
    const finalItems = [...updatedPantry, ...itemsToAdd];
    saveItems(finalItems);
    setView(AppView.List);
  };

  const handleUpdateItem = (updatedItem: PantryItem) => {
    const updatedItems = items.map(item => item.id === updatedItem.id ? updatedItem : item);
    saveItems(updatedItems);
  };

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    saveItems(updatedItems);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header />
      <main className="p-4 mx-auto max-w-4xl">
        {view === AppView.List && (
          <PantryList
            items={items}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onNavigateToAdd={() => setView(AppView.AddReceipt)}
          />
        )}
        {view === AppView.AddReceipt && (
          <AddReceiptView
            onAddItems={handleAddItems}
            onBack={() => setView(AppView.List)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
