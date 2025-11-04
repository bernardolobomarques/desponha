-- ============================================
-- CORREÇÃO FINAL: Adicionar versão com parâmetro
-- ============================================
-- Cria versão da função que aceita user_id
-- mantendo compatibilidade com versão sem parâmetros
-- ============================================

-- Versão COM parâmetro user_id (para o trigger)
CREATE OR REPLACE FUNCTION calculate_consumption_patterns(p_user_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Limpa padrões antigos apenas deste usuário
  DELETE FROM consumption_patterns WHERE user_id = p_user_id;
  
  -- Calcula novos padrões apenas para este usuário
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
      pu.user_id,
      pu.product_name,
      pu.purchase_date,
      LAG(pu.purchase_date) OVER (
        PARTITION BY pu.user_id, pu.product_name 
        ORDER BY pu.purchase_date
      ) as prev_date
    FROM purchases pu
    WHERE pu.user_id = p_user_id  -- Filtrar apenas este usuário
  ) p
  LEFT JOIN consumption c ON 
    c.user_id = p.user_id AND 
    c.product_name = p.product_name
  WHERE p.prev_date IS NOT NULL  -- Precisa de pelo menos 2 compras
  GROUP BY p.user_id, p.product_name
  HAVING COUNT(*) >= 2;  -- Mínimo 2 compras para criar padrão
  
  RAISE NOTICE 'Padrões recalculados para user_id: %', p_user_id;
END;
$$;

-- Manter versão SEM parâmetro (para compatibilidade)
CREATE OR REPLACE FUNCTION calculate_consumption_patterns()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Limpa padrões antigos
  DELETE FROM consumption_patterns;
  
  -- Calcula novos padrões para TODOS os usuários
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
    ROUND(AVG(
      CASE 
        WHEN p.prev_date IS NOT NULL 
        THEN (p.purchase_date - p.prev_date)
        ELSE NULL 
      END
    )::NUMERIC, 2) as avg_days,
    MAX(p.purchase_date) as last_purchase,
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
    COUNT(*) as total_purchases,
    COALESCE(SUM(c.quantity_consumed), 0) as total_consumed,
    LEAST(COUNT(*)::NUMERIC / 5.0, 1.0) as confidence,
    NOW() as updated_at
  FROM (
    SELECT 
      pu.user_id,
      pu.product_name,
      pu.purchase_date,
      LAG(pu.purchase_date) OVER (
        PARTITION BY pu.user_id, pu.product_name 
        ORDER BY pu.purchase_date
      ) as prev_date
    FROM purchases pu
  ) p
  LEFT JOIN consumption c ON 
    c.user_id = p.user_id AND 
    c.product_name = p.product_name
  WHERE p.prev_date IS NOT NULL
  GROUP BY p.user_id, p.product_name
  HAVING COUNT(*) >= 2;
  
  RAISE NOTICE 'Padrões recalculados para todos os usuários';
END;
$$;

-- Verificar que as funções foram criadas
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'calculate_consumption_patterns'
  AND routine_schema = 'public';
