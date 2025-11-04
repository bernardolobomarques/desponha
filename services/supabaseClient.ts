/**
 * Supabase Client Configuration
 * 
 * Cliente para conexão com o banco de dados Supabase
 * Usado para armazenar e recuperar dados de ML
 */

import { createClient } from '@supabase/supabase-js';

// Busca variáveis de ambiente (Vite usa VITE_ como prefixo)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação das credenciais
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase não configurado. Variáveis de ambiente faltando.');
  console.warn('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
}

// Cria cliente Supabase
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Helper: Verifica se Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};

// Helper: Log de status
if (isSupabaseConfigured()) {
  console.log('✅ Supabase conectado com sucesso!');
} else {
  console.log('⚠️ Supabase não configurado - usando apenas localStorage');
}

// Tipos TypeScript para as tabelas
export interface Purchase {
  id?: string;
  user_id?: string;
  product_name: string;
  quantity: number;
  purchase_date?: string;
  expiry_date?: string;
  created_at?: string;
}

export interface Consumption {
  id?: string;
  user_id?: string;
  product_name: string;
  quantity_consumed: number;
  remaining_quantity: number;
  consumption_date?: string;
  created_at?: string;
}

export interface ConsumptionPattern {
  id?: string;
  user_id?: string;
  product_name: string;
  average_days_between_purchases?: number;
  last_purchase_date?: string;
  predicted_next_purchase_date?: string;
  days_until_next_purchase?: number;
  total_purchases?: number;
  total_consumed?: number;
  confidence_score?: number;
  updated_at?: string;
}

export interface ShoppingSuggestion {
  product_name: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  reason: string;
  days_until_needed: number;
  suggested_quantity: number;
  confidence: number;
}
