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
  [Priority.High]: 'border-red-500 bg-gradient-to-br from-red-50 to-red-100',
  [Priority.Medium]: 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100',
  [Priority.Low]: 'border-green-500 bg-gradient-to-br from-green-50 to-green-100',
};

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const colors = {
    'Alta': 'bg-red-500 text-white',
    'Média': 'bg-yellow-500 text-white', 
    'Baixa': 'bg-green-500 text-white'
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-bold rounded-full ${colors[priority]}`}>
      {priority}
    </span>
  );
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
    const isExpiringSoon = daysRemaining <= 3 && daysRemaining >= 0;
    
    const handleCancel = () => {
        setEditedInstance(instance);
        setQuantityInput(formatQuantity(instance.quantity));
        setIsEditing(false);
    };
    
    const getExpiryStatus = () => {
        if (isExpired) return { 
            text: `Vencido há ${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'dia' : 'dias'}`, 
            color: 'text-red-700 bg-red-100 border-red-200',
            icon: '⚠️'
        };
        if (isExpiringSoon) return { 
            text: `${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} restante${daysRemaining === 1 ? '' : 's'}`, 
            color: 'text-orange-700 bg-orange-100 border-orange-200',
            icon: '⏰'
        };
        if (daysRemaining <= 7) return { 
            text: `${daysRemaining} dias`, 
            color: 'text-yellow-700 bg-yellow-100 border-yellow-200',
            icon: '📅'
        };
        return { 
            text: `${daysRemaining} dias`, 
            color: 'text-green-700 bg-green-100 border-green-200',
            icon: '✅'
        };
    };
    
    const expiryStatus = getExpiryStatus();

    return (
        <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
            isExpired ? 'bg-red-50 border-red-200' : 
            isExpiringSoon ? 'bg-orange-50 border-orange-200' : 
            'bg-white border-gray-200 hover:border-gray-300'
        }`}>
            {isEditing ? (
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 min-w-[40px]">Qtd:</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={quantityInput}
                            onChange={handleQuantityInputChange}
                            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Vence em:</span>
                        <input
                            type="date"
                            value={editedInstance.expiryDate}
                            onChange={e => setEditedInstance({...editedInstance, expiryDate: e.target.value})}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-2 ml-auto">
                        <button 
                            onClick={handleSave} 
                            className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                        >
                            <SaveIcon />
                            Salvar
                        </button>
                        <button 
                            onClick={handleCancel} 
                            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <CancelIcon />
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold text-gray-900">
                                {formatQuantity(instance.quantity)}
                            </div>
                            <div className="text-sm text-gray-500">
                                {instance.quantity === 1 ? 'unidade' : 'unidades'}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{expiryStatus.icon}</span>
                            <div className={`px-3 py-1 text-sm font-medium rounded-full border ${expiryStatus.color}`}>
                                {expiryStatus.text}
                            </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 font-medium">
                            {new Date(instance.expiryDate).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            })}
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar item"
                        >
                            <EditIcon />
                        </button>
                        <button 
                            onClick={() => onDeleteInstance(groupId, instance.id)} 
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir item"
                        >
                            <DeleteIcon />
                        </button>
                    </div>
                </>
            )}
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
  
  const getTotalQuantity = () => {
    return item.instances.reduce((total, instance) => total + instance.quantity, 0);
  };
  
  const baseClasses = "bg-white p-6 rounded-xl shadow-lg border transition-all hover:shadow-xl";
  const priorityClass = priorityColors[item.priority];
  const expiringClass = isExpiringSoon ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100' : 
                       isExpired ? 'border-red-400 bg-gradient-to-br from-red-50 to-red-100' : 
                       priorityClass;

  return (
    <>
      <div className={`${baseClasses} ${expiringClass}`}>
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {isEditingGroup ? (
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={editedGroup.name} 
                  onChange={e => setEditedGroup({...editedGroup, name: e.target.value})} 
                  className="w-full p-3 border border-gray-300 rounded-lg font-bold text-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome do item"
                />
                <select 
                  value={editedGroup.priority} 
                  onChange={e => setEditedGroup({...editedGroup, priority: e.target.value as Priority})} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setIsEditingGroup(false)} 
                    className="px-4 py-2 rounded-lg text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveGroup} 
                    className="px-4 py-2 rounded-lg text-sm text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-2xl text-gray-900 mr-4">{item.name}</h3>
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={item.priority} />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsEditingGroup(true)} 
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar grupo"
                      >
                        <EditIcon />
                      </button>
                      <button 
                        onClick={() => setIsDeleteModalOpen(true)} 
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir grupo"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Summary Stats */}
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-lg text-gray-900">{formatQuantity(getTotalQuantity())}</span>
                    <span>{getTotalQuantity() === 1 ? 'unidade' : 'unidades'} total</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{item.instances.length}</span>
                    <span>{item.instances.length === 1 ? 'lote' : 'lotes'}</span>
                  </div>
                  {(isExpired || isExpiringSoon) && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isExpired ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'
                    }`}>
                      {isExpired ? '⚠️ Itens vencidos' : '⏰ Vence em breve'}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Instances Section */}
        {!isEditingGroup && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
              Lotes individuais
            </h4>
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
        )}
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
