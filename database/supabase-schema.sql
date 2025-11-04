-- Schema do Supabase para Machine Learning
-- Execute estes comandos no SQL Editor do Supabase

-- 1. Tabela de usuários (se não existir)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de produtos únicos
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR NOT NULL,
    standardized_name VARCHAR NOT NULL,
    category VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(standardized_name)
);

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- Tabela de compras (purchases)
-- Registra toda vez que um produto é adicionado à despensa
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user', -- Simplificado para testes
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_product ON purchases(user_id, product_name);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date DESC);

-- Tabela de consumo (consumption)
-- Registra toda vez que um produto é consumido/usado
CREATE TABLE IF NOT EXISTS consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user', -- Simplificado para testes
  product_name TEXT NOT NULL,
  quantity_consumed INTEGER NOT NULL,
  remaining_quantity INTEGER NOT NULL DEFAULT 0,
  consumption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_consumption_user_product ON consumption(user_id, product_name);
CREATE INDEX IF NOT EXISTS idx_consumption_date ON consumption(consumption_date DESC);

-- 4. Tabela de consumos (quando produto é consumido)
CREATE TABLE IF NOT EXISTS consumptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_consumed DECIMAL NOT NULL,
    consumption_date DATE NOT NULL,
    remaining_quantity DECIMAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de padrões de consumo (calculados pela IA)
CREATE TABLE IF NOT EXISTS consumption_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Métricas de consumo
    average_consumption_rate DECIMAL NOT NULL, -- unidades por dia
    purchase_frequency_days DECIMAL NOT NULL, -- a cada X dias compra
    last_purchase_date DATE,
    last_consumption_date DATE,
    
    -- Totais históricos
    total_purchased DECIMAL NOT NULL DEFAULT 0,
    total_consumed DECIMAL NOT NULL DEFAULT 0,
    purchase_count INTEGER NOT NULL DEFAULT 0,
    consumption_count INTEGER NOT NULL DEFAULT 0,
    
    -- Métricas de qualidade
    pattern_confidence DECIMAL NOT NULL DEFAULT 0, -- 0-1
    prediction_accuracy DECIMAL NOT NULL DEFAULT 0, -- 0-1
    seasonality_factor DECIMAL NOT NULL DEFAULT 1, -- 0.5-2.0
    
    -- Status de predição
    days_until_next_purchase DECIMAL,
    should_suggest BOOLEAN DEFAULT FALSE,
    suggestion_priority VARCHAR DEFAULT 'medium', -- 'high', 'medium', 'low'
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 6. Tabela de sugestões geradas
CREATE TABLE IF NOT EXISTS shopping_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    suggested_quantity DECIMAL NOT NULL,
    priority VARCHAR NOT NULL, -- 'high', 'medium', 'low'
    reason VARCHAR NOT NULL, -- 'pattern', 'low_stock', 'expired'
    confidence DECIMAL NOT NULL,
    
    suggested_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_date ON purchases(user_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_consumptions_user_date ON consumptions(user_id, consumption_date DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_user ON consumption_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_user_date ON shopping_suggestions(user_id, suggested_date DESC);

-- 8. Função para calcular padrões automaticamente
CREATE OR REPLACE FUNCTION calculate_consumption_patterns()
RETURNS TRIGGER AS $$
DECLARE
    pattern_record consumption_patterns;
    avg_days_between_purchases DECIMAL;
    consumption_rate DECIMAL;
    confidence_score DECIMAL;
BEGIN
    -- Busca ou cria padrão para este usuário/produto
    SELECT * INTO pattern_record 
    FROM consumption_patterns 
    WHERE user_id = NEW.user_id AND product_id = NEW.product_id;
    
    -- Calcula intervalo médio entre compras
    SELECT AVG(
        EXTRACT(DAYS FROM (purchase_date - LAG(purchase_date) OVER (ORDER BY purchase_date)))
    ) INTO avg_days_between_purchases
    FROM purchases 
    WHERE user_id = NEW.user_id AND product_id = NEW.product_id
    AND purchase_date >= CURRENT_DATE - INTERVAL '90 days';
    
    -- Calcula taxa de consumo
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 AND MAX(consumption_date) > MIN(consumption_date) THEN
                SUM(quantity_consumed) / EXTRACT(DAYS FROM (MAX(consumption_date) - MIN(consumption_date)))
            ELSE 0.5 -- padrão
        END
    INTO consumption_rate
    FROM consumptions 
    WHERE user_id = NEW.user_id AND product_id = NEW.product_id
    AND consumption_date >= CURRENT_DATE - INTERVAL '90 days';
    
    -- Calcula confiança baseada na quantidade de dados
    SELECT LEAST(1.0, (COUNT(*) * 1.0) / 10) INTO confidence_score
    FROM purchases 
    WHERE user_id = NEW.user_id AND product_id = NEW.product_id;
    
    -- Atualiza ou insere padrão
    INSERT INTO consumption_patterns (
        user_id, product_id, 
        average_consumption_rate,
        purchase_frequency_days,
        pattern_confidence,
        last_purchase_date
    ) VALUES (
        NEW.user_id, NEW.product_id,
        COALESCE(consumption_rate, 0.5),
        COALESCE(avg_days_between_purchases, 7),
        COALESCE(confidence_score, 0),
        NEW.purchase_date
    )
    ON CONFLICT (user_id, product_id) 
    DO UPDATE SET
        average_consumption_rate = COALESCE(consumption_rate, 0.5),
        purchase_frequency_days = COALESCE(avg_days_between_purchases, 7),
        pattern_confidence = COALESCE(confidence_score, 0),
        last_purchase_date = NEW.purchase_date,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para atualizar padrões automaticamente
DROP TRIGGER IF EXISTS trigger_update_patterns_on_purchase ON purchases;
CREATE TRIGGER trigger_update_patterns_on_purchase
    AFTER INSERT ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION calculate_consumption_patterns();

-- 10. Função para gerar sugestões automáticas
CREATE OR REPLACE FUNCTION generate_smart_suggestions(target_user_id UUID)
RETURNS TABLE (
    product_name VARCHAR,
    suggested_quantity DECIMAL,
    priority VARCHAR,
    days_until_needed INTEGER,
    confidence DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name,
        CEIL(cp.average_consumption_rate * cp.purchase_frequency_days) as suggested_quantity,
        CASE 
            WHEN (CURRENT_DATE - cp.last_purchase_date) >= (cp.purchase_frequency_days - 1) THEN 'high'
            WHEN (CURRENT_DATE - cp.last_purchase_date) >= (cp.purchase_frequency_days - 2) THEN 'medium'
            ELSE 'low'
        END as priority,
        (cp.purchase_frequency_days - (CURRENT_DATE - cp.last_purchase_date))::INTEGER as days_until_needed,
        cp.pattern_confidence
    FROM consumption_patterns cp
    JOIN products p ON cp.product_id = p.id
    WHERE cp.user_id = target_user_id
    AND cp.pattern_confidence > 0.3
    AND (CURRENT_DATE - cp.last_purchase_date) >= (cp.purchase_frequency_days - 2)
    ORDER BY 
        CASE 
            WHEN (CURRENT_DATE - cp.last_purchase_date) >= (cp.purchase_frequency_days - 1) THEN 1
            WHEN (CURRENT_DATE - cp.last_purchase_date) >= (cp.purchase_frequency_days - 2) THEN 2
            ELSE 3
        END,
        cp.pattern_confidence DESC;
END;
$$ LANGUAGE plpgsql;

-- 11. Policies para Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies básicas (usuário só acessa seus próprios dados)
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Users can manage own purchases" ON purchases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own consumptions" ON consumptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own patterns" ON consumption_patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own suggestions" ON shopping_suggestions FOR ALL USING (auth.uid() = user_id);