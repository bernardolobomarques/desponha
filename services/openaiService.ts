import type { AIParsedItem } from '../types';

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY environment variable not set");
}

interface OpenAIMessage {
  role: 'system' | 'user';
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const OPENAI_API_BASE = 'https://api.openai.com/v1';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const estimateExpiryDate = (productName: string): string => {
  const today = new Date();
  const productLower = productName.toLowerCase();
  
  if (productLower.includes('leite') || productLower.includes('iogurte')) {
    today.setDate(today.getDate() + 7);
  } else if (productLower.includes('pao') || productLower.includes('pão')) {
    today.setDate(today.getDate() + 3);
  } else if (productLower.includes('carne') || productLower.includes('frango')) {
    today.setDate(today.getDate() + 2);
  } else if (productLower.includes('verdura') || productLower.includes('fruta')) {
    today.setDate(today.getDate() + 5);
  } else if (productLower.includes('biscoito') || productLower.includes('bolacha')) {
    today.setDate(today.getDate() + 60);
  } else {
    today.setDate(today.getDate() + 30);
  }
  
  return today.toISOString().split('T')[0];
};

export const standardizeProductName = async (productName: string): Promise<string> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY não configurada, retornando nome original");
      return productName;
    }

    if (!productName || productName.trim().length === 0) {
      return productName;
    }

    console.log('Padronizando nome do produto:', productName);

    const systemPrompt = `Você é um assistente especializado em padronizar nomes de produtos de supermercado brasileiro.

TAREFA: Padronize o nome do produto fornecido para ser claro e completo em português.

REGRAS DE PADRONIZAÇÃO:

1. SEMPRE expandir abreviações:
   • "AG" ou "AG MINERAL" → "Água Mineral"
   • "AG MIN S LOUR" → "Água Mineral S'Lourenço" 
   • "REFRIG" → "Refrigerante"
   • "BISC" → "Biscoito"
   • "YOG" → "Iogurte"
   • "MARG" → "Margarina"

2. SEMPRE incluir volumes/tamanhos quando presentes:
   • "126L" → "1,26 Litros"
   • "2L" → "2 Litros"  
   • "500ML" → "500ml"

3. SEMPRE especificar tipos quando possível:
   • "LEITE" → "Leite Integral"
   • "ARROZ" → "Arroz Branco"
   • "OLEO" → "Óleo de Soja"

4. Capitalização correta:
   • Primeira letra maiúscula em cada palavra importante
   • Manter nomes próprios (Coca-Cola, Nestlé)

IMPORTANTE: Responda APENAS com o nome padronizado, sem texto adicional.

Exemplos:
- "ag mineral" → "Água Mineral"
- "BISC CREAM CRACKER" → "Biscoito Cream Cracker"
- "leite integral" → "Leite Integral"`;

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Padronize este nome de produto: "${productName}"` }
        ],
        max_tokens: 100,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('Erro na API da OpenAI para padronização:', response.status);
      return productName;
    }

    const result = await response.json();
    const standardizedName = result.choices[0]?.message?.content?.trim();

    if (standardizedName && standardizedName.length > 0) {
      console.log(`Padronizado: "${productName}" -> "${standardizedName}"`);
      return standardizedName;
    } else {
      return productName;
    }

  } catch (error) {
    console.error('Erro ao padronizar nome do produto:', error);
    return productName;
  }
};

export const parseReceiptWithOpenAI = async (imageFile: File): Promise<AIParsedItem[]> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Chave da API da OpenAI não configurada. Configure OPENAI_API_KEY no arquivo .env");
    }

    console.log('Iniciando processamento com OpenAI Vision...');
    
    const base64Image = await fileToBase64(imageFile);
    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `Você é um assistente especializado em processar notas fiscais de supermercado brasileiro.

TAREFA CRÍTICA: Analise a nota fiscal e extraia TODOS os itens alimentícios, SEMPRE padronizando os nomes para serem claros e completos.

FORMATO OBRIGATÓRIO: JSON array com objetos:
- name: Nome EXATO como aparece na nota fiscal (não modifique)
- standardizedName: Nome PADRONIZADO, claro e completo em português
- quantity: Quantidade numérica (1 se não especificado)  
- expiryDate: Data estimada AAAA-MM-DD

🔥 REGRAS CRÍTICAS DE PADRONIZAÇÃO (standardizedName):

1. SEMPRE expandir abreviações:
   • "AG" ou "AG MINERAL" → "Água Mineral"
   • "AG MIN S LOUR" → "Água Mineral S'Lourenço" 
   • "REFRIG" → "Refrigerante"
   • "BISC" → "Biscoito"
   • "YOG" → "Iogurte"
   • "MARG" → "Margarina"

2. SEMPRE incluir volumes/tamanhos:
   • "126L" → "1,26 Litros"
   • "2L" → "2 Litros"  
   • "500ML" → "500ml"

3. SEMPRE especificar tipos:
   • "LEITE" → "Leite Integral"
   • "ARROZ" → "Arroz Branco"
   • "OLEO" → "Óleo de Soja"

4. Capitalização correta:
   • Primeira letra maiúscula em cada palavra importante
   • Manter nomes próprios (Coca-Cola, Nestlé)

EXEMPLO ESPECÍFICO:
Se na nota aparecer "AG MIN S LOUR 126L", você deve retornar:
- name: "AG MIN S LOUR 126L"
- standardizedName: "Água Mineral S'Lourenço 1,26 Litros"

ESTIMATIVA DE VALIDADE (Data base: ${today}):
- Laticínios: +7 dias
- Pães: +3 dias  
- Carnes: +2 dias
- Frutas/verduras: +5 dias
- Produtos secos: +60 dias
- Outros: +30 dias

IMPORTANTE: 
- Extrair APENAS itens alimentícios
- Sempre padronizar o nome para ficar claro e completo
- Responda APENAS com o JSON array, sem texto adicional

Exemplo:
[
  {
    "name": "AG MIN S LOUR 126L",
    "standardizedName": "Água Mineral S'Lourenço 1,26 Litros",
    "quantity": 1,
    "expiryDate": "2025-10-17"
  }
]`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: [{ type: 'text', text: systemPrompt }]
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analise esta nota fiscal e extraia todos os itens alimentícios seguindo o formato especificado:'
          },
          {
            type: 'image_url',
            image_url: {
              url: base64Image
            }
          }
        ]
      }
    ];

    console.log('Enviando requisição para OpenAI...');

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: messages,
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API da OpenAI: ${response.status} - ${errorText}`);
    }

    const result: OpenAIResponse = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta vazia da API da OpenAI');
    }

    console.log('Resposta da OpenAI recebida:', content);

    try {
      const cleanContent = content.trim();
      const jsonStart = cleanContent.indexOf('[');
      const jsonEnd = cleanContent.lastIndexOf(']') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('Formato de resposta inválido da OpenAI');
      }
      
      const jsonContent = cleanContent.slice(jsonStart, jsonEnd);
      const parsedItems: AIParsedItem[] = JSON.parse(jsonContent);

      console.log('Items parseados:', parsedItems);

      const validatedItems = parsedItems.map(item => {
        const validatedItem = {
          name: item.name || 'Item desconhecido',
          standardizedName: item.standardizedName || item.name || 'Item desconhecido',
          quantity: typeof item.quantity === 'number' ? item.quantity : 1,
          expiryDate: item.expiryDate || estimateExpiryDate(item.standardizedName || item.name || '')
        };
        
        console.log(`Processado: "${validatedItem.name}" -> "${validatedItem.standardizedName}"`);
        return validatedItem;
      });

      console.log(`Processamento completo! ${validatedItems.length} itens encontrados.`);
      return validatedItems;

    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta JSON:', parseError);
      console.error('Conteúdo recebido:', content);
      throw new Error('Erro ao processar resposta da OpenAI. Tente novamente.');
    }

  } catch (error) {
    console.error('Erro no processamento OpenAI Vision:', error);
    throw error;
  }
};
