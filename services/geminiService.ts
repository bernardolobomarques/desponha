import { GoogleGenAI, Type } from "@google/genai";
import type { AIParsedItem } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

const receiptSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'A transcrição EXATA do item como aparece na nota fiscal (ex: "BISC. PASSATEMPO").',
      },
      standardizedName: {
        type: Type.STRING,
        description: 'O nome do produto traduzido e padronizado em português (ex: "Biscoito Passatempo").',
      },
      quantity: {
        type: Type.NUMBER,
        description: 'A quantidade do item, padronizando para 1 se não especificado.',
      },
      expiryDate: {
        type: Type.STRING,
        description: `Uma data de validade estimada no formato AAAA-MM-DD com base no tipo de item.`,
      },
    },
    required: ['name', 'standardizedName', 'quantity', 'expiryDate'],
  },
};

export const parseReceipt = async (imageFile: File): Promise<AIParsedItem[]> => {
  try {
    const base64Image = await fileToBase64(imageFile);
    const today = new Date().toISOString().split('T')[0];

    const prompt = `Você é um assistente de IA altamente preciso, especializado em processar notas fiscais de supermercado para um aplicativo de despensa virtual. Sua principal tarefa é extrair todos os itens alimentícios da imagem fornecida e padronizar seus nomes.

    Analise a imagem da nota fiscal e retorne um objeto JSON que corresponda ao esquema fornecido, seguindo estas regras estritas:

    1.  **Extração Dupla de Nomes**: Para cada item, forneça duas informações de nome:
        *   \`name\`: A transcrição EXATA do item como aparece na nota fiscal (ex: "BISC. NEGRESCO", "ACHOC TODDY").
        *   \`standardizedName\`: O nome limpo, traduzido e padronizado do produto em português (ex: "Biscoito Negresco", "Achocolatado Toddy"). Esta é a chave para evitar duplicatas.
    2.  **Extração Completa**: Faça o seu melhor para identificar e extrair TODOS os itens alimentícios listados na nota fiscal.
    3.  **Apenas Itens Alimentícios**: Ignore completamente itens não alimentícios (como produtos de limpeza, higiene pessoal).
    4.  **Quantidade Padrão**: Se a quantidade não for mencionada, assuma que é 1.
    5.  **Consolidação de Itens**: Se o mesmo item aparecer várias vezes, some as quantidades e liste-o como uma única entrada.
    6.  **Estimativa de Validade**: Com base na data de hoje (${today}), estime uma data de validade no formato 'YYYY-MM-DD'. Use as seguintes diretrizes:
        - Produtos frescos (frutas, vegetais): 7 dias
        - Laticínios e frios (leite, iogurte, queijo): 14 dias
        - Carne/Aves frescas: 5 dias
        - Produtos secos embalados (massa, arroz, cereais): 365 dias
        - Produtos enlatados: 730 dias`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageFile.type,
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
      },
    });
    
    const jsonText = response.text.trim();
    const parsedItems: AIParsedItem[] = JSON.parse(jsonText);

    // Validate parsed items
    if (!Array.isArray(parsedItems)) {
        throw new Error("API did not return an array.");
    }

    return parsedItems.filter(item => item.standardizedName && typeof item.quantity === 'number' && item.expiryDate);

  } catch (error) {
    console.error("Error parsing receipt with Gemini API:", error);
    throw new Error("Falha ao processar a nota fiscal. Verifique a imagem e tente novamente.");
  }
};
