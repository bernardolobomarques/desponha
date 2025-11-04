import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface PatternData {
  product_name: string;
  average_days: number;
  total_purchases: number;
  last_purchase: string;
  next_predicted: string;
}

export const MLStats: React.FC = () => {
  const [patterns, setPatterns] = useState<PatternData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');

  // Carregar padrões do banco
  const loadPatterns = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('v_patterns_summary')
        .select('*')
        .order('average_days', { ascending: true });

      if (error) throw error;
      setPatterns(data || []);
    } catch (error) {
      console.error('Erro ao carregar padrões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatterns();
  }, []);

  // Função para popular dados de teste
  const seedTestData = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.rpc('seed_test_data', {
        p_user_id: 'user_123'
      });

      if (error) throw error;
      setMessage('✅ Dados de teste inseridos com sucesso!');
      await loadPatterns();
    } catch (error: any) {
      setMessage(`❌ Erro: ${error.message}`);
      console.error('Erro ao popular dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para limpar todos os dados
  const clearAllData = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os dados do ML?')) return;
    
    setIsLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.rpc('clear_all_data', {
        p_user_id: 'user_123'
      });

      if (error) throw error;
      setMessage('✅ Todos os dados foram limpos!');
      await loadPatterns();
    } catch (error: any) {
      setMessage(`❌ Erro: ${error.message}`);
      console.error('Erro ao limpar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para recalcular padrões
  const recalculatePatterns = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.rpc('calculate_consumption_patterns', {
        p_user_id: 'user_123'
      });

      if (error) throw error;
      setMessage('✅ Padrões recalculados!');
      await loadPatterns();
    } catch (error: any) {
      setMessage(`❌ Erro: ${error.message}`);
      console.error('Erro ao recalcular:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (patterns.length === 0 && !isLoading) {
    return (
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <h4 className="font-medium text-blue-900 text-sm">Sistema ML Aguardando Dados</h4>
              <p className="text-blue-700 text-xs">
                Adicione produtos e registre consumos para ver os padrões!
              </p>
            </div>
          </div>
          <button
            onClick={seedTestData}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
          >
            📦 Popular Dados de Teste
          </button>
        </div>
        {message && (
          <div className="mt-2 text-xs text-blue-800">{message}</div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <div>
            <h4 className="font-medium text-green-900 text-sm">Sistema ML Ativo</h4>
            <div className="flex gap-3 text-xs text-green-700">
              <span>🎯 {patterns.length} padrões aprendidos</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
        >
          {isExpanded ? '▲ Fechar' : '▼ Ver Detalhes'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Botões de ação */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={loadPatterns}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
            >
              🔄 Atualizar
            </button>
            <button
              onClick={recalculatePatterns}
              disabled={isLoading}
              className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 disabled:opacity-50"
            >
              ⚡ Recalcular
            </button>
            <button
              onClick={seedTestData}
              disabled={isLoading}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
            >
              📦 Popular Testes
            </button>
            <button
              onClick={clearAllData}
              disabled={isLoading}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
            >
              🗑️ Limpar Tudo
            </button>
          </div>

          {message && (
            <div className="p-2 bg-white rounded text-xs">{message}</div>
          )}

          {/* Tabela de padrões */}
          <div className="bg-white rounded border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Produto</th>
                  <th className="px-3 py-2 text-center">Intervalo</th>
                  <th className="px-3 py-2 text-center">Compras</th>
                  <th className="px-3 py-2 text-left">Última</th>
                  <th className="px-3 py-2 text-left">Próxima</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((pattern, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{pattern.product_name}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {pattern.average_days} dias
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">
                      {pattern.total_purchases}x
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {new Date(pattern.last_purchase).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {new Date(pattern.next_predicted).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-gray-600 bg-white p-2 rounded">
            💡 <strong>Dica:</strong> Use "Popular Testes" para adicionar dados simulados (Leite e Pão). 
            O sistema aprende automaticamente quando você adiciona produtos e registra consumo.
          </div>
        </div>
      )}
    </div>
  );
};