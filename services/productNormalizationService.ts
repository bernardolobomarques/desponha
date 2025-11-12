/**
 * Serviço de Normalização de Produtos usando OpenAI
 * 
 * Funcionalidades:
 * 1. Normalizar nomes de produtos (ex: "leite integral 1L" -> "Leite")
 * 2. Identificar produtos similares no banco de dados
 * 3. Evitar duplicatas agrupando variações do mesmo produto
 */

import { supabase } from './supabaseClient';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

if (!OPENAI_API_KEY) {
  console.warn('⚠️ VITE_OPENAI_API_KEY não configurada! Normalização de produtos usará fallback básico.');
}

interface ProductMatch {
  isMatch: boolean;
  normalizedName: string;
  confidence: number;
  matchedProduct?: string;
}

/**
 * Busca produtos existentes no banco de dados do usuário
 */
async function getExistingProducts(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('product_name')
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao buscar produtos existentes:', error);
      return [];
    }

    // Retornar lista única de produtos
    const uniqueProducts = [...new Set(data?.map(p => p.product_name) || [])];
    return uniqueProducts;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

/**
 * Usa OpenAI para normalizar nome do produto e identificar se é similar a algum existente
 */
async function normalizeProductWithAI(
  productName: string,
  existingProducts: string[]
): Promise<ProductMatch> {
  try {
    const prompt = `Você é um assistente especializado em padronização de produtos de supermercado.

PRODUTO A ANALISAR: "${productName}"

PRODUTOS EXISTENTES NO BANCO:
${existingProducts.length > 0 ? existingProducts.map((p, i) => `${i + 1}. ${p}`).join('\n') : 'Nenhum produto cadastrado ainda'}

TAREFA:
1. Normalize o nome do produto removendo APENAS informações irrelevantes (quantidade, volume, embalagem)
2. MANTENHA informações importantes: marca, sabor, tipo, variação
3. Verifique se este produto é EXATAMENTE IGUAL a algum dos produtos existentes

REGRAS DE NORMALIZAÇÃO:
✅ MANTER:
   - Marca (Coca-Cola, Pepsi, Parmalat, Nestlé, etc)
   - Sabor (Guaraná, Laranja, Uva, Morango, etc)
   - Tipo (Integral, Desnatado, Zero, Light, etc)
   - Variações importantes (Diet, Zero Açúcar, Sem Lactose, etc)

❌ REMOVER:
   - Volumes (1L, 2L, 500ml, 350ml, etc)
   - Quantidades (6 unidades, pacote com 12, etc)
   - Embalagens (lata, garrafa, pet, tetra pak, etc)
   - Palavras genéricas (unidade, pacote, caixa, etc)

EXEMPLOS:
- "coca cola 2L" → "Coca-Cola"
- "coca cola zero 350ml" → "Coca-Cola Zero"
- "guaraná antarctica 2L" → "Guaraná Antarctica"
- "leite parmalat integral 1L" → "Leite Parmalat Integral"
- "leite parmalat desnatado 1L" → "Leite Parmalat Desnatado"
- "pão francês 6 unidades" → "Pão Francês"
- "refrigerante fanta laranja 2L" → "Fanta Laranja"
- "refrigerante fanta uva 2L" → "Fanta Uva"

IMPORTANTE:
- Use capitalização correta (primeira letra maiúscula)
- Produtos são IGUAIS apenas se marca E sabor/tipo forem idênticos
- Seja CONSERVADOR: só marque como igual se for EXATAMENTE o mesmo produto

Responda APENAS em JSON válido neste formato:
{
  "normalizedName": "nome normalizado",
  "isMatch": true/false,
  "matchedProduct": "nome do produto igual ou null",
  "confidence": 0.0 a 1.0
}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em categorização de produtos de supermercado. Sempre responda apenas com JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    
    // Parse JSON response
    const result = JSON.parse(content);

    return {
      isMatch: result.isMatch || false,
      normalizedName: result.normalizedName || productName,
      confidence: result.confidence || 0.5,
      matchedProduct: result.matchedProduct || undefined
    };
  } catch (error) {
    console.error('Erro ao normalizar produto com OpenAI:', error);
    
    // Fallback: normalização básica sem IA
    return {
      isMatch: false,
      normalizedName: productName.trim(),
      confidence: 0.3
    };
  }
}

/**
 * Normaliza uma lista de produtos do OCR antes de salvar no banco
 */
export async function normalizeProducts(
  products: Array<{ name: string; quantity: number; expiryDate: string }>,
  userId: string
): Promise<Array<{ name: string; quantity: number; expiryDate: string; isExisting: boolean; originalName: string }>> {
  console.log('🤖 Iniciando normalização de produtos com IA...');
  
  // 1. Buscar produtos existentes no banco
  const existingProducts = await getExistingProducts(userId);
  console.log(`📦 ${existingProducts.length} produtos existentes encontrados`);

  // 2. Normalizar cada produto
  const normalizedProducts = [];
  
  for (const product of products) {
    console.log(`\n🔍 Analisando: "${product.name}"`);
    
    const match = await normalizeProductWithAI(product.name, existingProducts);
    
    console.log(`  ✅ Normalizado: "${match.normalizedName}"`);
    console.log(`  📊 Similaridade: ${match.isMatch ? `SIM (${match.matchedProduct}) - ${(match.confidence * 100).toFixed(0)}%` : 'NÃO'}`);
    
    // Se encontrou match, usar o nome do produto existente
    const finalName = match.isMatch && match.matchedProduct 
      ? match.matchedProduct 
      : match.normalizedName;
    
    normalizedProducts.push({
      name: finalName,
      quantity: product.quantity,
      expiryDate: product.expiryDate,
      isExisting: match.isMatch,
      originalName: product.name
    });
  }

  console.log('\n✨ Normalização concluída!');
  return normalizedProducts;
}

/**
 * Normaliza um único produto
 */
export async function normalizeSingleProduct(
  productName: string,
  userId: string
): Promise<string> {
  const existingProducts = await getExistingProducts(userId);
  const match = await normalizeProductWithAI(productName, existingProducts);
  
  return match.isMatch && match.matchedProduct 
    ? match.matchedProduct 
    : match.normalizedName;
}
