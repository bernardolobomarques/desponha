-- ============================================
-- CORREÇÃO: Atualizar função calculate_consumption_patterns
-- ============================================
-- Execute este script para corrigir o erro de tipo
-- Não precisa recriar todas as tabelas!
-- ============================================

-- Primeiro, remove a função antiga (se existir)
DROP FUNCTION IF EXISTS calculate_consumption_patterns();

-- Agora cria a função corrigida
CREATE OR REPLACE FUNCTION calculate_consumption_patterns()
RETURNS TABLE(
  result_product_name TEXT,
  result_average_days NUMERIC,
  result_next_purchase DATE,
  result_days_until INTEGER,
  result_confidence NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Limpa padrões antigos (recalcula tudo)
  DELETE FROM consumption_patterns;
  
  -- Para cada produto com pelo menos 2 compras, calcula o padrão
  -- Usa CTE para facilitar os cálculos
  INSERT INTO consumption_patterns (
    user_id,
    product_name,
    average_days_between_purchases,
    last_purchase_date,
    predicted_next_purchase_date,
    days_until_next_purchase,
    total_purchases,
    total_consumed,
    confidence_score,
    updated_at
  )
  WITH purchase_data AS (
    SELECT 
      user_id,
      product_name,
      purchase_date,
      LAG(purchase_date) OVER (PARTITION BY user_id, product_name ORDER BY purchase_date) as prev_purchase_date
    FROM purchases
  ),
  purchase_intervals AS (
    SELECT 
      user_id,
      product_name,
      purchase_date,
      (purchase_date - prev_purchase_date) as days_diff_interval
    FROM purchase_data
    WHERE prev_purchase_date IS NOT NULL
  ),
  aggregated_data AS (
    SELECT 
      pi.user_id,
      pi.product_name,
      AVG((pi.purchase_date - pi.prev_purchase_date))::NUMERIC as avg_interval_days,
      MAX(p.purchase_date) as last_purchase_date,
      COUNT(DISTINCT p.id) as total_purchases,
      COALESCE(SUM(c.quantity_consumed), 0) as total_consumed
    FROM purchase_data pi
    INNER JOIN purchases p ON p.user_id = pi.user_id AND p.product_name = pi.product_name
    LEFT JOIN consumption c ON c.user_id = pi.user_id AND c.product_name = pi.product_name
    WHERE pi.prev_purchase_date IS NOT NULL
    GROUP BY pi.user_id, pi.product_name
    HAVING COUNT(DISTINCT p.id) >= 2
  )
  SELECT 
    ad.user_id,
    ad.product_name,
    COALESCE(ad.avg_interval_days, 7)::NUMERIC(10,2) as average_days_between_purchases,
    ad.last_purchase_date,
    (ad.last_purchase_date + (COALESCE(ad.avg_interval_days, 7) || ' days')::INTERVAL)::DATE as predicted_next_purchase_date,
    ((ad.last_purchase_date + (COALESCE(ad.avg_interval_days, 7) || ' days')::INTERVAL) - CURRENT_DATE)::INTEGER as days_until_next_purchase,
    ad.total_purchases,
    ad.total_consumed,
    LEAST(ad.total_purchases::NUMERIC / 5.0, 1.0) as confidence_score,
    NOW() as updated_at
  FROM aggregated_data ad;
  
  -- Retorna os padrões calculados
  RETURN QUERY
  SELECT 
    cp.product_name::TEXT,
    cp.average_days_between_purchases::NUMERIC,
    cp.predicted_next_purchase_date::DATE,
    cp.days_until_next_purchase::INTEGER,
    cp.confidence_score::NUMERIC
  FROM consumption_patterns cp
  ORDER BY cp.days_until_next_purchase ASC;
END;
$$;

-- ============================================
-- TESTAR A CORREÇÃO
-- ============================================

-- Executar a função corrigida
SELECT * FROM calculate_consumption_patterns();

-- Verificar se funcionou
SELECT * FROM v_patterns_summary;

-- ============================================
-- Se funcionou, continue com quick-seed.sql!
-- ============================================
