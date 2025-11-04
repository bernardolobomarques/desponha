-- ============================================
-- SCRIPT RÁPIDO - POPULAR DADOS DE TESTE
-- ============================================
-- Execute este script para ter dados prontos em 30 segundos!
-- ============================================

-- 1. LIMPAR TUDO (começar do zero)
SELECT clear_all_data();

-- 2. POPULAR COM DADOS REALISTAS
-- Simula uma despensa com 8 produtos e diferentes padrões de consumo

-- LEITE - Padrão: A cada 5 dias (acabando em 5 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Leite', 2, CURRENT_DATE - INTERVAL '15 days'),
  ('Leite', 2, CURRENT_DATE - INTERVAL '10 days'),
  ('Leite', 2, CURRENT_DATE - INTERVAL '5 days');

-- PÃO - Padrão: A cada 3 dias (acabando HOJE - URGENTE!)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Pão', 1, CURRENT_DATE - INTERVAL '9 days'),
  ('Pão', 1, CURRENT_DATE - INTERVAL '6 days'),
  ('Pão', 1, CURRENT_DATE - INTERVAL '3 days');

-- CAFÉ - Padrão: A cada 14 dias (acabando HOJE)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Café', 1, CURRENT_DATE - INTERVAL '42 days'),
  ('Café', 1, CURRENT_DATE - INTERVAL '28 days'),
  ('Café', 1, CURRENT_DATE - INTERVAL '14 days');

-- OVOS - Padrão: A cada 10 dias (acabando em 2 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Ovos', 12, CURRENT_DATE - INTERVAL '28 days'),
  ('Ovos', 12, CURRENT_DATE - INTERVAL '18 days'),
  ('Ovos', 12, CURRENT_DATE - INTERVAL '8 days');

-- QUEIJO - Padrão: A cada 7 dias (acabando em 1 dia)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Queijo', 1, CURRENT_DATE - INTERVAL '20 days'),
  ('Queijo', 1, CURRENT_DATE - INTERVAL '13 days'),
  ('Queijo', 1, CURRENT_DATE - INTERVAL '6 days');

-- ARROZ - Padrão: A cada 30 dias (OK, acabando em 30 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Arroz', 5, CURRENT_DATE - INTERVAL '60 days'),
  ('Arroz', 5, CURRENT_DATE - INTERVAL '30 days');

-- FEIJÃO - Padrão: A cada 21 dias (acabando em 21 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Feijão', 2, CURRENT_DATE - INTERVAL '42 days'),
  ('Feijão', 2, CURRENT_DATE - INTERVAL '21 days');

-- MANTEIGA - Padrão: A cada 12 dias (acabando em 4 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Manteiga', 1, CURRENT_DATE - INTERVAL '32 days'),
  ('Manteiga', 1, CURRENT_DATE - INTERVAL '20 days'),
  ('Manteiga', 1, CURRENT_DATE - INTERVAL '8 days');

-- 3. ADICIONAR ALGUNS CONSUMOS (para ter dados mais completos)
INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity, consumption_date) VALUES
  ('Leite', 2, 0, CURRENT_DATE - INTERVAL '11 days'),
  ('Leite', 1, 1, CURRENT_DATE - INTERVAL '6 days'),
  ('Pão', 1, 0, CURRENT_DATE - INTERVAL '7 days'),
  ('Pão', 1, 0, CURRENT_DATE - INTERVAL '4 days'),
  ('Café', 1, 0, CURRENT_DATE - INTERVAL '28 days'),
  ('Queijo', 1, 0, CURRENT_DATE - INTERVAL '14 days'),
  ('Ovos', 6, 6, CURRENT_DATE - INTERVAL '14 days');

-- 4. CALCULAR TODOS OS PADRÕES
SELECT * FROM calculate_consumption_patterns();

-- ============================================
-- RESULTADOS - VER O QUE FOI CRIADO
-- ============================================

-- Ver resumo de todos os padrões
SELECT * FROM v_patterns_summary;

-- Ver produtos que devem ser comprados EM ATÉ 2 DIAS
SELECT * FROM get_shopping_suggestions('default-user', 2);

-- Ver TODOS os produtos que precisam ser comprados (em até 7 dias)
SELECT * FROM get_shopping_suggestions('default-user', 7);

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Produtos URGENTES (aparecem na lista):
-- - Pão (acabando HOJE)
-- - Café (acabando HOJE)
-- - Queijo (acabando em 1 dia)
-- - Ovos (acabando em 2 dias)
--
-- Produtos OK por enquanto:
-- - Leite (acabando em 5 dias)
-- - Manteiga (acabando em 4 dias)
-- - Feijão (acabando em 21 dias)
-- - Arroz (acabando em 30 dias)
-- ============================================
