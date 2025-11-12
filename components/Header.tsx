
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const PantryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);


export const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
      <div className="mx-auto max-w-4xl py-4 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PantryIcon />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Despensa Virtual Inteligente
          </h1>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
