import React, { useState, useEffect, useMemo } from 'react';
import type { PantryItemGroup, PantryItemInstance } from '../types';
import { Priority } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface PantryItemCardProps {
  item: PantryItemGroup;
  onUpdateGroup: (item: PantryItemGroup) => void;
  onDeleteGroup: (id: string) => void;
  onUpdateInstance: (groupId: string, instance: PantryItemInstance) => void;
  onDeleteInstance: (groupId: string, instanceId: string) => void;
}

const priorityColors = {
  [Priority.High]: 'border-red-500 bg-red-50',
  [Priority.Medium]: 'border-yellow-500 bg-yellow-50',
  [Priority.Low]: 'border-green-500 bg-green-50',
};

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const CancelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;


const getDaysRemaining = (expiryDate: string): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const formatQuantity = (q: number) => String(q).replace('.', ',');

const InstanceRow: React.FC<{
    instance: PantryItemInstance;
    groupId: string;
    onUpdateInstance: (groupId: string, instance: PantryItemInstance) => void;
    onDeleteInstance: (groupId: string, instanceId: string) => void;
}> = ({ instance, groupId, onUpdateInstance, onDeleteInstance }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedInstance, setEditedInstance] = useState(instance);
    const [quantityInput, setQuantityInput] = useState(formatQuantity(instance.quantity));

    const handleSave = () => {
        const finalQuantity = parseFloat(quantityInput.replace(',', '.')) || 0;
        if (finalQuantity > 0) {
            onUpdateInstance(groupId, { ...editedInstance, quantity: finalQuantity });
            setIsEditing(false);
        } else {
            // Auto-delete if quantity is 0
            onDeleteInstance(groupId, instance.id);
        }
    };

    const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^[0-9]*[,]?[0-9]*$/.test(value)) {
            setQuantityInput(value);
        }
    };

    const daysRemaining = getDaysRemaining(instance.expiryDate);
    const isExpired = daysRemaining < 0;

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                <input type="text" inputMode="decimal" value={quantityInput} onChange={handleQuantityInputChange} className="w-1/4 p-1 border rounded text-sm"/>
                <input type="date" value={editedInstance.expiryDate} onChange={e => setEditedInstance({...editedInstance, expiryDate: e.target.value})} className="flex-grow p-1 border rounded text-sm"/>
                <button onClick={handleSave} className="text-green-600 hover:text-green-700"><SaveIcon /></button>
                <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-700"><CancelIcon /></button>
            </div>
        );
    }
    
    return (
        <div className="flex justify-between items-center p-2 group hover:bg-slate-50 rounded">
            <div className="text-sm text-slate-700">
                <span>Qtd: {formatQuantity(instance.quantity)}</span>
                <span className="mx-2">|</span>
                <span className={isExpired ? 'text-red-600 font-semibold' : ''}>
                    {isExpired ? `Venceu há ${Math.abs(daysRemaining)} dias` : `Vence em ${daysRemaining} dias`}
                </span>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-700"><EditIcon /></button>
                <button onClick={() => onDeleteInstance(groupId, instance.id)} className="text-red-500 hover:text-red-700"><DeleteIcon /></button>
            </div>
        </div>
    )
}


export const PantryItemCard: React.FC<PantryItemCardProps> = ({ item, onUpdateGroup, onDeleteGroup, onUpdateInstance, onDeleteInstance }) => {
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editedGroup, setEditedGroup] = useState(item);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const soonestExpiryDays = useMemo(() => {
    if (item.instances.length === 0) return Infinity;
    const soonestDate = item.instances.reduce((soonest, current) => 
        new Date(current.expiryDate) < new Date(soonest.expiryDate) ? current : soonest
    ).expiryDate;
    return getDaysRemaining(soonestDate);
  }, [item.instances]);
  
  const handleSaveGroup = () => {
    onUpdateGroup(editedGroup);
    setIsEditingGroup(false);
  };
  
  const confirmDeleteGroup = () => {
      onDeleteGroup(item.id);
      setIsDeleteModalOpen(false);
  }

  const isExpiringSoon = soonestExpiryDays <= 3 && soonestExpiryDays >= 0;
  const isExpired = soonestExpiryDays < 0;
  
  const baseClasses = "bg-white p-4 rounded-lg shadow-sm border-l-4 transition-shadow hover:shadow-md flex flex-col";
  const priorityClass = priorityColors[item.priority];
  const expiringClass = isExpiringSoon ? 'bg-orange-50 border-orange-500' : isExpired ? 'bg-red-100 border-red-500 opacity-90' : priorityClass;

  return (
    <>
      <div className={`${baseClasses} ${expiringClass}`}>
        {isEditingGroup ? (
             <div className="space-y-2 mb-2">
                 <input type="text" value={editedGroup.name} onChange={e => setEditedGroup({...editedGroup, name: e.target.value})} className="w-full p-2 border rounded font-bold text-lg"/>
                 <select value={editedGroup.priority} onChange={e => setEditedGroup({...editedGroup, priority: e.target.value as Priority})} className="w-full p-2 border rounded">
                     {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
                 <div className="flex justify-end gap-2">
                     <button onClick={() => setIsEditingGroup(false)} className="px-3 py-1 rounded text-sm text-slate-600 bg-slate-100 hover:bg-slate-200">Cancelar</button>
                     <button onClick={handleSaveGroup} className="px-3 py-1 rounded text-sm text-white bg-blue-500 hover:bg-blue-600">Salvar</button>
                 </div>
             </div>
        ) : (
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-slate-800 pr-2">{item.name}</h3>
              <div className="flex items-center gap-2 text-slate-500">
                <button onClick={() => setIsEditingGroup(true)} className="hover:text-blue-500"><EditIcon /></button>
                <button onClick={() => setIsDeleteModalOpen(true)} className="hover:text-red-500"><DeleteIcon /></button>
              </div>
            </div>
        )}
        
        <div className="flex-grow space-y-1 border-t border-slate-200/80 pt-2">
            {item.instances
                .sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                .map(instance => (
                    <InstanceRow 
                        key={instance.id} 
                        instance={instance} 
                        groupId={item.id} 
                        onUpdateInstance={onUpdateInstance} 
                        onDeleteInstance={onDeleteInstance}
                    />
            ))}
        </div>
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteGroup}
        title="Confirmar Exclusão do Grupo"
        message={`Tem certeza que deseja excluir "${item.name}" e todas as suas entradas da despensa? Esta ação não pode ser desfeita.`}
        confirmText="Excluir Grupo"
      />
    </>
  );
};
