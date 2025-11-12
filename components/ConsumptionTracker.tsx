import React, { useState } from 'react';
import { smartShoppingEngine } from '../services/smartShoppingService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface ConsumptionTrackerProps {
  itemName: string;
  currentQuantity: number;
  onConsumptionRecorded: (newQuantity: number) => void;
  onClose: () => void;
}

export const ConsumptionTracker: React.FC<ConsumptionTrackerProps> = ({
  itemName,
  currentQuantity,
  onConsumptionRecorded,
  onClose
}) => {
  const { user } = useAuth();
  const [consumedQuantity, setConsumedQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (consumedQuantity <= 0 || consumedQuantity > currentQuantity || !user) return;
    
    setIsSubmitting(true);
    
    try {
      const newQuantity = currentQuantity - consumedQuantity;
      
      // 1. Registra o consumo no Supabase
      const { error: supabaseError } = await supabase
        .from('consumption')
        .insert({
          user_id: user.id,
          product_name: itemName,
          quantity_consumed: consumedQuantity,
          remaining_quantity: newQuantity,
          consumption_date: new Date().toISOString()
        });

      if (supabaseError) {
        console.error('Erro ao registrar no Supabase:', supabaseError);
        // Continua mesmo com erro - fallback para localStorage
      }
      
      // 2. Registra o consumo no sistema inteligente local (fallback)
      smartShoppingEngine.recordConsumption(itemName, consumedQuantity, newQuantity);
      
      // 3. Notifica o componente pai
      onConsumptionRecorded(newQuantity);
      
      onClose();
    } catch (error) {
      console.error('Erro ao registrar consumo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidQuantity = consumedQuantity > 0 && consumedQuantity <= currentQuantity;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Registrar Consumo
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Item:</span> {itemName}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Quantidade atual:</span> {currentQuantity}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="consumed-quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade consumida:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConsumedQuantity(Math.max(1, consumedQuantity - 1))}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-medium"
                  disabled={consumedQuantity <= 1}
                >
                  -
                </button>
                <input
                  id="consumed-quantity"
                  type="number"
                  min="1"
                  max={currentQuantity}
                  value={consumedQuantity}
                  onChange={(e) => setConsumedQuantity(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setConsumedQuantity(Math.min(currentQuantity, consumedQuantity + 1))}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-medium"
                  disabled={consumedQuantity >= currentQuantity}
                >
                  +
                </button>
              </div>
              {!isValidQuantity && (
                <p className="mt-1 text-sm text-red-600">
                  Quantidade deve ser entre 1 e {currentQuantity}
                </p>
              )}
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Restará:</span> {currentQuantity - consumedQuantity}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!isValidQuantity || isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </form>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-sm">💡</span>
              <p className="text-xs text-blue-700">
                Registrar o consumo ajuda nossa IA a aprender seus hábitos e fazer sugestões mais precisas na lista de compras.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};