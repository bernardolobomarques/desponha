import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Tipos do banco de dados
export interface DBProduct {
  id: string;
  name: string;
  standardized_name: string;
  category?: string;
}

export interface DBPurchase {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  purchase_date: string;
  expiry_date?: string;
  price?: number;
  source: 'receipt' | 'manual';
}

export interface DBConsumption {
  id: string;
  user_id: string;
  product_id: string;
  quantity_consumed: number;
  consumption_date: string;
  remaining_quantity: number;
}

export interface DBConsumptionPattern {
  id: string;
  user_id: string;
  product_id: string;
  average_consumption_rate: number;
  purchase_frequency_days: number;
  last_purchase_date?: string;
  last_consumption_date?: string;
  total_purchased: number;
  total_consumed: number;
  purchase_count: number;
  consumption_count: number;
  pattern_confidence: number;
  prediction_accuracy: number;
  seasonality_factor: number;
  days_until_next_purchase?: number;
  should_suggest: boolean;
  suggestion_priority: 'high' | 'medium' | 'low';
}

export interface SmartSuggestion {
  product_name: string;
  suggested_quantity: number;
  priority: 'high' | 'medium' | 'low';
  days_until_needed: number;
  confidence: number;
}

class SupabaseMLService {
  private supabase: SupabaseClient;
  private userId: string | null = null;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Escuta mudanças de autenticação
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.userId = session?.user?.id || null;
    });
  }

  // Garante que usuário está autenticado
  private async ensureAuth(): Promise<string> {
    if (this.userId) return this.userId;

    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    
    this.userId = user.id;
    return this.userId;
  }

  // Busca ou cria produto
  async getOrCreateProduct(name: string, standardizedName: string, category?: string): Promise<string> {
    // Primeiro tenta buscar pelo nome padronizado
    const { data: existing } = await this.supabase
      .from('products')
      .select('id')
      .eq('standardized_name', standardizedName)
      .single();

    if (existing) return existing.id;

    // Se não existe, cria novo
    const { data: newProduct, error } = await this.supabase
      .from('products')
      .insert({
        name,
        standardized_name: standardizedName,
        category
      })
      .select('id')
      .single();

    if (error) throw error;
    return newProduct.id;
  }

  // Registra uma compra
  async recordPurchase(
    productName: string, 
    standardizedName: string,
    quantity: number, 
    expiryDate?: string,
    price?: number,
    source: 'receipt' | 'manual' = 'manual'
  ): Promise<void> {
    const userId = await this.ensureAuth();
    const productId = await this.getOrCreateProduct(productName, standardizedName);

    const { error } = await this.supabase.from('purchases').insert({
      user_id: userId,
      product_id: productId,
      quantity,
      purchase_date: new Date().toISOString().split('T')[0],
      expiry_date: expiryDate,
      price,
      source
    });

    if (error) throw error;

    // Trigger automático irá recalcular padrões
  }

  // Registra um consumo
  async recordConsumption(
    productName: string,
    standardizedName: string,
    quantityConsumed: number,
    remainingQuantity: number
  ): Promise<void> {
    const userId = await this.ensureAuth();
    const productId = await this.getOrCreateProduct(productName, standardizedName);

    const { error } = await this.supabase.from('consumptions').insert({
      user_id: userId,
      product_id: productId,
      quantity_consumed: quantityConsumed,
      consumption_date: new Date().toISOString().split('T')[0],
      remaining_quantity: remainingQuantity
    });

    if (error) throw error;
  }

  // Busca padrões do usuário
  async getUserPatterns(): Promise<DBConsumptionPattern[]> {
    const userId = await this.ensureAuth();

    const { data, error } = await this.supabase
      .from('consumption_patterns')
      .select(`
        *,
        products (
          name,
          standardized_name
        )
      `)
      .eq('user_id', userId)
      .order('pattern_confidence', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Gera sugestões inteligentes
  async generateSmartSuggestions(): Promise<SmartSuggestion[]> {
    const userId = await this.ensureAuth();

    const { data, error } = await this.supabase.rpc('generate_smart_suggestions', {
      target_user_id: userId
    });

    if (error) {
      console.warn('Erro ao gerar sugestões inteligentes:', error);
      return [];
    }

    return data || [];
  }

  // Busca histórico de compras
  async getPurchaseHistory(productName?: string, days: number = 90): Promise<DBPurchase[]> {
    const userId = await this.ensureAuth();
    
    let query = this.supabase
      .from('purchases')
      .select(`
        *,
        products (
          name,
          standardized_name
        )
      `)
      .eq('user_id', userId)
      .gte('purchase_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('purchase_date', { ascending: false });

    if (productName) {
      const productId = await this.getOrCreateProduct(productName, productName);
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Busca histórico de consumo
  async getConsumptionHistory(productName?: string, days: number = 90): Promise<DBConsumption[]> {
    const userId = await this.ensureAuth();

    let query = this.supabase
      .from('consumptions')
      .select(`
        *,
        products (
          name,
          standardized_name
        )
      `)
      .eq('user_id', userId)
      .gte('consumption_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('consumption_date', { ascending: false });

    if (productName) {
      const productId = await this.getOrCreateProduct(productName, productName);
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Analisa padrão específico de um produto
  async analyzeProductPattern(productName: string): Promise<{
    averageDaysBetweenPurchases: number;
    consumptionRate: number;
    confidence: number;
    nextPurchaseRecommendation: {
      shouldBuyIn: number; // dias
      urgency: 'high' | 'medium' | 'low';
      confidence: number;
    };
  }> {
    const userId = await this.ensureAuth();
    const productId = await this.getOrCreateProduct(productName, productName);

    // Busca padrão existente
    const { data: pattern } = await this.supabase
      .from('consumption_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (!pattern) {
      return {
        averageDaysBetweenPurchases: 7,
        consumptionRate: 0.5,
        confidence: 0,
        nextPurchaseRecommendation: {
          shouldBuyIn: 7,
          urgency: 'medium',
          confidence: 0
        }
      };
    }

    const daysSinceLastPurchase = pattern.last_purchase_date ? 
      Math.floor((Date.now() - new Date(pattern.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const shouldBuyIn = Math.max(0, pattern.purchase_frequency_days - daysSinceLastPurchase);
    
    let urgency: 'high' | 'medium' | 'low' = 'low';
    if (shouldBuyIn <= 1) urgency = 'high';
    else if (shouldBuyIn <= 2) urgency = 'medium';

    return {
      averageDaysBetweenPurchases: pattern.purchase_frequency_days,
      consumptionRate: pattern.average_consumption_rate,
      confidence: pattern.pattern_confidence,
      nextPurchaseRecommendation: {
        shouldBuyIn,
        urgency,
        confidence: pattern.pattern_confidence
      }
    };
  }

  // Estatísticas gerais do usuário
  async getUserStats(): Promise<{
    totalProducts: number;
    totalPurchases: number;
    totalConsumptions: number;
    averageAccuracy: number;
    topProducts: string[];
  }> {
    const userId = await this.ensureAuth();

    const [purchases, consumptions, patterns] = await Promise.all([
      this.supabase.from('purchases').select('id').eq('user_id', userId),
      this.supabase.from('consumptions').select('id').eq('user_id', userId),
      this.supabase
        .from('consumption_patterns')
        .select(`
          prediction_accuracy,
          products (name)
        `)
        .eq('user_id', userId)
        .order('total_consumed', { ascending: false })
        .limit(5)
    ]);

    const averageAccuracy = patterns.data?.length ? 
      patterns.data.reduce((sum, p) => sum + p.prediction_accuracy, 0) / patterns.data.length : 0;

    const topProducts = patterns.data?.map(p => (p as any).products.name) || [];

    return {
      totalProducts: patterns.data?.length || 0,
      totalPurchases: purchases.data?.length || 0,
      totalConsumptions: consumptions.data?.length || 0,
      averageAccuracy,
      topProducts
    };
  }

  // Limpa dados antigos
  async cleanOldData(days: number = 180): Promise<void> {
    const userId = await this.ensureAuth();
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await Promise.all([
      this.supabase
        .from('purchases')
        .delete()
        .eq('user_id', userId)
        .lt('purchase_date', cutoffDate),
      this.supabase
        .from('consumptions')
        .delete()
        .eq('user_id', userId)
        .lt('consumption_date', cutoffDate)
    ]);
  }
}

export const supabaseML = new SupabaseMLService();