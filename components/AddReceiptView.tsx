import React, { useState, useCallback } from 'react';
import { parseReceipt } from '../services/geminiService';
import type { NewPantryItem, AIParsedItem } from '../types';
import { ConfirmationStep } from './ConfirmationStep';
import { Spinner } from './ui/Spinner';

interface AddReceiptViewProps {
  onAddItems: (items: NewPantryItem[]) => void;
  onBack: () => void;
}

type ViewState = 'idle' | 'loading' | 'confirm' | 'error';

const loadingMessages = [
  "Analisando sua nota fiscal...",
  "A I.A. está identificando e padronizando os itens...",
  "Estimando datas de validade...",
  "Quase pronto, organizando a lista...",
];

export const AddReceiptView: React.FC<AddReceiptViewProps> = ({ onAddItems, onBack }) => {
  const [state, setState] = useState<ViewState>('idle');
  const [parsedItems, setParsedItems] = useState<AIParsedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState('loading');
    setError(null);
    
    let messageIndex = 0;
    const intervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
    }, 2500);

    try {
      const items = await parseReceipt(file);
      setParsedItems(items);
      setState('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      setState('error');
    } finally {
        clearInterval(intervalId);
    }
  }, []);
  
  const reset = () => {
    setState('idle');
    setError(null);
    setParsedItems([]);
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Adicionar via Nota Fiscal</h2>
        <button onClick={onBack} className="text-sm text-slate-600 hover:text-slate-900">&larr; Voltar para a lista</button>
      </div>

      {state === 'idle' && (
        <div>
          <p className="text-slate-600 mb-4">Envie uma foto clara da sua nota fiscal. A nossa I.A. irá extrair os itens para você.</p>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
        </div>
      )}

      {state === 'loading' && (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <Spinner />
          <p className="text-slate-600 font-semibold">{loadingMessage}</p>
        </div>
      )}
      
      {state === 'error' && (
          <div className="text-center p-8">
              <p className="text-red-600 font-semibold mb-4">{error}</p>
              <button onClick={reset} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600">Tentar Novamente</button>
          </div>
      )}

      {state === 'confirm' && (
        <ConfirmationStep
          parsedItems={parsedItems}
          onConfirm={onAddItems}
        />
      )}
    </div>
  );
};
