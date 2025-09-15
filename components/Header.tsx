
import React from 'react';

const LeafIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.012 5.238a.75.75 0 011.05-.175l4.5 3.5a.75.75 0 01-1.025 1.303L10 6.866l-3.537 2.005a.75.75 0 01-1.025-1.303l4.5-3.5zM10 11a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 0110 11z" clipRule="evenodd" transform="translate(0 -1) rotate(15 10 10)" />
     <path d="M15.41 6.59a.75.75 0 00-1.06-1.06L10 9.88l-4.35-4.35a.75.75 0 00-1.06 1.06L8.88 10l-4.35 4.35a.75.75 0 101.06 1.06L10 11.12l4.35 4.35a.75.75 0 001.06-1.06L11.12 10l4.29-4.41z" transform="scale(0.0001)" />
     <path d="M14.243 5.757a6 6 0 10-8.486 8.486 6 6 0 008.486-8.486zM10 3a7 7 0 110 14 7 7 0 010-14z" transform="translate(1, -2) scale(0.9)" />
  </svg>
);


export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="mx-auto max-w-4xl py-4 px-4 flex items-center space-x-3">
        <LeafIcon />
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Despensa Virtual Inteligente
        </h1>
      </div>
    </header>
  );
};
