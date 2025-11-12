-- ============================================
-- ATUALIZAÇÃO DO SCHEMA PARA SUPABASE AUTH
-- ============================================
-- Execute este script no SQL Editor do Supabase para integrar com auth.users

-- 0. LIMPAR DADOS DE TESTE ANTIGOS
-- ============================================
-- Remover dados com user_id TEXT que não podem ser convertidos para UUID

DELETE FROM consumption WHERE user_id IN ('default-user', 'user_123');
DELETE FROM purchases WHERE user_id IN ('default-user', 'user_123');
DELETE FROM consumption_patterns WHERE user_id IN ('default-user', 'user_123');

-- 1. Alterar tabelas existentes para usar UUID do auth.users
-- ============================================

-- Purchases: Mudar user_id de TEXT para UUID e adicionar foreign key
ALTER TABLE purchases 
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
  ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE purchases
  ADD CONSTRAINT purchases_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Consumption: Mudar user_id de TEXT para UUID e adicionar foreign key
ALTER TABLE consumption 
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
  ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE consumption
  ADD CONSTRAINT consumption_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Consumption_patterns: Mudar user_id de TEXT para UUID e adicionar foreign key
-- (se a tabela existir com TEXT)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consumption_patterns' 
    AND column_name = 'user_id' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE consumption_patterns 
      ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
      ALTER COLUMN user_id DROP DEFAULT;
    
    ALTER TABLE consumption_patterns
      ADD CONSTRAINT consumption_patterns_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Recriar consumption_patterns se necessário com UUID
-- ============================================
DROP TABLE IF EXISTS consumption_patterns CASCADE;

CREATE TABLE consumption_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  
  -- Estatísticas de consumo
  total_purchased INTEGER DEFAULT 0,
  total_consumed INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  consumption_count INTEGER DEFAULT 0,
  
  -- Datas importantes
  last_purchase_date DATE,
  last_consumption_date DATE,
  first_purchase_date DATE,
  
  -- Métricas calculadas
  average_consumption_rate NUMERIC(10, 2) DEFAULT 0, -- unidades por dia
  purchase_frequency_days NUMERIC(10, 2) DEFAULT 0, -- a cada X dias
  days_until_next_purchase NUMERIC(10, 2),
  
  -- Status de recomendação
  should_suggest BOOLEAN DEFAULT FALSE,
  suggestion_priority TEXT DEFAULT 'medium',
  pattern_confidence NUMERIC(3, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, product_name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_consumption_patterns_user ON consumption_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_patterns_suggest ON consumption_patterns(user_id, should_suggest);

-- 3. Atualizar função calculate_consumption_patterns para UUID
-- ============================================
CREATE OR REPLACE FUNCTION calculate_consumption_patterns(p_user_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Se não passar user_id, processar para todos os usuários
  IF p_user_id IS NULL THEN
    FOR v_user_id IN SELECT DISTINCT user_id FROM purchases LOOP
      PERFORM calculate_consumption_patterns(v_user_id);
    END LOOP;
    RETURN;
  END IF;

  -- Deletar padrões antigos do usuário
  DELETE FROM consumption_patterns WHERE user_id = p_user_id;

  -- Calcular novos padrões baseados em compras e consumo
  INSERT INTO consumption_patterns (
    user_id,
    product_name,
    total_purchased,
    total_consumed,
    purchase_count,
    consumption_count,
    last_purchase_date,
    last_consumption_date,
    first_purchase_date,
    average_consumption_rate,
    purchase_frequency_days,
    days_until_next_purchase,
    should_suggest,
    suggestion_priority,
    pattern_confidence
  )
  SELECT
    p_user_id,
    p.product_name,
    COALESCE(SUM(p.quantity), 0) as total_purchased,
    COALESCE(SUM(c.quantity_consumed), 0) as total_consumed,
    COUNT(DISTINCT p.id) as purchase_count,
    COUNT(DISTINCT c.id) as consumption_count,
    MAX(p.purchase_date) as last_purchase_date,
    MAX(c.consumption_date) as last_consumption_date,
    MIN(p.purchase_date) as first_purchase_date,
    
    -- Taxa média de consumo (unidades por dia)
    CASE 
      WHEN MAX(c.consumption_date) > MIN(c.consumption_date) THEN
        COALESCE(SUM(c.quantity_consumed)::NUMERIC / 
          GREATEST(1, EXTRACT(DAY FROM MAX(c.consumption_date) - MIN(c.consumption_date))), 0)
      ELSE 0
    END as average_consumption_rate,
    
    -- Frequência de compra (dias entre compras)
    CASE 
      WHEN COUNT(DISTINCT p.id) > 1 THEN
        EXTRACT(DAY FROM MAX(p.purchase_date) - MIN(p.purchase_date))::NUMERIC / 
          GREATEST(1, COUNT(DISTINCT p.id) - 1)
      ELSE 0
    END as purchase_frequency_days,
    
    -- Dias até próxima compra estimada
    CASE 
      WHEN COUNT(DISTINCT p.id) > 1 AND MAX(p.purchase_date) IS NOT NULL THEN
        GREATEST(0,
          (EXTRACT(DAY FROM MAX(p.purchase_date) - MIN(p.purchase_date))::NUMERIC / 
            GREATEST(1, COUNT(DISTINCT p.id) - 1)) - 
          EXTRACT(DAY FROM CURRENT_DATE - MAX(p.purchase_date))
        )
      ELSE NULL
    END as days_until_next_purchase,
    
    -- Deve sugerir? (se próxima compra é em menos de 7 dias)
    CASE 
      WHEN COUNT(DISTINCT p.id) > 1 AND MAX(p.purchase_date) IS NOT NULL THEN
        (GREATEST(0,
          (EXTRACT(DAY FROM MAX(p.purchase_date) - MIN(p.purchase_date))::NUMERIC / 
            GREATEST(1, COUNT(DISTINCT p.id) - 1)) - 
          EXTRACT(DAY FROM CURRENT_DATE - MAX(p.purchase_date))
        ) <= 7)
      ELSE FALSE
    END as should_suggest,
    
    -- Prioridade baseada em urgência
    CASE 
      WHEN COUNT(DISTINCT p.id) > 1 AND MAX(p.purchase_date) IS NOT NULL THEN
        CASE
          WHEN GREATEST(0,
            (EXTRACT(DAY FROM MAX(p.purchase_date) - MIN(p.purchase_date))::NUMERIC / 
              GREATEST(1, COUNT(DISTINCT p.id) - 1)) - 
            EXTRACT(DAY FROM CURRENT_DATE - MAX(p.purchase_date))
          ) <= 2 THEN 'high'
          WHEN GREATEST(0,
            (EXTRACT(DAY FROM MAX(p.purchase_date) - MIN(p.purchase_date))::NUMERIC / 
              GREATEST(1, COUNT(DISTINCT p.id) - 1)) - 
            EXTRACT(DAY FROM CURRENT_DATE - MAX(p.purchase_date))
          ) <= 5 THEN 'medium'
          ELSE 'low'
        END
      ELSE 'low'
    END as suggestion_priority,
    
    -- Confiança do padrão (baseado em quantidade de dados)
    CASE
      WHEN COUNT(DISTINCT p.id) >= 4 THEN 0.9
      WHEN COUNT(DISTINCT p.id) >= 2 THEN 0.6
      ELSE 0.3
    END as pattern_confidence
    
  FROM purchases p
  LEFT JOIN consumption c ON c.user_id = p.user_id AND c.product_name = p.product_name
  WHERE p.user_id = p_user_id
  GROUP BY p.product_name;

  RAISE NOTICE 'Padrões calculados para usuário %', p_user_id;
END;
$$;

-- 4. Atualizar função get_shopping_suggestions para UUID
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

-- 5. Função auxiliar para popular dados de teste
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

-- 6. Recriar triggers com UUID
-- ============================================
DROP TRIGGER IF EXISTS after_purchase_insert ON purchases;
DROP TRIGGER IF EXISTS after_consumption_insert ON consumption;
DROP FUNCTION IF EXISTS trigger_recalculate_patterns();

CREATE OR REPLACE FUNCTION trigger_recalculate_patterns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM calculate_consumption_patterns(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_purchase_insert
  AFTER INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_patterns();

CREATE TRIGGER after_consumption_insert
  AFTER INSERT ON consumption
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_patterns();

-- 7. Habilitar Row Level Security (RLS)
-- ============================================
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_patterns ENABLE ROW LEVEL SECURITY;

-- Policies para purchases
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchases"
  ON purchases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchases"
  ON purchases FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para consumption
CREATE POLICY "Users can view own consumption"
  ON consumption FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consumption"
  ON consumption FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consumption"
  ON consumption FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own consumption"
  ON consumption FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para consumption_patterns
CREATE POLICY "Users can view own patterns"
  ON consumption_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patterns"
  ON consumption_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns"
  ON consumption_patterns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own patterns"
  ON consumption_patterns FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CONCLUÍDO! 
-- ============================================
-- Agora o sistema está integrado com Supabase Auth
-- Cada usuário terá seus próprios dados isolados via RLS
