# Despensa Virtual Inteligente

## 📑 **Apresentação do Projeto**
🎨 **[Ver Apresentação Completa](https://gamma.app/docs/Despensa-5vig9ish7tg2toe)**

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

