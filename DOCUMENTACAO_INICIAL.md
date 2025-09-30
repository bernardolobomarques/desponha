# Documentação Inicial do Projeto

## 1. Identificação do Projeto

**Nome do projeto/solução:** Despensa

**Slogan:** *"Nunca mais esqueça o que comprar no supermercado"*

**Nome dos integrantes do grupo:** Arthur Schiller, Bernardo Lobo, Bernardo Gonçalves, Guilherme Dias, Michel Melo

## 2. Motivação

A ideia da **Despensa** nasceu de uma dor pessoal de um integrante do grupo que mora sozinho. Ele percebia que, com frequência, esquecia de comprar certos alimentos no supermercado — acreditava que ainda tinha em casa, mas não tinha, ou então comprava em excesso e acabava acumulando.

Essa situação, que parece simples, é muito comum no dia a dia de qualquer pessoa que cuida das compras de casa. E foi a partir desse problema real que surgiu a proposta de criar uma solução que automatize e facilite o gerenciamento do que se tem em casa, evitando tanto a falta quanto o excesso de alimentos.

### Relevância prática, acadêmica e social da solução:

- **Prática:** Ajuda as pessoas a nunca esquecerem o que comprar e evita esforço manual na hora de planejar compras
- **Acadêmica:** Permite aplicar IA, visão computacional e machine learning em um contexto próximo da realidade cotidiana
- **Social:** Reduz desperdício de alimentos, um problema ambiental e econômico que afeta milhões de famílias

## 3. Problema

O principal problema que a **Despensa** resolve é a dificuldade em manter um controle eficiente dos alimentos em casa. Isso gera:

- ❌ Esquecimento de itens importantes no supermercado
- ❌ Compras duplicadas por achar que um produto acabou
- ❌ Falta de alimentos essenciais em momentos críticos (ex: ingredientes da marmita)
- ❌ Desperdício de alimentos comprados em excesso
- ❌ Tempo gasto criando listas de compras manuais

### Quem é afetado:

- 👤 Pessoas que moram sozinhas e cuidam da própria alimentação
- 👨‍👩‍👧‍👦 Famílias que precisam otimizar gastos e organizar compras
- 🌱 Indivíduos preocupados em reduzir desperdício e manter uma rotina mais organizada

## 4. Solução Proposta

A **Despensa** é um webapp (com visão futura de virar app nativo para celular) que automatiza o controle de compras e estoque doméstico através de inteligência artificial.

### Como funciona:

1. **📸 Captura Inteligente:** O usuário fotografa ou faz upload da nota fiscal do supermercado
2. **🔍 Processamento OCR:** O sistema extrai automaticamente os itens comprados
3. **📝 Padronização:** Produtos são organizados com nomes claros e consistentes
4. **🧠 Estimativa de Consumo:** O sistema aprende o ritmo de compra do usuário. Exemplo:
   - Se alguém compra leite a cada 7 dias, o sistema sugere a reposição automaticamente
   - Se toddy dura 3 dias na casa do usuário, no 2º dia o app já avisa que está na hora de comprar
5. **📋 Lista Automática:** O app gera listas de compras de acordo com os padrões de consumo
6. **✅ Interatividade:** O usuário pode marcar itens como "comprados" ou removê-los da lista
7. **🔔 Notificações:** Alertas push lembram o usuário quando um produto está prestes a acabar
8. **🍳 Extras:** Sugestões sutis de receitas usando o que já está disponível na despensa

### Diferencial da Despensa:

- ✨ Não se limita a apenas registrar o que há em casa
- 🎯 Aprende o ritmo de consumo de cada usuário e antecipa as necessidades, montando listas personalizadas
- 🚀 Vai além de lembrar "o que falta", ajuda a nunca ficar sem e nunca comprar demais

### Tecnologias utilizadas (protótipo):

- **Frontend:** React + TypeScript + Tailwind + Vite (foco em prototipagem rápida)
- **Backend:** Express.js
- **Banco de Dados:** PostgreSQL (Supabase)
- **OCR/IA:** 
  - OpenAI GPT-4 Vision (Recomendado)
  - Google Gemini Vision
  - Mistral OCR

## 5. Benefícios Esperados

- **⚡ Praticidade:** Elimina a necessidade de criar listas de compras manuais
- **🛡️ Segurança:** Garante que alimentos essenciais nunca faltem
- **💰 Economia:** Evita compras duplicadas e desperdício de comida
- **🌍 Sustentabilidade:** Reduz o descarte desnecessário de alimentos
- **🚀 Inovação:** Combina OCR + machine learning para entregar uma experiência personalizada
- **📱 Acessibilidade:** Webapp funcional em qualquer dispositivo, com futuro app nativo para notificações push

## 6. Perspectivas Futuras

- 📱 Evoluir de um MVP funcional para um app nativo de celular
- 🔔 Incluir notificações personalizadas no smartphone
- 🏠 Explorar integração com assistentes virtuais (Google Home, Alexa)
- 🛒 Possibilidade de integração com supermercados para automatizar reposição

## 7. Sonho Grande

🎯 Transformar a **Despensa** em um app de uso cotidiano para qualquer pessoa que faça compras de mercado, tornando-se uma ferramenta indispensável para otimizar tempo, economizar dinheiro e reduzir desperdício alimentar.

---

*Documentação criada em: 29 de setembro de 2025*