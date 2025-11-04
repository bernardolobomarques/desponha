-- ============================================
-- CORRIGIR PERMISSÕES, FUNÇÃO E TRIGGERS DO SUPABASE
-- ============================================
-- Execute este script COMPLETO no Supabase SQL Editor
-- Corrige 3 problemas:
-- 1. Função sem parâmetro user_id
-- 2. Trigger chamando função errada
-- 3. RLS bloqueando inserções
-- ============================================

-- CORREÇÃO 1: Criar função com parâmetro user_id
CREATE OR REPLACE FUNCTION calculate_consumption_patterns(p_user_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM consumption_patterns WHERE user_id = p_user_id;
  
  INSERT INTO consumption_patterns (
    user_id, product_name, average_days_between_purchases,
    last_purchase_date, predicted_next_purchase_date,
    days_until_next_purchase, total_purchases, total_consumed,
    confidence_score, updated_at
  )
  SELECT 
    p.user_id, p.product_name,
    ROUND(AVG(CASE WHEN p.prev_date IS NOT NULL THEN (p.purchase_date - p.prev_date) ELSE NULL END)::NUMERIC, 2),
    MAX(p.purchase_date),
    (MAX(p.purchase_date) + COALESCE(ROUND(AVG(CASE WHEN p.prev_date IS NOT NULL THEN (p.purchase_date - p.prev_date) ELSE NULL END)::NUMERIC, 2), 7) * INTERVAL '1 day')::DATE,
    EXTRACT(DAY FROM (MAX(p.purchase_date) + COALESCE(ROUND(AVG(CASE WHEN p.prev_date IS NOT NULL THEN (p.purchase_date - p.prev_date) ELSE NULL END)::NUMERIC, 2), 7) * INTERVAL '1 day') - CURRENT_DATE)::INTEGER,
    COUNT(*),
    COALESCE(SUM(c.quantity_consumed), 0),
    LEAST(COUNT(*)::NUMERIC / 5.0, 1.0),
    NOW()
  FROM (
    SELECT user_id, product_name, purchase_date,
      LAG(purchase_date) OVER (PARTITION BY user_id, product_name ORDER BY purchase_date) as prev_date
    FROM purchases WHERE user_id = p_user_id
  ) p
  LEFT JOIN consumption c ON c.user_id = p.user_id AND c.product_name = p.product_name
  WHERE p.prev_date IS NOT NULL
  GROUP BY p.user_id, p.product_name
  HAVING COUNT(*) >= 2;
END;
$$;

-- CORREÇÃO 2: Corrigir Triggers
DROP TRIGGER IF EXISTS after_purchase_insert ON purchases;
DROP TRIGGER IF EXISTS after_consumption_insert ON consumption;
DROP FUNCTION IF EXISTS trigger_recalculate_patterns();

-- Criar nova função de trigger que passa o user_id corretamente
CREATE OR REPLACE FUNCTION trigger_recalculate_patterns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Recalcular padrões apenas para o usuário afetado
  PERFORM calculate_consumption_patterns(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Recriar triggers com FOR EACH ROW (não FOR EACH STATEMENT)
CREATE TRIGGER after_purchase_insert
  AFTER INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_patterns();

CREATE TRIGGER after_consumption_insert
  AFTER INSERT ON consumption
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_patterns();

-- CORREÇÃO 3: Desabilitar RLS para desenvolvimento
-- ⚠️ Não recomendado para produção!
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE consumption DISABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_patterns DISABLE ROW LEVEL SECURITY;

-- Opção 2: HABILITAR RLS + Políticas Permissivas (comentado)
-- Use isso em produção com autenticação real
/*
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_patterns ENABLE ROW LEVEL SECURITY;

-- Política: Permitir SELECT para todos (anônimo e autenticado)
CREATE POLICY "Permitir leitura de purchases" ON purchases
  FOR SELECT USING (true);

CREATE POLICY "Permitir leitura de consumption" ON consumption
  FOR SELECT USING (true);

CREATE POLICY "Permitir leitura de patterns" ON consumption_patterns
  FOR SELECT USING (true);

-- Política: Permitir INSERT para todos
CREATE POLICY "Permitir inserção em purchases" ON purchases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir inserção em consumption" ON consumption
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir inserção em patterns" ON consumption_patterns
  FOR INSERT WITH CHECK (true);

-- Política: Permitir UPDATE para todos
CREATE POLICY "Permitir atualização de patterns" ON consumption_patterns
  FOR UPDATE USING (true);

-- Política: Permitir DELETE para todos
CREATE POLICY "Permitir deleção de purchases" ON purchases
  FOR DELETE USING (true);

CREATE POLICY "Permitir deleção de consumption" ON consumption
  FOR DELETE USING (true);

CREATE POLICY "Permitir deleção de patterns" ON consumption_patterns
  FOR DELETE USING (true);
*/

-- Verificar status do RLS
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('purchases', 'consumption', 'consumption_patterns');
