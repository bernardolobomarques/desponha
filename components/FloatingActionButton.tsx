import React, { useState } from 'react';

interface FloatingActionButtonProps {
    onAddReceipt: () => void;
    onAddManual: () => void;
}

const ReceiptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ManualIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onAddReceipt, onAddManual }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => setIsOpen(!isOpen);

    const handleOptionClick = (action: () => void) => {
        action();
        setIsOpen(false);
    }

    return (
        <div className="fixed bottom-6 right-6 z-30">
            <div className="relative flex flex-col items-center gap-3">
                {isOpen && (
                    <>
                        <div className="flex items-center gap-3 fab-option" style={{ animationDelay: '0.1s' }}>
                            <span className="bg-white text-sm text-slate-700 px-3 py-1 rounded-md shadow-sm">Adicionar Manualmente</span>
                            <button onClick={() => handleOptionClick(onAddManual)} className="bg-white text-slate-700 h-14 w-14 flex items-center justify-center rounded-full shadow-lg hover:bg-slate-100 transition-colors">
                                <ManualIcon />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 fab-option" style={{ animationDelay: '0s' }}>
                            <span className="bg-white text-sm text-slate-700 px-3 py-1 rounded-md shadow-sm">Adicionar via Nota Fiscal</span>
                            <button onClick={() => handleOptionClick(onAddReceipt)} className="bg-white text-slate-700 h-14 w-14 flex items-center justify-center rounded-full shadow-lg hover:bg-slate-100 transition-colors">
                                <ReceiptIcon />
                            </button>
                        </div>
                    </>
                )}
                <button
                    onClick={toggle}
                    className="bg-green-500 text-white h-16 w-16 flex items-center justify-center rounded-full shadow-xl hover:bg-green-600 transition-all duration-300 transform hover:rotate-90"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    aria-label="Adicionar Itens"
                >
                    <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180 scale-0' : 'rotate-0 scale-100'}`}>
                        <PlusIcon />
                    </div>
                     <div className={`absolute transition-transform duration-300 ${isOpen ? 'rotate-0 scale-100' : '-rotate-180 scale-0'}`}>
                        <CloseIcon />
                    </div>
                </button>
            </div>
             {isOpen && <div className="fixed inset-0 bg-black/20 z-[-1]" onClick={toggle}></div>}
        </div>
    );
};
