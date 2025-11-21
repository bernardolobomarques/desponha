# 🛒 Desponha - Despensa Virtual Inteligente

Controle sua despensa automaticamente com inteligência artificial. Fotografe notas fiscais e deixe a IA fazer o resto.

## 📑 **Apresentação do Projeto**
🎨 **[Ver Apresentação Completa](https://gamma.app/docs/Despensa-5vig9ish7tg2toe)**

---

## 🚀 Como Instalar e Rodar o Projeto

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:
- **Node.js** (versão 18 ou superior) - [Download aqui](https://nodejs.org/)
- **npm** ou **yarn** (geralmente vem com o Node.js)
- **Git** - [Download aqui](https://git-scm.com/)

### Passo 1: Clonar o Repositório

```bash
git clone https://github.com/bernardolobomarques/desponha.git
cd desponha
```

### Passo 2: Instalar Dependências

```bash
npm install
```

Ou se preferir usar yarn:

```bash
yarn install
```

### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com suas chaves de API:

```env
# Supabase (obrigatório para autenticação e banco de dados)
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# APIs de OCR (pelo menos uma é obrigatória)
VITE_OPENAI_API_KEY=sua_chave_openai
VITE_GEMINI_API_KEY=sua_chave_gemini
VITE_MISTRAL_API_KEY=sua_chave_mistral
```

#### Como obter as chaves:

1. **Supabase** (necessário):
   - Acesse [supabase.com](https://supabase.com)
   - Crie um projeto gratuito
   - Copie a URL e a chave anônima nas configurações do projeto

2. **OpenAI** (recomendado):
   - Acesse [platform.openai.com](https://platform.openai.com)
   - Crie uma conta e gere uma API key

3. **Google Gemini** (opcional):
   - Acesse [ai.google.dev](https://ai.google.dev)
   - Obtenha uma API key gratuita

4. **Mistral AI** (opcional):
   - Acesse [mistral.ai](https://mistral.ai)
   - Crie uma conta e gere uma API key

### Passo 4: Configurar Banco de Dados

Execute os scripts SQL na seguinte ordem no Supabase SQL Editor:

```bash
# 1. Criar tabelas
database/supabase-schema-v2.sql

# 2. Popular com dados de exemplo (opcional)
database/quick-seed.sql
```

### Passo 5: Rodar o Projeto

```bash
npm run dev
```

Ou com yarn:

```bash
yarn dev
```

O projeto estará rodando em: **http://localhost:5173**

### 🎯 Comandos Disponíveis

```bash
# Rodar em modo de desenvolvimento
npm run dev

# Criar build de produção
npm run build

# Preview do build de produção
npm run preview
```

### 📱 Usando a Aplicação

1. **Primeiro acesso**: Na landing page, clique em "Começar Gratuitamente"
2. **Criar conta**: Cadastre-se com email e senha
3. **Confirmar email**: Verifique seu email (se configurado no Supabase)
4. **Adicionar produtos**: 
   - Clique no botão flutuante "+"
   - Escolha entre fotografar nota fiscal ou adicionar manualmente
   - Selecione o provedor de OCR (OpenAI, Gemini ou Mistral)
5. **Gerenciar estoque**: Visualize, edite ou remova produtos da despensa
6. **Lista de compras**: Acesse a aba "Compras" para ver sugestões automáticas

### ⚠️ Possíveis Problemas

**Erro ao processar nota fiscal:**
- Verifique se as chaves de API estão corretas no `.env`
- Certifique-se de que tem créditos nas APIs (OpenAI é paga)

**Erro ao fazer login:**
- Confirme que o Supabase está configurado corretamente
- Verifique se executou os scripts SQL

**Página em branco:**
- Verifique o console do navegador (F12)
- Certifique-se de que todas as dependências foram instaladas

### 🛠️ Tecnologias Utilizadas

- **React 18** + **TypeScript** - Frontend
- **Tailwind CSS** - Estilização
- **Vite** - Build tool
- **Supabase** - Backend e autenticação
- **OpenAI GPT-4 Vision** - OCR principal
- **Google Gemini Vision** - OCR alternativo
- **Mistral AI** - OCR especializado

---

# Documentação Inicial do Projeto

## 1. Identificação do Projeto

**Nome do projeto/solução:** Desponha

**Nome dos integrantes do grupo:** Arthur Schiller, Bernardo Lobo, Bernardo Gonçalves, Guilherme Dias, Michel Melo

## 2. Motivação

A ideia da **Desponha** nasceu de uma dor pessoal de um integrante do grupo que mora sozinho. Ele percebia que, com frequência, esquecia de comprar certos alimentos no supermercado — acreditava que ainda tinha em casa, mas não tinha, ou então comprava em excesso e acabava acumulando.

Essa situação, que parece simples, é muito comum no dia a dia de qualquer pessoa que cuida das compras de casa. E foi a partir desse problema real que surgiu a proposta de criar uma solução que automatize e facilite o gerenciamento do que se tem em casa, evitando tanto a falta quanto o excesso de alimentos.

- **Prática:** Ajuda as pessoas a nunca esquecerem o que comprar e evita esforço manual na hora de planejar compras
- **Acadêmica:** Permite aplicar IA, visão computacional e machine learning em um contexto próximo da realidade cotidiana, explorando técnicas de OCR, processamento de linguagem natural e aprendizado de padrões
- **Social:** Reduz desperdício de alimentos, um problema ambiental e econômico que afeta milhões de famílias, contribuindo para sustentabilidade

## 3. Problema

O principal problema que a **Desponha** resolve é a dificuldade em manter um controle eficiente dos alimentos em casa. Isso gera:

- Esquecimento de itens importantes no supermercado
- Compras duplicadas por achar que um produto acabou
- Falta de alimentos essenciais em momentos críticos (ex: ingredientes da marmita)
- Desperdício de alimentos comprados em excesso
- Tempo gasto criando listas de compras manuais

**Quem é afetado por esse problema:**
- Pessoas que moram sozinhas e cuidam da própria alimentação
- Famílias que precisam otimizar gastos e organizar compras
- Indivíduos preocupados em reduzir desperdício e manter uma rotina mais organizada

## 4. Solução Proposta

A **Desponha** é uma aplicação web inteligente desenvolvida em React que automatiza o controle de estoque doméstico através de inteligência artificial. O usuário fotografa ou faz upload de notas fiscais, e o sistema automaticamente extrai, padroniza e organiza os produtos em lotes individuais, estimando datas de validade e gerando listas de compras básicas. Todos os dados são armazenados localmente no navegador, permitindo uso offline completo.

A Inteligência Artificial foi utilizada em três camadas principais durante o desenvolvimento e operação:

### **1. Desenvolvimento Assistido por IA:**
- **GitHub Copilot:** Assistência na programação
- **Google AI Studio:** Prototipagem e teste de mais de 50 variações de prompts OCR com notas fiscais reais brasileiras
- **ChatGPT:** Refinamento de arquitetura, debugging e otimização de algoritmos de processamento

### **2. Sistema OCR Multi-Provider (Totalmente Implementado):**
- **OpenAI GPT-4 Vision:** Processamento principal com prompts especializados para produtos brasileiros, incluindo padronização automática de nomes
- **Google Gemini Vision:** Alternativa confiável com processamento contextual e validação cruzada
- **Mistral OCR:** Especializado em cupons fiscais brasileiros com parsing estruturado

### **3. Processamento Inteligente em Produção:**
- **Padronização Automática:** Converte abreviações em nomes legíveis ("AG MIN" → "Água Mineral")
- **Estimativa de Validade:** Algoritmos que estimam datas baseado no tipo de produto
- **Detecção de Duplicatas:** Prevenção automática de produtos repetidos no estoque

### **4. Machine Learning para Previsão e Sugestões Inteligentes (PLANEJADO - NÃO IMPLEMENTADO):**

**Sistema de Aprendizado de Padrões de Consumo (FUTURO):**
- **Análise Temporal:** Coleta de dados sobre quando produtos são adicionados (compras) e quando são consumidos/removidos do estoque
- **Cálculo de Ritmo:** Algoritmos que calculam a velocidade média de consumo de cada produto baseado no histórico pessoal
- **Padrões Sazonais:** Identificação de variações no consumo por época do ano, dias da semana e eventos especiais

**Previsão Inteligente de Reposição (A SER IMPLEMENTADA):**

O sistema analisará o histórico de consumo de cada produto para calcular a velocidade média com que cada item é consumido. Com base na quantidade atual em estoque e na velocidade de consumo, o algoritmo determinará quando o produto precisará ser reposto:

- **Status URGENTE:** Quando restam 3 dias ou menos para o produto acabar
- **Status EM_BREVE:** Quando restam entre 4 a 7 dias para acabar  
- **Status OK:** Quando há estoque suficiente por mais de 7 dias

Esta funcionalidade permitirá alertas proativos e sugestões automáticas de reposição antes que produtos essenciais se esgotem.

**Geração Automática de Listas de Compras (PRÓXIMA FASE):**
- **Predição por Consumo:** Sugestão de produtos baseada no ritmo individual de consumo (a implementar)
- **Otimização de Quantidades:** Recomendação da quantidade ideal a comprar baseada no padrão histórico (futuro)
- **Detecção de Anomalias:** Identificação de mudanças nos hábitos de consumo para ajuste das previsões (futuro)
- **Sugestões Proativas:** Lista de compras gerada automaticamente antes que produtos importantes acabem (futuro)

**Ferramentas de IA em Produção:**
- **OpenAI GPT-4 Vision API** - OCR primário e padronização de texto
- **Google Gemini Vision API** - Processamento alternativo de imagens
- **Mistral AI API** - Especializado em notas fiscais brasileiras

**Stack Técnico Implementado:**
- **Frontend:** React 18 + TypeScript + Tailwind CSS + Vite
- **Persistência:** localStorage com backup automático
- **Arquitetura:** 8 componentes especializados com estado centralizado

## 5. Benefícios Esperados

**Benefícios Esperados (com Machine Learning - AINDA NÃO IMPLEMENTADO):**
- **Previsão Personalizada:** Lista de compras gerada automaticamente baseada no ritmo individual de consumo *(em desenvolvimento)*
- **Otimização de Gastos:** Sugestões de quantidade ideal para evitar desperdício e economizar dinheiro *(planejado)*
- **Planejamento Inteligente:** Antecipação de necessidades antes que produtos importantes acabem *(futuro)*
- **Adaptação Contínua:** Sistema que aprende e se adapta aos hábitos únicos de cada usuário *(próxima fase)*
- **Redução de Desperdício:** Prevenção proativa de vencimento de produtos através de alertas personalizados *(a implementar)*
- **Economia de Tempo Avançada:** Eliminação completa do planejamento manual de compras *(objetivo final)*

