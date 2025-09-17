import React, { useState, useCallback } from 'react';
import { parseReceipt } from '../services/geminiService';
import { parseReceiptWithMistral } from '../services/mistralOCRService';
import { parseReceiptWithOpenAI } from '../services/openaiService';
import type { NewPantryItem, AIParsedItem } from '../types';
import { ConfirmationStep } from './ConfirmationStep';
import { Spinner } from './ui/Spinner';
import { CameraCapture } from './CameraCapture';

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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [useOCR, setUseOCR] = useState<'gemini' | 'mistral' | 'openai'>('openai');

  const processImageFile = useCallback(async (file: File) => {
    setState('loading');
    setError(null);
    setIsCameraOpen(false);

    let messageIndex = 0;
    const intervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
    }, 2500);

    try {
      let items: AIParsedItem[];
      if (useOCR === 'gemini') {
        items = await parseReceipt(file);
      } else if (useOCR === 'mistral') {
        items = await parseReceiptWithMistral(file);
      } else {
        items = await parseReceiptWithOpenAI(file);
      }
      setParsedItems(items);
      setState('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      setState('error');
    } finally {
        clearInterval(intervalId);
    }
  }, [useOCR]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };
  
  const reset = () => {
    setState('idle');
    setError(null);
    setParsedItems([]);
  }

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Adicionar via Nota Fiscal</h2>
          <button onClick={onBack} className="text-sm text-slate-600 hover:text-slate-900">&larr; Voltar para a lista</button>
        </div>

        {state === 'idle' && (
          <div>
            <p className="text-slate-600 mb-4">Envie uma foto clara da sua nota fiscal. A nossa I.A. irá extrair os itens para você.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Serviço de OCR:</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ocr-service"
                    value="openai"
                    checked={useOCR === 'openai'}
                    onChange={(e) => setUseOCR(e.target.value as 'gemini' | 'mistral' | 'openai')}
                    className="mr-2"
                  />
                  <span className="text-sm">OpenAI Vision (Recomendado)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ocr-service"
                    value="gemini"
                    checked={useOCR === 'gemini'}
                    onChange={(e) => setUseOCR(e.target.value as 'gemini' | 'mistral' | 'openai')}
                    className="mr-2"
                  />
                  <span className="text-sm">Google Gemini</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ocr-service"
                    value="mistral"
                    checked={useOCR === 'mistral'}
                    onChange={(e) => setUseOCR(e.target.value as 'gemini' | 'mistral' | 'openai')}
                    className="mr-2"
                  />
                  <span className="text-sm">Mistral OCR</span>
                </label>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center space-y-4">
                <label className="block">
                    <span className="sr-only">Escolha um arquivo</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
                </label>
                <div className="flex items-center text-slate-400">
                    <hr className="flex-grow border-t" />
                    <span className="px-2 text-sm">OU</span>
                    <hr className="flex-grow border-t" />
                </div>
                 <button onClick={() => setIsCameraOpen(true)} className="w-full inline-flex items-center justify-center gap-2 bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                    Tirar Foto
                </button>
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
      {isCameraOpen && <CameraCapture onCapture={processImageFile} onClose={() => setIsCameraOpen(false)} />}
    </>
  );
};
