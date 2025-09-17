<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

Esta aplicação de despensa virtual inteligente oferece três opções de OCR para processar notas fiscais:
- **OpenAI Vision**: Processamento avançado com GPT-4 Vision (Recomendado)
- **Google Gemini Vision**: Processamento inteligente com análise de contexto
- **Mistral OCR**: OCR especializado com parsing estruturado para notas fiscais brasileiras

View your app in AI Studio: https://ai.studio/apps/drive/1c6DB2ZOPQ7qL-3_jki4eO_0BNywAjF-h

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`

2. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`
   - Configure ao menos uma das chaves de API:
     - `OPENAI_API_KEY` (Recomendado)
     - `GEMINI_API_KEY`
     - `MISTRAL_API_KEY`

3. Run the app:
   `npm run dev`

## Configuração dos Serviços de OCR

### OpenAI Vision (Recomendado)
- Obtenha sua chave em: https://platform.openai.com/api-keys
- Configure a variável `OPENAI_API_KEY` no arquivo `.env`
- Usa o modelo GPT-4 Vision para análise inteligente de notas fiscais

### Google Gemini (Opcional)
- Obtenha sua chave em: https://makersuite.google.com/app/apikey
- Configure a variável `GEMINI_API_KEY` no arquivo `.env`
- Habilite a Generative Language API no Google Cloud Console

### Mistral OCR (Opcional)
- Obtenha sua chave em: https://console.mistral.ai/
- Configure a variável `MISTRAL_API_KEY` no arquivo `.env`
- O Mistral OCR é especializado em notas fiscais brasileiras e usa um sistema de parsing estruturado

## Funcionalidades

- **Processamento de Notas Fiscais**: Upload de imagens ou captura via câmera
- **Três Motores de OCR**: Escolha entre OpenAI Vision, Gemini Vision e Mistral OCR
- **Parsing Inteligente**: Extração automática de produtos, quantidades e preços
- **Estimativa de Validade**: Datas de vencimento baseadas no tipo de produto
- **Interface Responsiva**: Funciona em dispositivos móveis e desktop
