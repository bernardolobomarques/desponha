-- ============================================
-- RESET COMPLETO + CRIAÇÃO DO BANCO
-- ============================================
-- Este script:
-- 1. Deleta TUDO (tabelas, funções, views, triggers)
-- 2. Cria tudo do zero SEM ERROS
-- Execute este arquivo completo de uma vez!
-- ============================================

-- ============================================
-- PARTE 1: DELETAR TUDO
-- ============================================

-- Remover triggers
DROP TRIGGER IF EXISTS after_purchase_insert ON purchases;
DROP TRIGGER IF EXISTS after_consumption_insert ON consumption;

-- Remover funções
DROP FUNCTION IF EXISTS trigger_recalculate_patterns();
DROP FUNCTION IF EXISTS calculate_consumption_patterns();
DROP FUNCTION IF EXISTS get_shopping_suggestions(TEXT, INTEGER);
DROP FUNCTION IF EXISTS clear_all_data();
DROP FUNCTION IF EXISTS seed_test_data();

-- Remover views
DROP VIEW IF EXISTS v_patterns_summary;
DROP VIEW IF EXISTS v_purchase_history;
DROP VIEW IF EXISTS v_consumption_history;

-- Remover tabelas
DROP TABLE IF EXISTS consumption_patterns CASCADE;
DROP TABLE IF EXISTS consumption CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;

-- ============================================
-- PARTE 2: CRIAR TABELAS
-- ============================================

-- Tabela de compras
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchases_user_product ON purchases(user_id, product_name);
CREATE INDEX idx_purchases_date ON purchases(purchase_date DESC);

-- Tabela de consumo
CREATE TABLE consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  product_name TEXT NOT NULL,
  quantity_consumed INTEGER NOT NULL,
  remaining_quantity INTEGER NOT NULL DEFAULT 0,
  consumption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_consumption_user_product ON consumption(user_id, product_name);
CREATE INDEX idx_consumption_date ON consumption(consumption_date DESC);

-- Tabela de padrões
CREATE TABLE consumption_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  product_name TEXT NOT NULL,
  average_days_between_purchases NUMERIC(10, 2),
  last_purchase_date DATE,
  predicted_next_purchase_date DATE,
  days_until_next_purchase INTEGER,
  total_purchases INTEGER DEFAULT 0,
  total_consumed NUMERIC(10, 2) DEFAULT 0,
  confidence_score NUMERIC(3, 2) DEFAULT 0.5,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_name)
);

CREATE INDEX idx_patterns_user ON consumption_patterns(user_id);
CREATE INDEX idx_patterns_next_purchase ON consumption_patterns(predicted_next_purchase_date);
CREATE INDEX idx_patterns_days_until ON consumption_patterns(days_until_next_purchase);

-- ============================================
-- PARTE 3: CRIAR FUNÇÃO PRINCIPAL
-- ============================================

CREATE OR REPLACE FUNCTION calculate_consumption_patterns()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Limpa padrões antigos
  DELETE FROM consumption_patterns;
  
  -- Calcula novos padrões
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
  SELECT 
    p.user_id,
    p.product_name,
    -- Média de dias entre compras
    ROUND(AVG(
      CASE 
        WHEN p.prev_date IS NOT NULL 
        THEN (p.purchase_date - p.prev_date)
        ELSE NULL 
      END
    )::NUMERIC, 2) as avg_days,
    -- Última compra
    MAX(p.purchase_date) as last_purchase,
    -- Próxima compra prevista
    (MAX(p.purchase_date) + 
      COALESCE(
        ROUND(AVG(
          CASE 
            WHEN p.prev_date IS NOT NULL 
            THEN (p.purchase_date - p.prev_date)
            ELSE NULL 
          END
        )::NUMERIC, 2),
        7
      ) * INTERVAL '1 day'
    )::DATE as next_purchase,
    -- Dias até próxima compra
    EXTRACT(DAY FROM 
      (MAX(p.purchase_date) + 
        COALESCE(
          ROUND(AVG(
            CASE 
              WHEN p.prev_date IS NOT NULL 
              THEN (p.purchase_date - p.prev_date)
              ELSE NULL 
            END
          )::NUMERIC, 2),
          7
        ) * INTERVAL '1 day'
      ) - CURRENT_DATE
    )::INTEGER as days_until,
    -- Total de compras
    COUNT(*) as total_purchases,
    -- Total consumido
    COALESCE(SUM(c.quantity_consumed), 0) as total_consumed,
    -- Confiança
    LEAST(COUNT(*)::NUMERIC / 5.0, 1.0) as confidence,
    NOW() as updated_at
  FROM (
    SELECT 
      id,
      user_id,
      product_name,
      purchase_date,
      LAG(purchase_date) OVER (PARTITION BY user_id, product_name ORDER BY purchase_date) as prev_date
    FROM purchases
  ) p
  LEFT JOIN consumption c ON c.user_id = p.user_id AND c.product_name = p.product_name
  GROUP BY p.user_id, p.product_name
  HAVING COUNT(*) >= 2
    AND COUNT(CASE WHEN p.prev_date IS NOT NULL THEN 1 END) >= 1;
END;
$$;

-- ============================================
-- PARTE 4: FUNÇÃO DE SUGESTÕES
-- ============================================

CREATE OR REPLACE FUNCTION get_shopping_suggestions(
  p_user_id TEXT DEFAULT 'default-user',
  p_days_threshold INTEGER DEFAULT 2
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
    'Padrão de Consumo'::TEXT as reason,
    cp.days_until_next_purchase,
    GREATEST(1, ROUND(cp.total_consumed / NULLIF(cp.total_purchases, 0)))::INTEGER as suggested_qty,
    cp.confidence_score
  FROM consumption_patterns cp
  WHERE cp.user_id = p_user_id
    AND cp.days_until_next_purchase <= p_days_threshold
  ORDER BY cp.days_until_next_purchase ASC, cp.confidence_score DESC;
END;
$$;

-- ============================================
-- PARTE 5: TRIGGERS AUTOMÁTICOS
-- ============================================

CREATE OR REPLACE FUNCTION trigger_recalculate_patterns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM calculate_consumption_patterns();
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_purchase_insert
  AFTER INSERT ON purchases
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_recalculate_patterns();

CREATE TRIGGER after_consumption_insert
  AFTER INSERT ON consumption
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_recalculate_patterns();

-- ============================================
-- PARTE 6: FUNÇÕES AUXILIARES
-- ============================================

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

CREATE OR REPLACE FUNCTION seed_test_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM clear_all_data();
  
  -- Leite (a cada 7 dias)
  INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
    ('Leite', 2, CURRENT_DATE - 21),
    ('Leite', 2, CURRENT_DATE - 14),
    ('Leite', 2, CURRENT_DATE - 7);
  
  INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity, consumption_date) VALUES
    ('Leite', 2, 0, CURRENT_DATE - 15),
    ('Leite', 2, 0, CURRENT_DATE - 8),
    ('Leite', 1, 1, CURRENT_DATE - 2);
  
  -- Pão (a cada 3 dias)
  INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
    ('Pão', 1, CURRENT_DATE - 12),
    ('Pão', 1, CURRENT_DATE - 9),
    ('Pão', 1, CURRENT_DATE - 6),
    ('Pão', 1, CURRENT_DATE - 3);
  
  INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity, consumption_date) VALUES
    ('Pão', 1, 0, CURRENT_DATE - 10),
    ('Pão', 1, 0, CURRENT_DATE - 7),
    ('Pão', 1, 0, CURRENT_DATE - 4),
    ('Pão', 1, 0, CURRENT_DATE - 1);
  
  PERFORM calculate_consumption_patterns();
  
  RAISE NOTICE 'Dados de teste inseridos com sucesso!';
END;
$$;

-- ============================================
-- PARTE 7: VIEWS ÚTEIS
-- ============================================

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
-- MENSAGEM FINAL
-- ============================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Banco criado com sucesso!';
  RAISE NOTICE '📊 Teste: SELECT seed_test_data();';
  RAISE NOTICE '🔍 Ver padrões: SELECT * FROM v_patterns_summary;';
END $$;
