import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { NewPantryItem, AIParsedItem } from '../types';

interface ConfirmationStepProps {
  parsedItems: AIParsedItem[];
  onConfirm: (items: NewPantryItem[]) => void;
}

type EditableItem = Omit<AIParsedItem, 'quantity'> & { 
    tempId: string;
    quantity: string;
};

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ parsedItems, onConfirm }) => {
  const [items, setItems] = useState<EditableItem[]>(parsedItems.map(item => ({...item, tempId: uuidv4(), quantity: String(item.quantity).replace('.', ',')})));

  const handleItemChange = (tempId: string, field: 'standardizedName' | 'quantity' | 'expiryDate', value: string) => {
    setItems(currentItems =>
      currentItems.map(item => {
        if (item.tempId === tempId) {
            const newItem = { ...item };
            if (field === 'quantity') {
                if (/^[0-9]*[,]?[0-9]*$/.test(value)) {
                    newItem.quantity = value;
                }
            } else {
                newItem[field] = value;
            }
            return newItem;
        }
        return item;
      })
    );
  };
  
  const handleRemoveItem = (tempId: string) => {
      setItems(currentItems => currentItems.filter(item => item.tempId !== tempId));
  }

  const handleConfirm = () => {
    const finalItems: NewPantryItem[] = items.map(({ name, tempId, standardizedName, quantity, expiryDate }) => ({
        name: standardizedName,
        quantity: parseFloat(quantity.replace(',', '.')) || 0,
        expiryDate,
    }));
    onConfirm(finalItems);
  };

  return (
    <div>
      <h3 className="font-semibold text-lg mb-2">Confirme os Itens Encontrados</h3>
      <p className="text-slate-600 mb-4">Ajuste os nomes para padronizá-los e corrija as quantidades ou datas antes de adicionar.</p>
      
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {items.map((item) => (
          <div key={item.tempId} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-slate-200 last:border-b-0">
            <div className="col-span-5">
              <input type="text" value={item.standardizedName} onChange={(e) => handleItemChange(item.tempId, 'standardizedName', e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="Nome do Item"/>
            </div>
            <div className="col-span-2">
               <input 
                 type="text"
                 inputMode="decimal"
                 value={item.quantity} 
                 onChange={(e) => handleItemChange(item.tempId, 'quantity', e.target.value)} 
                 className="w-full p-2 border rounded text-sm"/>
            </div>
            <div className="col-span-4">
              <input type="date" value={item.expiryDate} onChange={(e) => handleItemChange(item.tempId, 'expiryDate', e.target.value)} className="w-full p-2 border rounded text-sm"/>
            </div>
             <div className="col-span-1 text-right">
                <button onClick={() => handleRemoveItem(item.tempId)} className="text-red-500 hover:text-red-700 p-1" aria-label={`Remover ${item.standardizedName}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                </button>
             </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6">
        <button
          onClick={handleConfirm}
          disabled={items.length === 0}
          className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          Adicionar {items.length} Itens à Despensa
        </button>
      </div>
    </div>
  );
};