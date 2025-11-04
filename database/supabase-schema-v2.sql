-- ============================================
-- SCHEMA SUPABASE - SISTEMA DE ML PARA LISTAS INTELIGENTES
-- ============================================
-- Versão: 2.0 - Simplificada e Testável
-- Data: 04/11/2025
-- ============================================

-- Limpar tabelas existentes (use com cuidado em produção!)
DROP TABLE IF EXISTS consumption_patterns CASCADE;
DROP TABLE IF EXISTS consumption CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;

-- ============================================
-- 1. TABELA DE COMPRAS (PURCHASES)
-- ============================================
-- Registra toda vez que um produto é adicionado à despensa
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_purchases_user_product ON purchases(user_id, product_name);
CREATE INDEX idx_purchases_date ON purchases(purchase_date DESC);

-- ============================================
-- 2. TABELA DE CONSUMO (CONSUMPTION)
-- ============================================
-- Registra toda vez que um produto é consumido/usado
CREATE TABLE consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  product_name TEXT NOT NULL,
  quantity_consumed INTEGER NOT NULL,
  remaining_quantity INTEGER NOT NULL DEFAULT 0,
  consumption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_consumption_user_product ON consumption(user_id, product_name);
CREATE INDEX idx_consumption_date ON consumption(consumption_date DESC);

-- ============================================
-- 3. TABELA DE PADRÕES (CONSUMPTION_PATTERNS)
-- ============================================
-- Armazena os padrões calculados pelo algoritmo
CREATE TABLE consumption_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  product_name TEXT NOT NULL,
  
  -- Métricas principais
  average_days_between_purchases NUMERIC(10, 2), -- Intervalo médio entre compras
  last_purchase_date DATE,
  predicted_next_purchase_date DATE,
  days_until_next_purchase INTEGER, -- Calculado: dias até a próxima compra prevista
  
  -- Histórico
  total_purchases INTEGER DEFAULT 0,
  total_consumed NUMERIC(10, 2) DEFAULT 0,
  
  -- Qualidade da predição
  confidence_score NUMERIC(3, 2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, product_name)
);

-- Índices para performance
CREATE INDEX idx_patterns_user ON consumption_patterns(user_id);
CREATE INDEX idx_patterns_next_purchase ON consumption_patterns(predicted_next_purchase_date);
CREATE INDEX idx_patterns_days_until ON consumption_patterns(days_until_next_purchase);

-- ============================================
-- 4. FUNÇÃO: CALCULAR PADRÕES DE CONSUMO
-- ============================================
-- Esta função analisa o histórico e calcula quando comprar novamente

-- Remove função antiga se existir (para evitar conflito de assinatura)
DROP FUNCTION IF EXISTS calculate_consumption_patterns();

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
-- 5. FUNÇÃO: BUSCAR SUGESTÕES PARA LISTA DE COMPRAS
-- ============================================
-- Retorna produtos que devem ser comprados em breve

CREATE OR REPLACE FUNCTION get_shopping_suggestions(
  p_user_id TEXT DEFAULT 'default-user',
  p_days_threshold INTEGER DEFAULT 2 -- Sugerir produtos que acabam em até X dias
)
RETURNS TABLE(
  product_name TEXT,
  priority TEXT,
  reason TEXT,
  days_until_needed INTEGER,
  suggested_quantity INTEGER,
  confidence NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.product_name,
    CASE 
      WHEN cp.days_until_next_purchase <= 0 THEN 'Alta'
      WHEN cp.days_until_next_purchase <= 2 THEN 'Média'
      ELSE 'Baixa'
    END as priority,
    'Padrão de Consumo' as reason,
    cp.days_until_next_purchase,
    GREATEST(1, ROUND(cp.total_consumed::NUMERIC / NULLIF(cp.total_purchases, 0))) as suggested_qty,
    cp.confidence_score
  FROM consumption_patterns cp
  WHERE cp.user_id = p_user_id
    AND cp.days_until_next_purchase <= p_days_threshold
  ORDER BY cp.days_until_next_purchase ASC, cp.confidence_score DESC;
END;
$$;

-- ============================================
-- 6. TRIGGER: RECALCULAR PADRÕES AUTOMATICAMENTE
-- ============================================
-- Sempre que houver nova compra ou consumo, recalcula os padrões

CREATE OR REPLACE FUNCTION trigger_recalculate_patterns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM calculate_consumption_patterns();
  RETURN NEW;
END;
$$;

-- Trigger após inserir compra
CREATE TRIGGER after_purchase_insert
  AFTER INSERT ON purchases
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_recalculate_patterns();

-- Trigger após inserir consumo
CREATE TRIGGER after_consumption_insert
  AFTER INSERT ON consumption
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_recalculate_patterns();

-- ============================================
-- 7. FUNÇÕES AUXILIARES PARA TESTES
-- ============================================

-- Limpar todos os dados (útil para testes)
CREATE OR REPLACE FUNCTION clear_all_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM consumption_patterns;
  DELETE FROM consumption;
  DELETE FROM purchases;
  RAISE NOTICE 'Todos os dados foram limpos!';
END;
$$;

-- Popular com dados de exemplo
CREATE OR REPLACE FUNCTION seed_test_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Limpa dados existentes
  PERFORM clear_all_data();
  
  -- Exemplo: Leite (comprado a cada 7 dias)
  INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
    ('Leite', 2, CURRENT_DATE - INTERVAL '21 days'),
    ('Leite', 2, CURRENT_DATE - INTERVAL '14 days'),
    ('Leite', 2, CURRENT_DATE - INTERVAL '7 days');
  
  INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity, consumption_date) VALUES
    ('Leite', 2, 0, CURRENT_DATE - INTERVAL '15 days'),
    ('Leite', 2, 0, CURRENT_DATE - INTERVAL '8 days'),
    ('Leite', 1, 1, CURRENT_DATE - INTERVAL '2 days');
  
  -- Exemplo: Pão (comprado a cada 3 dias)
  INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
    ('Pão', 1, CURRENT_DATE - INTERVAL '12 days'),
    ('Pão', 1, CURRENT_DATE - INTERVAL '9 days'),
    ('Pão', 1, CURRENT_DATE - INTERVAL '6 days'),
    ('Pão', 1, CURRENT_DATE - INTERVAL '3 days');
  
  INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity, consumption_date) VALUES
    ('Pão', 1, 0, CURRENT_DATE - INTERVAL '10 days'),
    ('Pão', 1, 0, CURRENT_DATE - INTERVAL '7 days'),
    ('Pão', 1, 0, CURRENT_DATE - INTERVAL '4 days'),
    ('Pão', 1, 0, CURRENT_DATE - INTERVAL '1 day');
  
  -- Calcula padrões
  PERFORM calculate_consumption_patterns();
  
  RAISE NOTICE 'Dados de teste inseridos com sucesso!';
END;
$$;

-- ============================================
-- 8. VIEWS ÚTEIS PARA DEBUG
-- ============================================

-- View: Resumo de todos os padrões
CREATE OR REPLACE VIEW v_patterns_summary AS
SELECT 
  product_name,
  average_days_between_purchases as "Intervalo (dias)",
  last_purchase_date as "Última Compra",
  predicted_next_purchase_date as "Próxima Compra",
  days_until_next_purchase as "Dias Restantes",
  total_purchases as "Total Compras",
  total_consumed as "Total Consumido",
  ROUND(confidence_score * 100) || '%' as "Confiança"
FROM consumption_patterns
ORDER BY days_until_next_purchase ASC;

-- View: Histórico de compras por produto
CREATE OR REPLACE VIEW v_purchase_history AS
SELECT 
  product_name,
  COUNT(*) as total_purchases,
  SUM(quantity) as total_quantity,
  MIN(purchase_date) as first_purchase,
  MAX(purchase_date) as last_purchase,
  ROUND(AVG(quantity), 2) as avg_quantity_per_purchase
FROM purchases
GROUP BY product_name
ORDER BY last_purchase DESC;

-- View: Histórico de consumo por produto
CREATE OR REPLACE VIEW v_consumption_history AS
SELECT 
  product_name,
  COUNT(*) as consumption_events,
  SUM(quantity_consumed) as total_consumed,
  MIN(consumption_date) as first_consumption,
  MAX(consumption_date) as last_consumption
FROM consumption
GROUP BY product_name
ORDER BY last_consumption DESC;

-- ============================================
-- FIM DO SCHEMA
-- ============================================

-- Mensagem de sucesso
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Schema criado com sucesso!';
  RAISE NOTICE '📊 Execute: SELECT * FROM v_patterns_summary; para ver padrões';
  RAISE NOTICE '🧪 Execute: SELECT seed_test_data(); para popular dados de teste';
END $$;
