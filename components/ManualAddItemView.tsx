import React, { useState } from 'react';
import type { NewPantryItem } from '../types';
import { Priority } from '../types';
import { standardizeProductName } from '../services/openaiService';

interface ManualAddItemViewProps {
  onAddItem: (item: NewPantryItem & { priority: Priority }) => void;
  onBack: () => void;
}

export const ManualAddItemView: React.FC<ManualAddItemViewProps> = ({ onAddItem, onBack }) => {
    const [name, setName] = useState('');
    const [standardizedName, setStandardizedName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [expiryDate, setExpiryDate] = useState('');
    const [priority, setPriority] = useState<Priority>(Priority.Medium);
    const [isStandardizing, setIsStandardizing] = useState(false);

    const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        
        // Auto-padronizar quando o usuário parar de digitar
        if (newName.trim().length > 2) {
            setIsStandardizing(true);
            try {
                const standardized = await standardizeProductName(newName);
                setStandardizedName(standardized);
            } catch (error) {
                setStandardizedName(newName);
            } finally {
                setIsStandardizing(false);
            }
        } else {
            setStandardizedName('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalQuantity = parseFloat(quantity.replace(',', '.')) || 0;
        const finalName = standardizedName || name;
        
        if (finalName.trim() && finalQuantity > 0 && expiryDate) {
            onAddItem({
                name: finalName.trim(),
                quantity: finalQuantity,
                expiryDate,
                priority,
            });
        }
    };
    
    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^[0-9]*[,]?[0-9]*$/.test(value)) {
            setQuantity(value);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Adicionar Item Manualmente</h2>
                <button onClick={onBack} className="text-sm text-slate-600 hover:text-slate-900">&larr; Voltar para a lista</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nome do Item</label>
                    <input 
                        type="text" 
                        id="name" 
                        value={name} 
                        onChange={handleNameChange} 
                        required 
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                        placeholder="Ex: ag mineral, refrig coca, biscoito..."
                    />
                    {isStandardizing && (
                        <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            Padronizando nome...
                        </div>
                    )}
                    {standardizedName && standardizedName !== name && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                            <span className="text-sm text-green-800">
                                <strong>Sugestão:</strong> {standardizedName}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setName(standardizedName);
                                    setStandardizedName('');
                                }}
                                className="ml-2 text-xs text-green-600 underline hover:text-green-800"
                            >
                                Usar sugestão
                            </button>
                        </div>
                    )}
                </div>
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Quantidade</label>
                    <input type="text" inputMode="decimal" id="quantity" value={quantity} onChange={handleQuantityChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-slate-700">Data de Validade</label>
                    <input type="date" id="expiryDate" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-slate-700">Prioridade</label>
                    <select id="priority" value={priority} onChange={e => setPriority(e.target.value as Priority)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="pt-4">
                    <button type="submit" className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        Salvar Item
                    </button>
                </div>
            </form>
        </div>
    );
};
