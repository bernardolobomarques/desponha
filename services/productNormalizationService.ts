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
1. Normalize o nome do produto para uma forma padrão e genérica (ex: "leite integral parmalat 1L" -> "Leite")
2. Verifique se este produto é SIMILAR a algum dos produtos existentes no banco
3. Um produto é similar se for a mesma categoria, mesmo que com marca/tamanho diferente
   Exemplos:
   - "leite integral 1L" é similar a "Leite"
   - "pão francês 6 unidades" é similar a "Pão"
   - "café pilão 500g" é similar a "Café"
   - "arroz tio joão 5kg" é similar a "Arroz"

IMPORTANTE:
- Use sempre a primeira letra maiúscula e resto minúsculo
- Remova marcas, tamanhos, quantidades
- Seja genérico (Leite, Pão, Arroz, Feijão, Café, etc)
- Seja conservador: apenas marque como similar se for REALMENTE o mesmo tipo de produto

Responda APENAS em JSON válido neste formato:
{
  "normalizedName": "nome normalizado",
  "isMatch": true/false,
  "matchedProduct": "nome do produto similar ou null",
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
  userId: string = 'user_123'
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
  userId: string = 'user_123'
): Promise<string> {
  const existingProducts = await getExistingProducts(userId);
  const match = await normalizeProductWithAI(productName, existingProducts);
  
  return match.isMatch && match.matchedProduct 
    ? match.matchedProduct 
    : match.normalizedName;
}
