import React, { useState, useEffect } from 'react';
import type { PantryItem } from '../types';
import { Priority } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface PantryItemCardProps {
  item: PantryItem;
  onUpdate: (item: PantryItem) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  [Priority.High]: 'border-red-500 bg-red-50',
  [Priority.Medium]: 'border-yellow-500 bg-yellow-50',
  [Priority.Low]: 'border-green-500 bg-green-50',
};

const priorityDotColors = {
  [Priority.High]: 'bg-red-500',
  [Priority.Medium]: 'bg-yellow-500',
  [Priority.Low]: 'bg-green-500',
};

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const WarningIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.22 3.006-1.742 3.006H4.42c-1.522 0-2.492-1.672-1.742-3.006l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;

export const PantryItemCard: React.FC<PantryItemCardProps> = ({ item, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(item);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [quantityInput, setQuantityInput] = useState('');

  useEffect(() => {
    if (isEditing) {
      setEditedItem(item);
      setQuantityInput(String(item.quantity).replace('.', ','));
    }
  }, [isEditing, item]);

  const handleSave = () => {
    const finalQuantity = parseFloat(quantityInput.replace(',', '.')) || 0;
    onUpdate({ ...editedItem, quantity: finalQuantity });
    setIsEditing(false);
  };
  
  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow numbers and a single comma for decimal separation
    if (/^[0-9]*[,]?[0-9]*$/.test(value)) {
        setQuantityInput(value);
    }
  };

  const confirmDelete = () => {
    onDelete(item.id);
    setIsDeleteModalOpen(false);
  };

  const daysRemaining = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysRemaining <= 3 && daysRemaining >= 0;
  const isExpired = daysRemaining < 0;

  const baseClasses = "bg-white p-4 rounded-lg shadow-sm border-l-4 transition-shadow hover:shadow-md";
  const priorityClass = priorityColors[item.priority];
  const expiringClass = isExpiringSoon ? 'bg-orange-50 border-orange-500' : isExpired ? 'bg-red-100 border-red-500 opacity-70' : priorityClass;
  
  const formatQuantity = (q: number) => String(q).replace('.', ',');

  if (isEditing) {
    return (
      <div className={`${baseClasses} ${priorityClass}`}>
        <div className="space-y-3">
          <input type="text" value={editedItem.name} onChange={e => setEditedItem({...editedItem, name: e.target.value})} className="w-full p-2 border rounded" />
          <input 
            type="text" 
            inputMode="decimal"
            value={quantityInput}
            onChange={handleQuantityInputChange} 
            className="w-full p-2 border rounded" 
          />
          <input type="date" value={editedItem.expiryDate} onChange={e => setEditedItem({...editedItem, expiryDate: e.target.value})} className="w-full p-2 border rounded" />
          <select value={editedItem.priority} onChange={e => setEditedItem({...editedItem, priority: e.target.value as Priority})} className="w-full p-2 border rounded">
            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setIsEditing(false)} className="px-3 py-1 rounded text-sm text-slate-600 bg-slate-100 hover:bg-slate-200">Cancelar</button>
          <button onClick={handleSave} className="px-3 py-1 rounded text-sm text-white bg-blue-500 hover:bg-blue-600">Salvar</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${baseClasses} ${expiringClass}`}>
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-slate-800 pr-2">{item.name}</h3>
          <div className="flex items-center gap-2 text-slate-500">
            <button onClick={() => setIsEditing(true)} className="hover:text-blue-500"><EditIcon /></button>
            <button onClick={() => setIsDeleteModalOpen(true)} className="hover:text-red-500"><DeleteIcon /></button>
          </div>
        </div>
        <p className="text-slate-600 mt-1">Quantidade: {formatQuantity(item.quantity)}</p>
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${priorityDotColors[item.priority]}`}></span>
              <span className="font-medium text-slate-700">{item.priority}</span>
          </div>
          <div className={`font-semibold flex items-center gap-1 ${isExpired || isExpiringSoon ? 'text-orange-600' : 'text-slate-500'}`}>
              {(isExpiringSoon || isExpired) && <WarningIcon />}
              {isExpired ? `Venceu há ${Math.abs(daysRemaining)} dias` : `Vence em ${daysRemaining} dias`}
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir "${item.name}" da sua despensa? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </>
  );
};