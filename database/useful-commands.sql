-- ============================================
-- COMANDOS ÚTEIS PARA TESTES E DEBUG
-- ============================================
-- Cole e execute estes comandos conforme necessário
-- ============================================

-- ============================================
-- 1. VISUALIZAÇÃO DE DADOS
-- ============================================

-- Ver TODOS os padrões calculados (visão completa)
SELECT * FROM v_patterns_summary;

-- Ver padrões ordenados por URGÊNCIA (quem acaba primeiro)
SELECT * FROM v_patterns_summary ORDER BY "Dias Restantes" ASC;

-- Ver padrões com ALTA CONFIANÇA (mais de 60%)
SELECT * FROM v_patterns_summary WHERE "Confiança" >= '60%';

-- Ver apenas produtos URGENTES (acabam em até 2 dias)
SELECT * FROM v_patterns_summary WHERE "Dias Restantes" <= 2;

-- Ver histórico de COMPRAS
SELECT * FROM v_purchase_history;

-- Ver histórico de CONSUMOS
SELECT * FROM v_consumption_history;


-- ============================================
-- 2. SUGESTÕES PARA LISTA DE COMPRAS
-- ============================================

-- Sugestões URGENTES (até hoje)
SELECT * FROM get_shopping_suggestions('default-user', 0);

-- Sugestões para PRÓXIMOS 2 DIAS
SELECT * FROM get_shopping_suggestions('default-user', 2);

-- Sugestões para PRÓXIMA SEMANA
SELECT * FROM get_shopping_suggestions('default-user', 7);

-- Ver TODAS as sugestões (próximos 30 dias)
SELECT * FROM get_shopping_suggestions('default-user', 30);


-- ============================================
-- 3. CONSULTAS ESPECÍFICAS
-- ============================================

-- Ver TUDO sobre um produto específico (substitua 'Leite' pelo produto)
SELECT 
  'Padrão' as tipo,
  product_name,
  average_days_between_purchases::TEXT as valor,
  'dias entre compras' as unidade
FROM consumption_patterns 
WHERE product_name = 'Leite'

UNION ALL

SELECT 
  'Compras' as tipo,
  product_name,
  COUNT(*)::TEXT as valor,
  'total' as unidade
FROM purchases 
WHERE product_name = 'Leite'
GROUP BY product_name

UNION ALL

SELECT 
  'Consumos' as tipo,
  product_name,
  COUNT(*)::TEXT as valor,
  'total' as unidade
FROM consumption 
WHERE product_name = 'Leite'
GROUP BY product_name;

-- Ver últimas 10 compras (mais recentes)
SELECT 
  product_name,
  quantity,
  purchase_date,
  EXTRACT(day FROM (CURRENT_DATE - purchase_date)) || ' dias atrás' as tempo
FROM purchases
ORDER BY purchase_date DESC
LIMIT 10;

-- Ver últimos 10 consumos (mais recentes)
SELECT 
  product_name,
  quantity_consumed,
  remaining_quantity,
  consumption_date,
  EXTRACT(day FROM (CURRENT_DATE - consumption_date)) || ' dias atrás' as tempo
FROM consumption
ORDER BY consumption_date DESC
LIMIT 10;


-- ============================================
-- 4. ADICIONAR DADOS MANUALMENTE
-- ============================================

-- Adicionar uma NOVA COMPRA (modifique produto e quantidade)
INSERT INTO purchases (product_name, quantity, purchase_date)
VALUES ('Leite', 2, CURRENT_DATE);
-- Depois execute: SELECT * FROM calculate_consumption_patterns();

-- Adicionar compra NO PASSADO (simular que comprou há X dias)
INSERT INTO purchases (product_name, quantity, purchase_date)
VALUES ('Café', 1, CURRENT_DATE - INTERVAL '7 days');
-- Depois execute: SELECT * FROM calculate_consumption_patterns();

-- Adicionar um CONSUMO
INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity, consumption_date)
VALUES ('Leite', 1, 1, CURRENT_DATE);
-- Depois execute: SELECT * FROM calculate_consumption_patterns();

-- Adicionar consumo NO PASSADO
INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity, consumption_date)
VALUES ('Pão', 1, 0, CURRENT_DATE - INTERVAL '3 days');
-- Depois execute: SELECT * FROM calculate_consumption_patterns();


-- ============================================
-- 5. MANIPULAR DATAS (SIMULAR PASSAGEM DO TEMPO)
-- ============================================

-- Fazer parecer que TODAS as compras foram há mais tempo
UPDATE purchases 
SET purchase_date = purchase_date - INTERVAL '7 days';
SELECT * FROM calculate_consumption_patterns();
-- ATENÇÃO: Isso afeta TODOS os produtos!

-- Fazer parecer que UM produto foi comprado há mais tempo
UPDATE purchases 
SET purchase_date = purchase_date - INTERVAL '5 days'
WHERE product_name = 'Leite';
SELECT * FROM calculate_consumption_patterns();

-- Fazer parecer que um produto foi comprado HOJE (resetar)
UPDATE purchases 
SET purchase_date = CURRENT_DATE
WHERE product_name = 'Café' AND purchase_date = (
  SELECT MAX(purchase_date) FROM purchases WHERE product_name = 'Café'
);
SELECT * FROM calculate_consumption_patterns();

-- Avançar a previsão de um produto (simular urgência)
UPDATE consumption_patterns
SET 
  predicted_next_purchase_date = CURRENT_DATE,
  days_until_next_purchase = 0
WHERE product_name = 'Leite';
-- Agora 'Leite' aparece como URGENTE na lista!


-- ============================================
-- 6. EDITAR/CORRIGIR DADOS
-- ============================================

-- Corrigir quantidade de uma compra específica
UPDATE purchases 
SET quantity = 3
WHERE product_name = 'Leite' 
  AND purchase_date = CURRENT_DATE;
SELECT * FROM calculate_consumption_patterns();

-- Deletar última compra de um produto
DELETE FROM purchases 
WHERE id = (
  SELECT id FROM purchases 
  WHERE product_name = 'Café' 
  ORDER BY purchase_date DESC 
  LIMIT 1
);
SELECT * FROM calculate_consumption_patterns();

-- Deletar TODAS as compras de um produto
DELETE FROM purchases WHERE product_name = 'Pão';
DELETE FROM consumption WHERE product_name = 'Pão';
SELECT * FROM calculate_consumption_patterns();


-- ============================================
-- 7. LIMPAR E RESETAR
-- ============================================

-- Limpar TUDO (começar do zero)
SELECT clear_all_data();

-- Limpar apenas um produto específico
DELETE FROM consumption_patterns WHERE product_name = 'Leite';
DELETE FROM consumption WHERE product_name = 'Leite';
DELETE FROM purchases WHERE product_name = 'Leite';

-- Recalcular padrões (sempre após modificações)
SELECT * FROM calculate_consumption_patterns();


-- ============================================
-- 8. POPULAR RAPIDAMENTE
-- ============================================

-- Popular com dados de teste (Leite e Pão)
SELECT seed_test_data();

-- Popular com despensa completa (use o arquivo quick-seed.sql)
-- Ou copie e cole o conteúdo daquele arquivo


-- ============================================
-- 9. ANÁLISES E ESTATÍSTICAS
-- ============================================

-- Produtos por urgência
SELECT 
  product_name,
  days_until_next_purchase,
  CASE 
    WHEN days_until_next_purchase < 0 THEN '🔴 ATRASADO!'
    WHEN days_until_next_purchase = 0 THEN '🔴 COMPRAR HOJE'
    WHEN days_until_next_purchase <= 2 THEN '🟡 PRÓXIMOS DIAS'
    WHEN days_until_next_purchase <= 7 THEN '🟢 ESTA SEMANA'
    ELSE '✅ OK'
  END as status
FROM consumption_patterns
ORDER BY days_until_next_purchase;

-- Produtos com mais compras (mais usados)
SELECT 
  product_name,
  total_purchases as "Total de Compras",
  ROUND(average_days_between_purchases, 1) as "Dias entre compras",
  ROUND(confidence_score * 100) || '%' as "Confiança"
FROM consumption_patterns
ORDER BY total_purchases DESC;

-- Produtos com padrões mais estáveis (maior confiança)
SELECT 
  product_name,
  ROUND(confidence_score * 100) || '%' as "Confiança",
  total_purchases as "Baseado em X compras"
FROM consumption_patterns
ORDER BY confidence_score DESC;

-- Média geral de dias entre compras
SELECT 
  ROUND(AVG(average_days_between_purchases), 1) as "Média de dias entre todas as compras"
FROM consumption_patterns;

-- Total de produtos monitorados
SELECT COUNT(*) as "Total de produtos com padrão" 
FROM consumption_patterns;

-- Produtos que consomem mais rápido (menor intervalo)
SELECT 
  product_name,
  ROUND(average_days_between_purchases, 1) as "Dias até acabar"
FROM consumption_patterns
ORDER BY average_days_between_purchases ASC
LIMIT 5;


-- ============================================
-- 10. TESTES ESPECÍFICOS
-- ============================================

-- Teste: Ver se trigger está funcionando (deve recalcular automaticamente)
INSERT INTO purchases (product_name, quantity) VALUES ('Teste', 1);
SELECT * FROM v_patterns_summary WHERE product_name = 'Teste';
-- Resultado: Vazio (precisa de 2 compras)

INSERT INTO purchases (product_name, quantity, purchase_date) 
VALUES ('Teste', 1, CURRENT_DATE - INTERVAL '5 days');
SELECT * FROM v_patterns_summary WHERE product_name = 'Teste';
-- Resultado: Deve aparecer com padrão de 5 dias!

-- Limpar teste
DELETE FROM purchases WHERE product_name = 'Teste';
SELECT * FROM calculate_consumption_patterns();


-- ============================================
-- 11. EXPORT/BACKUP (útil antes de testes destrutivos)
-- ============================================

-- Ver todos os dados em formato JSON-like
SELECT jsonb_pretty(jsonb_agg(row_to_json(p.*))) as purchases_backup
FROM purchases p;

SELECT jsonb_pretty(jsonb_agg(row_to_json(c.*))) as consumption_backup
FROM consumption c;

-- Para restaurar: copie os INSERTs gerados acima


-- ============================================
-- 12. DEBUG: VER DADOS RAW
-- ============================================

-- Ver TODAS as compras (raw)
SELECT * FROM purchases ORDER BY purchase_date DESC;

-- Ver TODOS os consumos (raw)
SELECT * FROM consumption ORDER BY consumption_date DESC;

-- Ver TODOS os padrões (raw)
SELECT * FROM consumption_patterns ORDER BY days_until_next_purchase;

-- Ver contagem
SELECT 
  (SELECT COUNT(*) FROM purchases) as total_purchases,
  (SELECT COUNT(*) FROM consumption) as total_consumptions,
  (SELECT COUNT(*) FROM consumption_patterns) as total_patterns;


-- ============================================
-- DICAS DE USO:
-- ============================================
-- 1. Sempre execute calculate_consumption_patterns() após modificar dados
-- 2. Use v_patterns_summary para ver visão geral
-- 3. Use get_shopping_suggestions() para testar lista de compras
-- 4. Manipule datas com UPDATE ... SET purchase_date = ...
-- 5. Use clear_all_data() para começar do zero
-- ============================================
