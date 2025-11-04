import type { PantryItemGroup, ShoppingListItem, ConsumptionRecord } from '../types';
import { Priority } from '../types';
import { mlService } from './mlServiceAdapter';

// Interface para dados históricos de consumo
export interface ConsumptionPattern {
  itemName: string;
  averageConsumptionRate: number; // unidades por dia
  lastPurchaseDate: string;
  lastConsumedDate: string;
  totalPurchased: number;
  totalConsumed: number;
  seasonalityFactor: number; // 0.5 - 2.0 (multiplicador sazonal)
  urgencyScore: number; // 0-100
  predictionAccuracy: number; // 0-1 (histórico de acerto das predições)
}

// Interface para configurações do algoritmo
export interface MLConfig {
  minDataPoints: number; // mínimo de dados para fazer predições
  defaultConsumptionRate: number; // taxa padrão para novos produtos
  urgencyThreshold: {
    high: number;    // dias restantes para prioridade alta
    medium: number;  // dias restantes para prioridade média
  };
  seasonalityWindow: number; // dias para análise sazonal
}

const DEFAULT_CONFIG: MLConfig = {
  minDataPoints: 3,
  defaultConsumptionRate: 0.5, // meio produto por dia por padrão
  urgencyThreshold: {
    high: 3,
    medium: 7
  },
  seasonalityWindow: 30
};

export class SmartShoppingListEngine {
  private consumptionHistory: ConsumptionRecord[] = [];
  private patterns: Map<string, ConsumptionPattern> = new Map();
  private config: MLConfig;

  constructor(config: Partial<MLConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromStorage();
  }

  // Carrega dados do localStorage
  private loadFromStorage(): void {
    try {
      const savedHistory = localStorage.getItem('consumptionHistory');
      const savedPatterns = localStorage.getItem('consumptionPatterns');
      
      if (savedHistory) {
        this.consumptionHistory = JSON.parse(savedHistory);
      }
      
      if (savedPatterns) {
        const patternsArray = JSON.parse(savedPatterns);
        this.patterns = new Map(patternsArray);
      }
    } catch (error) {
      console.warn('Erro ao carregar histórico de consumo:', error);
    }
  }

  // Salva dados no localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem('consumptionHistory', JSON.stringify(this.consumptionHistory));
      localStorage.setItem('consumptionPatterns', JSON.stringify([...this.patterns.entries()]));
    } catch (error) {
      console.warn('Erro ao salvar histórico de consumo:', error);
    }
  }

  // Registra um consumo
  recordConsumption(itemName: string, quantity: number, remainingQuantity: number): void {
    // Registra localmente para compatibilidade
    const record: ConsumptionRecord = {
      itemName,
      consumedQuantity: quantity,
      consumedDate: new Date().toISOString().split('T')[0],
      remainingQuantity
    };

    this.consumptionHistory.push(record);
    this.updatePattern(itemName);
    this.saveToStorage();
    
    // Registra no sistema de ML (Supabase ou local)
    mlService.recordConsumption(itemName, quantity, remainingQuantity).catch(console.error);
  }

  // Registra uma compra (quando item é adicionado)
  recordPurchase(itemName: string, quantity: number, expiryDate?: string): void {
    // Atualiza o padrão quando uma nova compra é feita
    this.updatePurchasePattern(itemName, quantity);
    this.saveToStorage();
    
    // Registra no sistema de ML (Supabase ou local)
    mlService.recordPurchase(itemName, quantity, expiryDate).catch(console.error);
  }

  // Atualiza o padrão de consumo de um item
  private updatePattern(itemName: string): void {
    const itemRecords = this.consumptionHistory.filter(r => r.itemName === itemName);
    
    if (itemRecords.length < 2) {
      // Dados insuficientes, usa padrão básico
      this.patterns.set(itemName, {
        itemName,
        averageConsumptionRate: this.config.defaultConsumptionRate,
        lastPurchaseDate: new Date().toISOString().split('T')[0],
        lastConsumedDate: new Date().toISOString().split('T')[0],
        totalPurchased: 0,
        totalConsumed: itemRecords.reduce((sum, r) => sum + r.consumedQuantity, 0),
        seasonalityFactor: 1.0,
        urgencyScore: 50,
        predictionAccuracy: 0.5
      });
      return;
    }

    // Calcula taxa de consumo média
    const totalConsumed = itemRecords.reduce((sum, r) => sum + r.consumedQuantity, 0);
    const firstRecord = itemRecords[0];
    const lastRecord = itemRecords[itemRecords.length - 1];
    
    const daysBetween = this.daysDifference(firstRecord.consumedDate, lastRecord.consumedDate);
    const averageRate = daysBetween > 0 ? totalConsumed / daysBetween : this.config.defaultConsumptionRate;

    // Calcula sazonalidade (variação nos últimos 30 dias)
    const recentRecords = itemRecords.filter(r => 
      this.daysDifference(r.consumedDate, new Date().toISOString().split('T')[0]) <= this.config.seasonalityWindow
    );
    
    const seasonalityFactor = recentRecords.length > 0 ? 
      (recentRecords.reduce((sum, r) => sum + r.consumedQuantity, 0) / recentRecords.length) / averageRate : 1.0;

    // Atualiza ou cria padrão
    this.patterns.set(itemName, {
      itemName,
      averageConsumptionRate: Math.max(0.1, averageRate), // mínimo 0.1 por dia
      lastPurchaseDate: this.patterns.get(itemName)?.lastPurchaseDate || new Date().toISOString().split('T')[0],
      lastConsumedDate: lastRecord.consumedDate,
      totalPurchased: this.patterns.get(itemName)?.totalPurchased || 0,
      totalConsumed,
      seasonalityFactor: Math.max(0.5, Math.min(2.0, seasonalityFactor)),
      urgencyScore: 50,
      predictionAccuracy: this.calculateAccuracy(itemName)
    });
  }

  // Atualiza padrão de compra
  private updatePurchasePattern(itemName: string, quantity: number): void {
    const current = this.patterns.get(itemName);
    if (current) {
      current.totalPurchased += quantity;
      current.lastPurchaseDate = new Date().toISOString().split('T')[0];
    }
  }

  // Calcula precisão das predições passadas
  private calculateAccuracy(itemName: string): number {
    // Por enquanto retorna um valor médio, mas pode ser melhorado
    // analisando predições anteriores vs realidade
    return 0.7;
  }

  // Calcula diferença em dias entre duas datas
  private daysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Prediz quando um item vai acabar
  predictDepletion(itemName: string, currentQuantity: number): { daysUntilEmpty: number; urgency: 'high' | 'medium' | 'low'; confidence: number } {
    const pattern = this.patterns.get(itemName);
    
    if (!pattern) {
      return {
        daysUntilEmpty: Math.round(currentQuantity / this.config.defaultConsumptionRate),
        urgency: 'medium',
        confidence: 0.3
      };
    }

    // Aplica fator sazonal à taxa de consumo
    const adjustedRate = pattern.averageConsumptionRate * pattern.seasonalityFactor;
    const daysUntilEmpty = Math.round(currentQuantity / adjustedRate);
    
    // Determina urgência
    let urgency: 'high' | 'medium' | 'low' = 'low';
    if (daysUntilEmpty <= this.config.urgencyThreshold.high) urgency = 'high';
    else if (daysUntilEmpty <= this.config.urgencyThreshold.medium) urgency = 'medium';

    return {
      daysUntilEmpty,
      urgency,
      confidence: pattern.predictionAccuracy
    };
  }

  // Gera lista de compras inteligente
  async generateSmartShoppingList(pantryItems: PantryItemGroup[], manualItems: string[] = []): Promise<ShoppingListItem[]> {
    try {
      // Usa o sistema de ML avançado (Supabase ou local aprimorado)
      const smartSuggestions = await mlService.generateSmartSuggestions(pantryItems);
      
      // Adiciona itens manuais
      const manualSuggestions: ShoppingListItem[] = manualItems.map((itemName, index) => ({
        id: `manual-${index}`,
        name: itemName,
        suggestedQuantity: 1,
        priority: Priority.Medium,
        reason: 'manual',
      }));

      return [...smartSuggestions, ...manualSuggestions];
    } catch (error) {
      console.error('Erro ao gerar sugestões inteligentes:', error);
      
      // Fallback para o sistema local original
      return this.generateBasicSuggestions(pantryItems, manualItems);
    }
  }

  // Fallback para sugestões básicas
  private generateBasicSuggestions(pantryItems: PantryItemGroup[], manualItems: string[] = []): ShoppingListItem[] {
    const suggestions: ShoppingListItem[] = [];
    const now = new Date();

    // Analisa itens da despensa
    pantryItems.forEach(group => {
      const totalQuantity = group.instances.reduce((sum, instance) => sum + instance.quantity, 0);
      
      if (totalQuantity <= 0) return; // Ignora itens sem estoque

      // Faz predição para este item
      const prediction = this.predictDepletion(group.name, totalQuantity);
      
      // Adiciona à lista se necessário
      if (prediction.urgency === 'high' || (prediction.urgency === 'medium' && prediction.confidence > 0.5)) {
        const priority: Priority = prediction.urgency === 'high' ? Priority.High : prediction.urgency === 'medium' ? Priority.Medium : Priority.Low;
        
        suggestions.push({
          id: `smart-${group.id}`,
          name: group.name,
          suggestedQuantity: this.calculateOptimalQuantity(group.name, totalQuantity),
          priority,
          reason: 'consumption_pattern',
          estimatedNeed: prediction.daysUntilEmpty,
          lastConsumed: this.patterns.get(group.name)?.lastConsumedDate
        });
      }
    });

    // Adiciona itens manuais
    manualItems.forEach((itemName, index) => {
      suggestions.push({
        id: `manual-${index}`,
        name: itemName,
        suggestedQuantity: 1,
        priority: Priority.Medium,
        reason: 'manual',
      });
    });

    // Ordena por prioridade e urgência
    return suggestions.sort((a, b) => {
      const priorityOrder = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      if (a.estimatedNeed && b.estimatedNeed) return a.estimatedNeed - b.estimatedNeed;
      return 0;
    });
  }

  // Calcula quantidade ótima para comprar
  private calculateOptimalQuantity(itemName: string, currentQuantity: number): number {
    const pattern = this.patterns.get(itemName);
    
    if (!pattern) return 3; // quantidade padrão
    
    // Calcula baseado na taxa de consumo para durar ~2 semanas
    const weeklyConsumption = pattern.averageConsumptionRate * pattern.seasonalityFactor * 7;
    const optimalQuantity = Math.ceil(weeklyConsumption * 2); // 2 semanas
    
    return Math.max(1, Math.min(10, optimalQuantity)); // entre 1 e 10
  }

  // Obtém estatísticas para debugging/admin
  getAnalytics(): { totalRecords: number; totalPatterns: number; averageAccuracy: number; topConsumers: string[] } {
    try {
      // Tenta obter estatísticas do sistema avançado
      mlService.getStats().then(stats => {
        return {
          totalRecords: stats.totalRecords,
          totalPatterns: stats.totalProducts,
          averageAccuracy: stats.averageAccuracy,
          topConsumers: stats.topProducts
        };
      }).catch(() => {
        // Fallback para sistema local
      });
    } catch (error) {
      console.warn('Erro ao obter estatísticas avançadas, usando local:', error);
    }

    // Fallback para sistema local original
    const patterns = Array.from(this.patterns.values());
    const averageAccuracy = patterns.length > 0 ? 
      patterns.reduce((sum, p) => sum + p.predictionAccuracy, 0) / patterns.length : 0;
    
    const topConsumers = patterns
      .sort((a, b) => b.totalConsumed - a.totalConsumed)
      .slice(0, 5)
      .map(p => p.itemName);

    return {
      totalRecords: this.consumptionHistory.length,
      totalPatterns: this.patterns.size,
      averageAccuracy,
      topConsumers
    };
  }

  // Limpa dados antigos (mais de 6 meses)
  cleanOldData(): void {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoffDate = sixMonthsAgo.toISOString().split('T')[0];

    this.consumptionHistory = this.consumptionHistory.filter(
      record => record.consumedDate >= cutoffDate
    );

    this.saveToStorage();
  }
}

// Instância singleton
export const smartShoppingEngine = new SmartShoppingListEngine();