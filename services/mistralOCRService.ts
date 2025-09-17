import type { AIParsedItem } from '../types';

if (!process.env.MISTRAL_API_KEY) {
  console.warn("MISTRAL_API_KEY environment variable not set");
}

interface MistralFileUploadResponse {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

interface MistralFileUrlResponse {
  url: string;
}

interface MistralOCRResponse {
  id: string;
  object: string;
  model: string;
  pages: Array<{
    page_number: number;
    markdown: string;
  }>;
}

interface ParsedProduct {
  produto: string;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  preco_total: number;
  dataVencimento?: string;
  categoria?: string;
}

const MISTRAL_API_BASE = 'https://api.mistral.ai/v1';

// Função para fazer upload do arquivo para Mistral
const uploadFileToMistral = async (file: File): Promise<MistralFileUploadResponse> => {
  const formData = new FormData();
  formData.append('purpose', 'ocr');
  formData.append('file', file);

  const response = await fetch(`${MISTRAL_API_BASE}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro no upload do arquivo: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// Função para obter URL temporária do arquivo
const getFileUrl = async (fileId: string): Promise<MistralFileUrlResponse> => {
  const response = await fetch(`${MISTRAL_API_BASE}/files/${fileId}/url?expiry=24`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao obter URL do arquivo: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// Função para processar OCR
const processOCR = async (imageUrl: string): Promise<MistralOCRResponse> => {
  const requestBody = {
    model: "mistral-ocr-latest",
    document: {
      type: "image_url",
      image_url: imageUrl
    },
    include_image_base64: true
  };

  const response = await fetch(`${MISTRAL_API_BASE}/ocr`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro no processamento OCR: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// Função para fazer parsing do markdown e extrair produtos
const parseProductsFromMarkdown = (markdown: string): ParsedProduct[] => {
  console.log('Iniciando parsing do markdown...');
  
  const produtos: ParsedProduct[] = [];
  const linhas = markdown.split('\n');
  
  // Procurar por linhas que parecem produtos (começam com código de barras e têm preço)
  for (const linha of linhas) {
    // Regex para formato: CODIGO DESCRICAO QUANTIDADE UNIDADE x PRECO_UNIT PRECO_TOTAL
    // Exemplo: 7898994446019 CARVAO NA BRASA 3KG 2 PT x 17,50 35,00
    const regexProduto = /^(\d{13})\s+(.+?)\s+(\d+(?:,\d+)?)\s+(\w+)\s+x\s+([\d,]+)\s+([\d,]+)$/;
    
    const match = linha.match(regexProduto);
    if (match) {
      const [, codigo, descricao, quantidade, unidade, precoUnit, precoTotal] = match;
      
      console.log(`Produto encontrado: ${descricao.trim()}`);
      
      produtos.push({
        produto: descricao.trim(),
        quantidade: parseFloat(quantidade.replace(",", ".")),
        unidade: unidade.trim(),
        preco_unitario: parseFloat(precoUnit.replace(",", ".")),
        preco_total: parseFloat(precoTotal.replace(",", "."))
      });
    }
  }
  
  // Se não encontrou nada com o regex específico, tenta uma abordagem mais flexível
  if (produtos.length === 0) {
    console.log('Tentando parsing mais flexível...');
    
    for (const linha of linhas) {
      // Busca por linhas que tenham códigos de barras (13 dígitos) seguidos de texto
      if (linha.match(/^\d{13}\s+/)) {
        console.log(`Linha de produto candidata: ${linha}`);
        
        // Regex mais flexível: CODIGO DESCRICAO ... números
        const regexFlexivel = /^(\d{13})\s+(.+?)\s+([\d,]+)$/;
        const parts = linha.split(/\s+/);
        
        if (parts.length >= 3) {
          const codigo = parts[0];
          const precoTotal = parts[parts.length - 1];
          const descricao = parts.slice(1, -2).join(' '); // pega tudo no meio, exceto os 2 últimos
          
          if (codigo.length === 13 && precoTotal.match(/^[\d,]+$/)) {
            console.log(`Produto extraído: ${descricao}`);
            
            produtos.push({
              produto: descricao.trim(),
              quantidade: 1, // padrão quando não conseguimos extrair
              unidade: "UN", // padrão
              preco_unitario: parseFloat(precoTotal.replace(",", ".")),
              preco_total: parseFloat(precoTotal.replace(",", "."))
            });
          }
        }
      }
    }
  }
  
  console.log(`Parsing finalizado. Produtos encontrados: ${produtos.length}`);
  if (produtos.length > 0) {
    console.log('Produtos extraídos:');
    produtos.forEach((p, i) => {
      console.log(`${i + 1}. ${p.produto} - Qtd: ${p.quantidade} - Preço: R$ ${p.preco_total}`);
    });
  }
  
  return produtos;
};

// Função para usar OpenAI para estimar datas de vencimento inteligentes
const estimateExpiryDateWithAI = async (produtos: ParsedProduct[]): Promise<ParsedProduct[]> => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API Key não configurada. Usando estimativas padrão para datas de vencimento.');
    return produtos.map(produto => ({
      ...produto,
      dataVencimento: estimateBasicExpiryDate(produto.produto)
    }));
  }

  try {
    console.log('Usando OpenAI para estimar datas de vencimento inteligentes...');

    const today = new Date().toISOString().split('T')[0];
    const produtosList = produtos.map(p => `- ${p.produto}`).join('\n');

    const prompt = `Você é um especialista em produtos alimentícios e precisa estimar datas de validade realistas para produtos comprados em supermercado brasileiro.

DATA DE COMPRA: ${today}

PRODUTOS COMPRADOS:
${produtosList}

Para cada produto, estime uma data de vencimento realista considerando:
1. O tipo de produto (perecível, não-perecível, refrigerado, etc.)
2. Padrões brasileiros de validade
3. Condições normais de armazenamento doméstico

RESPONDA APENAS com um JSON array no formato:
[
  {
    "produto": "nome_do_produto",
    "dataVencimento": "AAAA-MM-DD",
    "categoria": "categoria_do_produto"
  }
]

Categorias possíveis: "bebida", "carne", "laticinio", "panificado", "conserva", "limpeza", "higiene", "fruta", "verdura", "congelado", "seco"

IMPORTANTE: Use datas realistas baseadas em produtos brasileiros típicos.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em produtos alimentícios brasileiros e suas validades típicas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na OpenAI: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    // Parse da resposta JSON
    const cleanContent = content.trim();
    const jsonStart = cleanContent.indexOf('[');
    const jsonEnd = cleanContent.lastIndexOf(']') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('Formato de resposta inválido da OpenAI');
    }
    
    const jsonContent = cleanContent.slice(jsonStart, jsonEnd);
    const aiEstimates = JSON.parse(jsonContent);

    // Combinar os produtos com as estimativas da AI
    const produtosComVencimento = produtos.map(produto => {
      const aiEstimate = aiEstimates.find((est: any) => 
        est.produto.toLowerCase().includes(produto.produto.toLowerCase().substring(0, 10)) ||
        produto.produto.toLowerCase().includes(est.produto.toLowerCase().substring(0, 10))
      );

      return {
        ...produto,
        dataVencimento: aiEstimate?.dataVencimento || estimateBasicExpiryDate(produto.produto),
        categoria: aiEstimate?.categoria || 'seco'
      };
    });

    console.log('Datas de vencimento estimadas pela OpenAI com sucesso!');
    return produtosComVencimento;

  } catch (error) {
    console.error('Erro ao usar OpenAI para estimativa de vencimento:', error);
    console.log('Usando estimativas padrão...');
    
    return produtos.map(produto => ({
      ...produto,
      dataVencimento: estimateBasicExpiryDate(produto.produto)
    }));
  }
};

// Função básica de estimativa (fallback)
const estimateBasicExpiryDate = (productName: string): string => {
  const today = new Date();
  const productLower = productName.toLowerCase();
  
  if (productLower.includes('refr') || productLower.includes('coca') || productLower.includes('pepsi')) {
    today.setMonth(today.getMonth() + 6); // 6 meses para refrigerantes
  } else if (productLower.includes('leite') || productLower.includes('iogurte')) {
    today.setDate(today.getDate() + 7); // 1 semana
  } else if (productLower.includes('pao') || productLower.includes('pão')) {
    today.setDate(today.getDate() + 3); // 3 dias
  } else if (productLower.includes('carne') || productLower.includes('frango')) {
    today.setDate(today.getDate() + 2); // 2 dias
  } else if (productLower.includes('agua') || productLower.includes('ag min')) {
    today.setMonth(today.getMonth() + 12); // 1 ano para água
  } else if (productLower.includes('carvao')) {
    today.setMonth(today.getMonth() + 24); // 2 anos para carvão
  } else {
    today.setDate(today.getDate() + 30); // 1 mês padrão
  }
  
  return today.toISOString().split('T')[0];
};

// Função para converter produtos parseados para o formato AIParsedItem
const convertToAIParsedItems = (produtos: any[]): AIParsedItem[] => {
  return produtos.map(produto => ({
    name: produto.produto,
    standardizedName: produto.produto,
    quantity: produto.quantidade,
    expiryDate: produto.dataVencimento || produto.expiryDate
  }));
};
export const parseReceiptWithMistral = async (imageFile: File): Promise<AIParsedItem[]> => {
  try {
    if (!process.env.MISTRAL_API_KEY) {
      throw new Error("Chave da API do Mistral não configurada. Configure MISTRAL_API_KEY no arquivo .env");
    }

    console.log('Iniciando processamento com Mistral OCR...');
    
    // Step 1: Upload do arquivo
    console.log('1. Fazendo upload do arquivo...');
    const uploadResponse = await uploadFileToMistral(imageFile);
    console.log('Upload concluído:', uploadResponse.id);
    
    // Step 2: Obter URL temporária
    console.log('2. Obtendo URL temporária...');
    const urlResponse = await getFileUrl(uploadResponse.id);
    console.log('URL obtida');
    
    // Step 3: Processar OCR
    console.log('3. Processando OCR...');
    const ocrResponse = await processOCR(urlResponse.url);
    console.log('OCR processado, páginas encontradas:', ocrResponse.pages.length);
    
    // Step 4: Fazer parsing dos produtos
    console.log('4. Extraindo produtos do markdown...');
    const markdown = ocrResponse.pages[0]?.markdown;
    if (!markdown) {
      throw new Error('Nenhum conteúdo markdown encontrado na resposta do OCR');
    }
    
    // DEBUG: Vamos ver o que o OCR retornou
    console.log('=== MARKDOWN RETORNADO PELO MISTRAL ===');
    console.log(markdown);
    console.log('=== FIM DO MARKDOWN ===');
    
    const produtos = parseProductsFromMarkdown(markdown);
    console.log(`Produtos encontrados: ${produtos.length}`);
    
    // Step 5: Usar OpenAI para estimar datas de vencimento inteligentes
    console.log('5. Estimando datas de vencimento com IA...');
    const produtosComVencimento = await estimateExpiryDateWithAI(produtos);
    
    // Step 6: Converter para formato AIParsedItem
    const parsedItems = convertToAIParsedItems(produtosComVencimento);
    console.log('Processamento completo!');
    
    return parsedItems;
    
  } catch (error) {
    console.error('Erro no processamento Mistral OCR:', error);
    throw error;
  }
};