-- ============================================
-- CORREÇÃO URGENTE: Trigger com DELETE sem WHERE
-- ============================================
-- Este script corrige o erro:
-- "DELETE requires a WHERE clause"
-- ============================================

-- Passo 1: Remover triggers problemáticos
DROP TRIGGER IF EXISTS after_purchase_insert ON purchases;
DROP TRIGGER IF EXISTS after_consumption_insert ON consumption;
DROP FUNCTION IF EXISTS trigger_recalculate_patterns();

-- Passo 2: Criar nova função de trigger que passa o user_id corretamente
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

-- Passo 3: Recriar triggers com FOR EACH ROW (não FOR EACH STATEMENT)
CREATE TRIGGER after_purchase_insert
  AFTER INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_patterns();

CREATE TRIGGER after_consumption_insert
  AFTER INSERT ON consumption
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_patterns();

-- Verificação
SELECT 'Triggers corrigidos com sucesso!' as status;
