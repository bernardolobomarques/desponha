// Adaptador para integrar sistema local com Supabase
import type { PantryItemGroup, ShoppingListItem, ConsumptionRecord } from '../types';
import { Priority } from '../types';

// Interface que funciona com ou sem Supabase
export interface MLServiceAdapter {
  // Registra compra quando item é adicionado
  recordPurchase(productName: string, quantity: number, expiryDate?: string): Promise<void>;
  
  // Registra consumo quando usuário consome produto
  recordConsumption(productName: string, quantityConsumed: number, remainingQuantity: number): Promise<void>;
  
  // Gera sugestões inteligentes para lista de compras
  generateSmartSuggestions(pantryItems: PantryItemGroup[]): Promise<ShoppingListItem[]>;
  
  // Analisa padrão específico de um produto
  analyzeProductPattern(productName: string): Promise<{
    averageDaysBetweenPurchases: number;
    consumptionRate: number;
    confidence: number;
    nextPurchaseRecommendation: {
      shouldBuyIn: number;
      urgency: 'high' | 'medium' | 'low';
      confidence: number;
    };
  }>;
  
  // Estatísticas para UI
  getStats(): Promise<{
    totalProducts: number;
    totalRecords: number;
    averageAccuracy: number;
    topProducts: string[];
  }>;
}

// Implementação usando localStorage (sistema atual)
export class LocalMLService implements MLServiceAdapter {
  private purchases: Array<{
    productName: string;
    quantity: number;
    date: string;
    expiryDate?: string;
  }> = [];
  
  private consumptions: ConsumptionRecord[] = [];
  
  private patterns: Map<string, {
    productName: string;
    purchaseFrequencyDays: number;
    consumptionRate: number;
    lastPurchaseDate: string;
    confidence: number;
    totalPurchases: number;
    totalConsumptions: number;
  }> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const purchases = localStorage.getItem('ml_purchases');
      const consumptions = localStorage.getItem('ml_consumptions'); 
      const patterns = localStorage.getItem('ml_patterns');
      
      if (purchases) this.purchases = JSON.parse(purchases);
      if (consumptions) this.consumptions = JSON.parse(consumptions);
      if (patterns) this.patterns = new Map(JSON.parse(patterns));
    } catch (error) {
      console.warn('Erro ao carregar dados ML:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('ml_purchases', JSON.stringify(this.purchases));
      localStorage.setItem('ml_consumptions', JSON.stringify(this.consumptions));
      localStorage.setItem('ml_patterns', JSON.stringify([...this.patterns.entries()]));
    } catch (error) {
      console.warn('Erro ao salvar dados ML:', error);
    }
  }

  async recordPurchase(productName: string, quantity: number, expiryDate?: string): Promise<void> {
    const purchase = {
      productName,
      quantity,
      date: new Date().toISOString().split('T')[0],
      expiryDate
    };
    
    this.purchases.push(purchase);
    this.updatePattern(productName);
    this.saveToStorage();
  }

  async recordConsumption(productName: string, quantityConsumed: number, remainingQuantity: number): Promise<void> {
    const consumption: ConsumptionRecord = {
      itemName: productName,
      consumedQuantity: quantityConsumed,
      consumedDate: new Date().toISOString().split('T')[0],
      remainingQuantity
    };
    
    this.consumptions.push(consumption);
    this.updatePattern(productName);
    this.saveToStorage();
  }

  private updatePattern(productName: string): void {
    const productPurchases = this.purchases.filter(p => p.productName === productName);
    const productConsumptions = this.consumptions.filter(c => c.itemName === productName);
    
    if (productPurchases.length < 2) return; // Precisa de pelo menos 2 compras para padrão

    // Calcula intervalo médio entre compras
    const purchaseDates = productPurchases.map(p => new Date(p.date)).sort((a, b) => a.getTime() - b.getTime());
    const intervals: number[] = [];
    
    for (let i = 1; i < purchaseDates.length; i++) {
      const days = (purchaseDates[i].getTime() - purchaseDates[i-1].getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }
    
    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    // Calcula taxa de consumo
    let consumptionRate = 0.5; // padrão
    if (productConsumptions.length > 0) {
      const totalConsumed = productConsumptions.reduce((sum, c) => sum + c.consumedQuantity, 0);
      const firstConsumption = new Date(productConsumptions[0].consumedDate);
      const lastConsumption = new Date(productConsumptions[productConsumptions.length - 1].consumedDate);
      const daysDiff = (lastConsumption.getTime() - firstConsumption.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 0) {
        consumptionRate = totalConsumed / daysDiff;
      }
    }
    
    // Calcula confiança baseada na quantidade de dados
    const confidence = Math.min(1, (productPurchases.length + productConsumptions.length) / 10);
    
    this.patterns.set(productName, {
      productName,
      purchaseFrequencyDays: averageInterval,
      consumptionRate,
      lastPurchaseDate: productPurchases[productPurchases.length - 1].date,
      confidence,
      totalPurchases: productPurchases.length,
      totalConsumptions: productConsumptions.length
    });
  }

  async generateSmartSuggestions(pantryItems: PantryItemGroup[]): Promise<ShoppingListItem[]> {
    const suggestions: ShoppingListItem[] = [];
    const today = new Date();
    
    // Analisa cada padrão para ver se deve sugerir compra
    for (const [productName, pattern] of this.patterns.entries()) {
      const daysSinceLastPurchase = Math.floor(
        (today.getTime() - new Date(pattern.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Verifica se está próximo ao dia de compra baseado no padrão
      const shouldBuyIn = pattern.purchaseFrequencyDays - daysSinceLastPurchase;
      
      // Se deve comprar hoje ou amanhã (com confiança > 30%)
      if (shouldBuyIn <= 2 && pattern.confidence > 0.3) {
        let priority: Priority = Priority.Medium;
        if (shouldBuyIn <= 0) priority = Priority.High;
        else if (shouldBuyIn <= 1) priority = Priority.High;
        else if (shouldBuyIn <= 2) priority = Priority.Medium;
        
        suggestions.push({
          id: `ml-${productName}`,
          name: productName,
          suggestedQuantity: Math.ceil(pattern.consumptionRate * pattern.purchaseFrequencyDays),
          priority,
          reason: 'consumption_pattern',
          estimatedNeed: Math.max(0, shouldBuyIn),
          lastConsumed: this.consumptions
            .filter(c => c.itemName === productName)
            .sort((a, b) => b.consumedDate.localeCompare(a.consumedDate))[0]?.consumedDate
        });
      }
    }
    
    // Adiciona sugestões básicas para itens com estoque baixo
    pantryItems.forEach(group => {
      const totalQuantity = group.instances.reduce((sum, inst) => sum + inst.quantity, 0);
      
      if (totalQuantity <= 1 && !suggestions.find(s => s.name === group.name)) {
        suggestions.push({
          id: `low-stock-${group.id}`,
          name: group.name,
          suggestedQuantity: 3,
          priority: Priority.High,
          reason: 'low_stock',
          estimatedNeed: 1
        });
      }
    });
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { [Priority.High]: 3, [Priority.Medium]: 2, [Priority.Low]: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      if (a.estimatedNeed && b.estimatedNeed) return a.estimatedNeed - b.estimatedNeed;
      return 0;
    });
  }

  async analyzeProductPattern(productName: string): Promise<{
    averageDaysBetweenPurchases: number;
    consumptionRate: number;
    confidence: number;
    nextPurchaseRecommendation: {
      shouldBuyIn: number;
      urgency: 'high' | 'medium' | 'low';
      confidence: number;
    };
  }> {
    const pattern = this.patterns.get(productName);
    
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
    
    const daysSinceLastPurchase = Math.floor(
      (Date.now() - new Date(pattern.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const shouldBuyIn = Math.max(0, pattern.purchaseFrequencyDays - daysSinceLastPurchase);
    
    let urgency: 'high' | 'medium' | 'low' = 'low';
    if (shouldBuyIn <= 0) urgency = 'high';
    else if (shouldBuyIn <= 1) urgency = 'high';
    else if (shouldBuyIn <= 2) urgency = 'medium';
    
    return {
      averageDaysBetweenPurchases: pattern.purchaseFrequencyDays,
      consumptionRate: pattern.consumptionRate,
      confidence: pattern.confidence,
      nextPurchaseRecommendation: {
        shouldBuyIn,
        urgency,
        confidence: pattern.confidence
      }
    };
  }

  async getStats(): Promise<{
    totalProducts: number;
    totalRecords: number;
    averageAccuracy: number;
    topProducts: string[];
  }> {
    const patterns = Array.from(this.patterns.values());
    const averageAccuracy = patterns.length > 0 ? 
      patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 0;
    
    const topProducts = patterns
      .sort((a, b) => b.totalConsumptions - a.totalConsumptions)
      .slice(0, 5)
      .map(p => p.productName);
    
    return {
      totalProducts: patterns.length,
      totalRecords: this.purchases.length + this.consumptions.length,
      averageAccuracy,
      topProducts
    };
  }
}

// Factory que retorna o serviço correto baseado na configuração
export function createMLService(): MLServiceAdapter {
  // Se tiver configuração do Supabase, use SupabaseMLService
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (hasSupabase) {
    // Lazy load do Supabase service para evitar erro de módulo não encontrado
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { SupabaseMLServiceAdapter } = require('./supabaseMLAdapter');
      return new SupabaseMLServiceAdapter();
    } catch (error) {
      console.warn('Supabase não configurado, usando storage local:', error);
      return new LocalMLService();
    }
  }
  
  return new LocalMLService();
}

// Instância singleton
export const mlService = createMLService();