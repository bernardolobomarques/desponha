# Documentação Inicial do Projeto

## 1. Identificação do Projeto

**Nome do projeto/solução:** Despensa Virtual Inteligente

**Nome dos integrantes do grupo:** Arthur Schiller

## 2. Motivação

**Por que escolhemos esse tema:**
A escolha da "Despensa Virtual Inteligente" foi motivada pela necessidade de otimizar o gerenciamento doméstico de alimentos em um mundo cada vez mais dinâmico. Com a rotina acelerada da vida moderna, muitas pessoas enfrentam dificuldades para controlar o que possuem em casa, resultando em desperdício de alimentos vencidos ou compras desnecessárias de itens já disponíveis na despensa.

**Relevância prática, acadêmica e social da solução:**
- **Prática:** Facilita o controle de estoque doméstico, economiza tempo no planejamento de compras e reduz custos ao evitar compras duplicadas
- **Acadêmica:** Demonstra a aplicação prática de múltiplas tecnologias de IA (OCR, visão computacional, processamento de linguagem natural) em um cenário real
- **Social:** Contribui para a redução do desperdício alimentar, um problema global que afeta tanto questões ambientais quanto socioeconômicas

## 3. Problema

**Descrição do problema:**
O problema central é a dificuldade em manter um controle eficiente do inventário doméstico de alimentos. Isso inclui:
- Desconhecimento sobre quais produtos estão disponíveis em casa
- Dificuldade em rastrear datas de validade
- Compras desnecessárias por falta de informação
- Desperdício de alimentos vencidos
- Tempo gasto na organização manual do inventário

**Quem é afetado:**
- Famílias que buscam otimizar seus gastos domésticos
- Pessoas com rotinas agitadas que têm pouco tempo para organização
- Indivíduos preocupados com sustentabilidade e redução de desperdício
- Qualquer pessoa que deseje ter melhor controle sobre seus recursos alimentares

## 4. Solução Proposta

**Como a solução funciona:**
A Despensa Virtual Inteligente é uma aplicação web que utiliza inteligência artificial para automatizar o controle de inventário doméstico através de:

1. **Captura Inteligente:** O usuário fotografa ou faz upload de notas fiscais de supermercado
2. **Processamento OCR:** A IA extrai automaticamente os itens da nota fiscal usando três opções de serviços
3. **Padronização:** Os nomes dos produtos são automaticamente padronizados e traduzidos para português claro
4. **Estimativa Inteligente:** O sistema estima datas de validade baseadas no tipo de produto
5. **Gerenciamento:** Os itens são organizados por lotes, prioridades e status de vencimento
6. **Alertas:** Sistema de notificações para itens vencendo ou em baixo estoque
7. **Lista Inteligente:** Geração automática de lista de compras baseada no padrão de consumo

**Como a IA foi utilizada:**
- **Visão Computacional:** Para análise e extração de texto de imagens de notas fiscais
- **OCR (Optical Character Recognition):** Para conversão de texto em imagens para dados estruturados
- **Processamento de Linguagem Natural:** Para padronização e normalização de nomes de produtos
- **Machine Learning:** Para estimativa inteligente de datas de validade baseada em categorias de produtos

**Ferramentas utilizadas:**
- **OpenAI GPT-4 Vision:** Processamento avançado de imagens e padronização de texto (Recomendado)
- **Google Gemini Vision:** Análise inteligente de notas fiscais com compreensão de contexto
- **Mistral OCR:** OCR especializado otimizado para notas fiscais brasileiras
- **React + TypeScript:** Framework para desenvolvimento da interface
- **Vite:** Ferramenta de build e desenvolvimento
- **Tailwind CSS:** Framework de estilização

## 5. Benefícios Esperados

**Ganhos que a solução pode trazer:**

- **Economia de Tempo:** 
  - Eliminação da necessidade de verificação manual da despensa
  - Processamento automático de notas fiscais em segundos
  - Geração instantânea de listas de compras

- **Redução de Custos:**
  - Evita compras duplicadas por desconhecimento do estoque
  - Reduz desperdício de alimentos vencidos
  - Otimiza o planejamento de compras

- **Acessibilidade:**
  - Interface responsiva que funciona em dispositivos móveis e desktop
  - Múltiplas opções de OCR para diferentes necessidades e orçamentos
  - Suporte para captura via câmera ou upload de arquivos

- **Inovação:**
  - Combinação de múltiplas tecnologias de IA em uma solução integrada
  - Processamento inteligente adaptado ao contexto brasileiro
  - Sistema de estimativa de validade baseado em padrões locais

- **Apoio em Tomadas de Decisão:**
  - Dashboard com métricas importantes sobre o inventário
  - Alertas proativos sobre itens vencendo
  - Sugestões inteligentes para reposição baseadas em padrões de consumo
  - Priorização automática de itens por urgência

- **Sustentabilidade:**
  - Contribuição significativa para redução do desperdício alimentar
  - Conscientização sobre padrões de consumo doméstico
  - Otimização do uso de recursos alimentares

---

*Documentação criada em: 29 de setembro de 2025*