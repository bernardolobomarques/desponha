-- ============================================
-- SCRIPTS DE POPULAÇÃO DE DADOS PARA TESTES
-- ============================================
-- Use estes scripts para testar diferentes cenários
-- Execute um por vez no Supabase SQL Editor
-- ============================================

-- ============================================
-- CENÁRIO 0: LIMPAR TODOS OS DADOS
-- ============================================
-- Execute este primeiro para começar do zero

SELECT clear_all_data();
-- Resultado: "Todos os dados foram limpos!"

-- Verificar que está vazio:
SELECT * FROM purchases;
SELECT * FROM consumption;
SELECT * FROM consumption_patterns;


-- ============================================
-- CENÁRIO 1: DADOS BÁSICOS DE TESTE
-- ============================================
-- 2 produtos com padrões claros de 7 e 3 dias

SELECT clear_all_data();

-- Leite: Padrão de 7 dias
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Leite', 2, CURRENT_DATE - INTERVAL '21 days'),
  ('Leite', 2, CURRENT_DATE - INTERVAL '14 days'),
  ('Leite', 2, CURRENT_DATE - INTERVAL '7 days');

INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity, consumption_date) VALUES
  ('Leite', 2, 0, CURRENT_DATE - INTERVAL '15 days'),
  ('Leite', 2, 0, CURRENT_DATE - INTERVAL '8 days'),
  ('Leite', 1, 1, CURRENT_DATE - INTERVAL '2 days');

-- Pão: Padrão de 3 dias
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

-- Calcular padrões
SELECT * FROM calculate_consumption_patterns();

-- Verificar resultados
SELECT * FROM v_patterns_summary;
-- Resultado esperado:
-- Leite: 7 dias de intervalo, próxima compra daqui 7 dias
-- Pão: 3 dias de intervalo, próxima compra HOJE (urgente!)


-- ============================================
-- CENÁRIO 2: DESPENSA COMPLETA (10 produtos)
-- ============================================
-- Simula uma despensa realista com vários produtos

SELECT clear_all_data();

-- 1. Leite (a cada 5 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Leite', 2, CURRENT_DATE - INTERVAL '15 days'),
  ('Leite', 2, CURRENT_DATE - INTERVAL '10 days'),
  ('Leite', 2, CURRENT_DATE - INTERVAL '5 days');

-- 2. Ovos (a cada 10 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Ovos', 12, CURRENT_DATE - INTERVAL '30 days'),
  ('Ovos', 12, CURRENT_DATE - INTERVAL '20 days'),
  ('Ovos', 12, CURRENT_DATE - INTERVAL '10 days');

-- 3. Café (a cada 14 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Café', 1, CURRENT_DATE - INTERVAL '42 days'),
  ('Café', 1, CURRENT_DATE - INTERVAL '28 days'),
  ('Café', 1, CURRENT_DATE - INTERVAL '14 days');

-- 4. Arroz (a cada 30 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Arroz', 5, CURRENT_DATE - INTERVAL '90 days'),
  ('Arroz', 5, CURRENT_DATE - INTERVAL '60 days'),
  ('Arroz', 5, CURRENT_DATE - INTERVAL '30 days');

-- 5. Feijão (a cada 21 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Feijão', 2, CURRENT_DATE - INTERVAL '63 days'),
  ('Feijão', 2, CURRENT_DATE - INTERVAL '42 days'),
  ('Feijão', 2, CURRENT_DATE - INTERVAL '21 days');

-- 6. Pão (a cada 3 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Pão', 1, CURRENT_DATE - INTERVAL '9 days'),
  ('Pão', 1, CURRENT_DATE - INTERVAL '6 days'),
  ('Pão', 1, CURRENT_DATE - INTERVAL '3 days');

-- 7. Manteiga (a cada 12 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Manteiga', 1, CURRENT_DATE - INTERVAL '36 days'),
  ('Manteiga', 1, CURRENT_DATE - INTERVAL '24 days'),
  ('Manteiga', 1, CURRENT_DATE - INTERVAL '12 days');

-- 8. Queijo (a cada 7 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Queijo', 1, CURRENT_DATE - INTERVAL '21 days'),
  ('Queijo', 1, CURRENT_DATE - INTERVAL '14 days'),
  ('Queijo', 1, CURRENT_DATE - INTERVAL '7 days');

-- 9. Macarrão (a cada 15 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Macarrão', 2, CURRENT_DATE - INTERVAL '45 days'),
  ('Macarrão', 2, CURRENT_DATE - INTERVAL '30 days'),
  ('Macarrão', 2, CURRENT_DATE - INTERVAL '15 days');

-- 10. Açúcar (a cada 25 dias)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Açúcar', 1, CURRENT_DATE - INTERVAL '75 days'),
  ('Açúcar', 1, CURRENT_DATE - INTERVAL '50 days'),
  ('Açúcar', 1, CURRENT_DATE - INTERVAL '25 days');

-- Adicionar alguns consumos
INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity, consumption_date) VALUES
  ('Leite', 2, 0, CURRENT_DATE - INTERVAL '11 days'),
  ('Leite', 2, 0, CURRENT_DATE - INTERVAL '6 days'),
  ('Pão', 1, 0, CURRENT_DATE - INTERVAL '7 days'),
  ('Pão', 1, 0, CURRENT_DATE - INTERVAL '4 days'),
  ('Queijo', 1, 0, CURRENT_DATE - INTERVAL '14 days'),
  ('Café', 1, 0, CURRENT_DATE - INTERVAL '28 days');

-- Calcular padrões
SELECT * FROM calculate_consumption_patterns();

-- Ver resumo
SELECT * FROM v_patterns_summary;


-- ============================================
-- CENÁRIO 3: TESTAR ALGORITMO - PRODUTO NOVO
-- ============================================
-- Simula adicionar um produto pela primeira vez

SELECT clear_all_data();

-- Primeira compra (HOJE)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Café', 1, CURRENT_DATE);

-- Tentar calcular padrões
SELECT * FROM calculate_consumption_patterns();
-- Resultado: Vazio! Precisa de pelo menos 2 compras

-- Verificar
SELECT * FROM v_patterns_summary;
-- Resultado: Sem padrões ainda

-- Agora simular uma segunda compra (7 dias atrás)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Café', 1, CURRENT_DATE - INTERVAL '7 days');

-- Calcular novamente
SELECT * FROM calculate_consumption_patterns();

-- Verificar
SELECT * FROM v_patterns_summary;
-- Resultado: Café com padrão de 7 dias!


-- ============================================
-- CENÁRIO 4: TESTAR URGÊNCIA - Produtos acabando HOJE
-- ============================================
-- Produtos que devem aparecer na lista de compras AGORA

SELECT clear_all_data();

-- Produto 1: Acabando HOJE (dias_until = 0)
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Leite', 2, CURRENT_DATE - INTERVAL '14 days'),
  ('Leite', 2, CURRENT_DATE - INTERVAL '7 days');
-- Última compra foi há 7 dias, então próxima é HOJE!

-- Produto 2: Acabando em 1 dia
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Pão', 1, CURRENT_DATE - INTERVAL '7 days'),
  ('Pão', 1, CURRENT_DATE - INTERVAL '4 days');
-- Intervalo de 3 dias, última compra há 4 dias = acabou há 1 dia (URGENTE!)

-- Produto 3: Acabando em 2 dias
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Ovos', 12, CURRENT_DATE - INTERVAL '10 days'),
  ('Ovos', 12, CURRENT_DATE - INTERVAL '5 days');
-- Intervalo de 5 dias, última compra há 5 dias = próxima é HOJE!

-- Calcular
SELECT * FROM calculate_consumption_patterns();

-- Ver sugestões para lista de compras (até 2 dias)
SELECT * FROM get_shopping_suggestions('default-user', 2);
-- Resultado: Todos os 3 produtos devem aparecer!

-- Ver apenas URGENTES (até 0 dias)
SELECT * FROM get_shopping_suggestions('default-user', 0);


-- ============================================
-- CENÁRIO 5: MANIPULAR DATAS PARA TESTES
-- ============================================
-- Como simular que já passou uma semana

SELECT clear_all_data();

-- Adicionar produto "Café" com padrão de 7 dias
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Café', 1, CURRENT_DATE - INTERVAL '14 days'),
  ('Café', 1, CURRENT_DATE - INTERVAL '7 days');

-- Calcular
SELECT * FROM calculate_consumption_patterns();

-- Ver quando vai acabar
SELECT 
  product_name,
  last_purchase_date as "Última Compra",
  predicted_next_purchase_date as "Previsão Próxima",
  days_until_next_purchase as "Dias Restantes"
FROM consumption_patterns
WHERE product_name = 'Café';
-- Resultado: Próxima compra daqui 7 dias

-- AGORA: Simular que já passou 1 semana
-- Opção 1: Atualizar a data da última compra
UPDATE purchases 
SET purchase_date = purchase_date - INTERVAL '7 days'
WHERE product_name = 'Café';

-- Recalcular
SELECT * FROM calculate_consumption_patterns();

-- Ver resultado
SELECT * FROM v_patterns_summary WHERE product_name = 'Café';
-- Resultado: Agora diz que acabou há 7 dias (negativo!)


-- ============================================
-- CENÁRIO 6: PRODUTO COM PADRÃO IRREGULAR
-- ============================================
-- Testar como o algoritmo lida com variações

SELECT clear_all_data();

-- Café comprado em intervalos variados: 5, 7, 10, 6 dias
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Café', 1, CURRENT_DATE - INTERVAL '28 days'),
  ('Café', 1, CURRENT_DATE - INTERVAL '23 days'),  -- 5 dias depois
  ('Café', 1, CURRENT_DATE - INTERVAL '16 days'),  -- 7 dias depois
  ('Café', 1, CURRENT_DATE - INTERVAL '6 days');   -- 10 dias depois

-- Calcular
SELECT * FROM calculate_consumption_patterns();

-- Ver média calculada
SELECT 
  product_name,
  ROUND(average_days_between_purchases, 1) as "Média de Dias",
  confidence_score as "Confiança"
FROM consumption_patterns
WHERE product_name = 'Café';
-- Resultado: Média = (5+7+10)/3 = ~7.3 dias, confiança = 0.8 (4 compras / 5)


-- ============================================
-- CENÁRIO 7: VÁRIOS USUÁRIOS (FUTURO)
-- ============================================
-- Por enquanto todos usam 'default-user', mas você pode testar multi-usuário

SELECT clear_all_data();

-- Usuário 1
INSERT INTO purchases (user_id, product_name, quantity, purchase_date) VALUES
  ('user-1', 'Leite', 2, CURRENT_DATE - INTERVAL '14 days'),
  ('user-1', 'Leite', 2, CURRENT_DATE - INTERVAL '7 days');

-- Usuário 2
INSERT INTO purchases (user_id, product_name, quantity, purchase_date) VALUES
  ('user-2', 'Leite', 2, CURRENT_DATE - INTERVAL '10 days'),
  ('user-2', 'Leite', 2, CURRENT_DATE - INTERVAL '5 days');

-- Calcular
SELECT * FROM calculate_consumption_patterns();

-- Ver por usuário
SELECT 
  user_id,
  product_name,
  average_days_between_purchases,
  days_until_next_purchase
FROM consumption_patterns
ORDER BY user_id, days_until_next_purchase;
-- Resultado: Cada usuário tem seu próprio padrão!


-- ============================================
-- QUERIES ÚTEIS PARA TESTES
-- ============================================

-- 1. Ver tudo de um produto específico
SELECT * FROM v_patterns_summary WHERE product_name = 'Leite';

-- 2. Ver produtos que devem ser comprados em até X dias
SELECT * FROM get_shopping_suggestions('default-user', 3);

-- 3. Ver histórico completo de compras
SELECT * FROM v_purchase_history;

-- 4. Ver histórico completo de consumos
SELECT * FROM v_consumption_history;

-- 5. Ver produtos por prioridade
SELECT 
  product_name,
  days_until_next_purchase,
  CASE 
    WHEN days_until_next_purchase <= 0 THEN 'URGENTE! Comprar hoje'
    WHEN days_until_next_purchase <= 2 THEN 'Em breve (2 dias)'
    WHEN days_until_next_purchase <= 7 THEN 'Semana que vem'
    ELSE 'OK por enquanto'
  END as status
FROM consumption_patterns
ORDER BY days_until_next_purchase;

-- 6. Simular consumo de um produto
INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity, consumption_date)
VALUES ('Leite', 1, 1, CURRENT_DATE);
-- Depois execute: SELECT * FROM calculate_consumption_patterns();

-- 7. Simular nova compra
INSERT INTO purchases (product_name, quantity, purchase_date)
VALUES ('Leite', 2, CURRENT_DATE);
-- Depois execute: SELECT * FROM calculate_consumption_patterns();

-- 8. Ver confiança das previsões
SELECT 
  product_name,
  total_purchases as "Compras Registradas",
  ROUND(confidence_score * 100) as "Confiança %",
  CASE 
    WHEN confidence_score >= 0.8 THEN 'Alta confiança'
    WHEN confidence_score >= 0.5 THEN 'Média confiança'
    ELSE 'Baixa confiança (poucos dados)'
  END as avaliacao
FROM consumption_patterns
ORDER BY confidence_score DESC;


-- ============================================
-- TESTE COMPLETO: FLUXO DE 1 MÊS
-- ============================================
-- Simula 1 mês de uso do app

SELECT clear_all_data();

-- Semana 1: Compras iniciais
INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Leite', 2, CURRENT_DATE - INTERVAL '28 days'),
  ('Pão', 2, CURRENT_DATE - INTERVAL '28 days'),
  ('Café', 1, CURRENT_DATE - INTERVAL '28 days'),
  ('Ovos', 12, CURRENT_DATE - INTERVAL '28 days');

-- Semana 2: Consumos e reposições
INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity, consumption_date) VALUES
  ('Leite', 2, 0, CURRENT_DATE - INTERVAL '22 days'),
  ('Pão', 2, 0, CURRENT_DATE - INTERVAL '25 days');

INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Leite', 2, CURRENT_DATE - INTERVAL '21 days'),
  ('Pão', 2, CURRENT_DATE - INTERVAL '21 days');

-- Semana 3: Mais consumos
INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity, consumption_date) VALUES
  ('Leite', 2, 0, CURRENT_DATE - INTERVAL '15 days'),
  ('Pão', 2, 0, CURRENT_DATE - INTERVAL '18 days'),
  ('Café', 1, 0, CURRENT_DATE - INTERVAL '14 days');

INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Leite', 2, CURRENT_DATE - INTERVAL '14 days'),
  ('Pão', 2, CURRENT_DATE - INTERVAL '14 days'),
  ('Café', 1, CURRENT_DATE - INTERVAL '14 days');

-- Semana 4: Ciclo final
INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity, consumption_date) VALUES
  ('Leite', 2, 0, CURRENT_DATE - INTERVAL '8 days'),
  ('Pão', 2, 0, CURRENT_DATE - INTERVAL '11 days'),
  ('Ovos', 6, 6, CURRENT_DATE - INTERVAL '14 days');

INSERT INTO purchases (product_name, quantity, purchase_date) VALUES
  ('Leite', 2, CURRENT_DATE - INTERVAL '7 days'),
  ('Pão', 2, CURRENT_DATE - INTERVAL '7 days'),
  ('Ovos', 12, CURRENT_DATE - INTERVAL '7 days');

-- Calcular padrões
SELECT * FROM calculate_consumption_patterns();

-- Ver resultado final
SELECT * FROM v_patterns_summary;

-- Ver o que deve ser comprado AGORA
SELECT * FROM get_shopping_suggestions('default-user', 2);


-- ============================================
-- FIM DOS SCRIPTS
-- ============================================

-- Para usar:
-- 1. Copie um cenário completo (do SELECT clear_all_data() até o final do cenário)
-- 2. Cole no Supabase SQL Editor
-- 3. Execute (Run ou F5)
-- 4. Observe os resultados!
