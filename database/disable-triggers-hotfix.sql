-- ============================================
-- CORREÇÃO RÁPIDA: Desabilitar Triggers Temporariamente
-- ============================================
-- Execute este script SE você está com erro 404 ao inserir dados

-- 1. Desabilitar triggers temporariamente
DROP TRIGGER IF EXISTS after_purchase_insert ON purchases;
DROP TRIGGER IF EXISTS after_consumption_insert ON consumption;

-- 2. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Triggers desabilitados! Agora você pode inserir dados normalmente.';
  RAISE NOTICE 'Os padrões ML não serão calculados automaticamente.';
  RAISE NOTICE 'Use o botão "Recalcular" no MLStats quando precisar.';
END $$;
