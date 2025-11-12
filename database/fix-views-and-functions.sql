-- ============================================
-- CORREÇÃO: Views e Funções para ML
-- ============================================

-- 1. Criar view v_patterns_summary (para MLStats)
-- ============================================
CREATE OR REPLACE VIEW v_patterns_summary AS
SELECT 
  product_name,
  purchase_frequency_days as average_days,
  total_purchased as total_purchases,
  last_purchase_date::text as last_purchase,
  (last_purchase_date + (purchase_frequency_days || ' days')::INTERVAL)::date::text as next_predicted
FROM consumption_patterns
WHERE should_suggest = TRUE
ORDER BY purchase_frequency_days ASC;

-- 2. Remover funções duplicadas de get_shopping_suggestions
-- ============================================
DROP FUNCTION IF EXISTS get_shopping_suggestions(text, integer);
DROP FUNCTION IF EXISTS get_shopping_suggestions(uuid);
DROP FUNCTION IF EXISTS get_shopping_suggestions(text);

-- 3. Criar APENAS uma versão da função (com UUID)
-- ============================================
CREATE OR REPLACE FUNCTION get_shopping_suggestions(
  p_user_id UUID,
  p_days_threshold INTEGER DEFAULT 7
)
RETURNS TABLE (
  product_name TEXT,
  days_until_next_purchase NUMERIC,
  priority TEXT,
  confidence NUMERIC,
  last_purchase_date DATE,
  purchase_frequency NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.product_name,
    cp.days_until_next_purchase,
    cp.suggestion_priority as priority,
    cp.pattern_confidence as confidence,
    cp.last_purchase_date,
    cp.purchase_frequency_days as purchase_frequency
  FROM consumption_patterns cp
  WHERE cp.user_id = p_user_id
    AND cp.should_suggest = TRUE
    AND cp.days_until_next_purchase IS NOT NULL
    AND cp.days_until_next_purchase <= p_days_threshold
  ORDER BY cp.days_until_next_purchase ASC, cp.pattern_confidence DESC;
END;
$$;

-- 4. Remover funções duplicadas de seed_test_data
-- ============================================
DROP FUNCTION IF EXISTS seed_test_data(text);

-- 5. Garantir que seed_test_data existe com UUID
-- ============================================
CREATE OR REPLACE FUNCTION seed_test_data(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Limpar dados existentes do usuário
  DELETE FROM consumption WHERE user_id = p_user_id;
  DELETE FROM purchases WHERE user_id = p_user_id;
  DELETE FROM consumption_patterns WHERE user_id = p_user_id;

  -- Inserir compras de teste (últimos 30 dias)
  INSERT INTO purchases (user_id, product_name, quantity, purchase_date) VALUES
  (p_user_id, 'Leite', 2, CURRENT_DATE - INTERVAL '28 days'),
  (p_user_id, 'Leite', 2, CURRENT_DATE - INTERVAL '21 days'),
  (p_user_id, 'Leite', 2, CURRENT_DATE - INTERVAL '14 days'),
  (p_user_id, 'Leite', 2, CURRENT_DATE - INTERVAL '7 days'),
  
  (p_user_id, 'Pão', 1, CURRENT_DATE - INTERVAL '6 days'),
  (p_user_id, 'Pão', 1, CURRENT_DATE - INTERVAL '3 days'),
  
  (p_user_id, 'Café', 1, CURRENT_DATE - INTERVAL '25 days'),
  (p_user_id, 'Café', 1, CURRENT_DATE - INTERVAL '10 days');

  -- Inserir consumos de teste
  INSERT INTO consumption (user_id, product_name, quantity_consumed, consumption_date) VALUES
  (p_user_id, 'Leite', 1, CURRENT_DATE - INTERVAL '25 days'),
  (p_user_id, 'Leite', 1, CURRENT_DATE - INTERVAL '18 days'),
  (p_user_id, 'Leite', 1, CURRENT_DATE - INTERVAL '11 days'),
  (p_user_id, 'Leite', 1, CURRENT_DATE - INTERVAL '4 days'),
  
  (p_user_id, 'Pão', 1, CURRENT_DATE - INTERVAL '5 days'),
  (p_user_id, 'Pão', 1, CURRENT_DATE - INTERVAL '2 days'),
  
  (p_user_id, 'Café', 1, CURRENT_DATE - INTERVAL '20 days');

  -- Recalcular padrões
  PERFORM calculate_consumption_patterns(p_user_id);
  
  RAISE NOTICE 'Dados de teste inseridos para usuário %', p_user_id;
END;
$$;

-- 6. Remover funções duplicadas de calculate_consumption_patterns
-- ============================================
DROP FUNCTION IF EXISTS calculate_consumption_patterns(text);

-- 7. Função para limpar dados (para MLStats)
-- ============================================
CREATE OR REPLACE FUNCTION clear_all_data(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM consumption WHERE user_id = p_user_id;
  DELETE FROM purchases WHERE user_id = p_user_id;
  DELETE FROM consumption_patterns WHERE user_id = p_user_id;
  
  RAISE NOTICE 'Todos os dados do usuário % foram limpos', p_user_id;
END;
$$;

-- ============================================
-- CONCLUÍDO!
-- ============================================
-- Agora você pode:
-- 1. Ver padrões no MLStats (v_patterns_summary)
-- 2. Receber sugestões na Lista de Compras
-- 3. Popular dados de teste
-- 4. Limpar tudo quando quiser
