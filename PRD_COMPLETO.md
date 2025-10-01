# Product Requirements Document (PRD)
# Despensa Virtual Inteligente

---

## 📋 **INFORMAÇÕES BÁSICAS**

**Nome do Produto:** Despensa Virtual Inteligente (Desponha)  
**Versão do PRD:** 1.0  
**Data:** 30 de setembro de 2025  
**Equipe:** Arthur Schiller, Bernardo Lobo, Bernardo Gonçalves, Guilherme Dias, Michel Melo  
**Tipo de Produto:** Aplicação Web Progressiva (PWA) com migração futura para app nativo  

---

## 🎯 **VISÃO DO PRODUTO**

### **Proposta de Valor**
Automatizar o controle de estoque doméstico através de inteligência artificial, eliminando o esquecimento de compras, o desperdício de alimentos e otimizando o tempo gasto com planejamento de compras.

### **Missão**
Transformar a gestão doméstica de alimentos em um processo automatizado, inteligente e sustentável, ajudando usuários a economizar tempo, dinheiro e reduzir desperdício.

### **Visão**
Tornar-se a principal ferramenta de gestão doméstica no Brasil, sendo indispensável para qualquer pessoa que faça compras de supermercado.

---

## 👥 **ANÁLISE DE USUÁRIOS**

### **Persona Primária - "João, o Independente"**
- **Demografia:** Homem, 25-35 anos, mora sozinho, renda média-alta
- **Comportamento:** Trabalha muito, esquece de fazer compras, compra por impulso
- **Dores:** Esquece itens, desperdiça comida, perde tempo planejando compras
- **Objetivos:** Automatizar compras, reduzir desperdício, economizar tempo

### **Persona Secundária - "Maria, a Organizadora Familiar"**
- **Demografia:** Mulher, 30-45 anos, casada com filhos, administra casa
- **Comportamento:** Organizada, planeja compras, controla orçamento familiar
- **Dores:** Dificuldade de tracking de consumo familiar, listas manuais trabalhosas
- **Objetivos:** Otimizar gastos familiares, reduzir trabalho manual, ter controle total

### **Persona Terciária - "Ana, a Sustentável"** 
- **Demografia:** Mulher, 20-40 anos, consciente ambientalmente
- **Comportamento:** Evita desperdício, compra apenas necessário
- **Dores:** Dificuldade de controlar validades, compras desnecessárias
- **Objetivos:** Reduzir desperdício, comprar sustentavelmente, ter visibilidade total

---

## 🔍 **ANÁLISE DE MERCADO**

### **Problema de Mercado**
- **98% das pessoas** fazem listas de compras manualmente
- **67% dos brasileiros** relatam desperdiçar comida regularmente
- **45% das famílias** compram itens duplicados por não saber o que têm em casa
- **Tempo médio** de 10-15 minutos para criar uma lista de compras

### **Oportunidade**
- Mercado de gestão doméstica no Brasil: **R$ 2.3 bilhões**
- Apps de produtividade crescem **35% ao ano** no Brasil
- **Zero concorrentes** com foco específico em OCR + IA brasileira

### **Diferencial Competitivo**
1. **Primeiro no Brasil** com OCR especializado em notas fiscais brasileiras
2. **Multi-provider OCR** (OpenAI + Gemini + Mistral) para 99% de precisão
3. **Padronização inteligente** adaptada para produtos brasileiros
4. **Machine Learning** para predição personalizada de consumo
5. **Totalmente offline** após carregamento inicial

---

## ⚙️ **ARQUITETURA TÉCNICA**

### **Stack Atual (Implementado)**
- **Frontend:** React 18 + TypeScript + Tailwind CSS + Vite
- **AI Services:** OpenAI GPT-4 Vision, Google Gemini Vision, Mistral OCR
- **Persistência:** localStorage com backup automático
- **Arquitetura:** 8 componentes especializados com estado centralizado
- **Deployment:** Vercel/Netlify (web)

### **Stack Futuro (Roadmap)**
- **Backend:** Node.js + Express + PostgreSQL
- **Database:** Supabase ou Neon para PostgreSQL
- **Authentication:** JWT + OAuth2
- **Mobile:** React Native + Expo
- **Analytics:** Mixpanel + Sentry
- **Infrastructure:** Railway ou Render para backend

---

## 🚀 **FUNCIONALIDADES**

### **FASE 1: MVP WEB (ATUAL - 80% IMPLEMENTADO)**

#### ✅ **Core Features (Implementadas)**
1. **Sistema OCR Inteligente**
   - Upload via câmera ou arquivo
   - 3 provedores de OCR com fallback automático
   - Padronização automática de nomes ("AG MIN" → "Água Mineral")
   - Estimativa automática de datas de validade

2. **Gestão de Estoque**
   - Sistema de lotes individuais por produto
   - CRUD completo de itens
   - Sistema de prioridades (Alta/Média/Baixa)
   - Filtros e busca avançada

3. **Dashboard Inteligente**
   - Estatísticas em tempo real (total, vencendo, vencidos)
   - Categorização automática por status
   - Interface responsiva mobile-first

4. **Lista de Compras Básica**
   - Geração automática baseada em estoque baixo
   - Sistema de completed/pending
   - Sugestões básicas por data de validade

#### 🔨 **Features em Desenvolvimento (20% restante)**
1. **Sistema de Tracking de Consumo**
   - Botão "Consumir" em cada item
   - Registro de quantidade consumida
   - Histórico de consumo por produto
   - Cálculo de taxa de consumo média

2. **Notificações Web Push**
   - Alertas de itens vencendo (1-2 dias antes)
   - Notificações de estoque baixo
   - Lembretes de lista de compras atualizada

3. **Persistência Robusta**
   - Migração de localStorage para IndexedDB
   - Backup automático
   - Sincronização offline/online

### **FASE 2: BACKEND & INTELIGÊNCIA (6-8 semanas)**

#### 🧠 **Machine Learning Engine**
1. **Predição de Consumo**
   - Análise de padrões temporais
   - Algoritmos de velocidade de consumo
   - Detecção de sazonalidade
   - Ajustes por comportamento único

2. **Lista de Compras Inteligente**
   - Predição de quando produtos vão acabar
   - Sugestões proativas antes do fim do estoque
   - Otimização de quantidades baseada no histórico
   - Ranking de prioridade por urgência

3. **Personalização Avançada**
   - Perfil único por usuário
   - Adaptação contínua aos hábitos
   - Clustering de produtos por padrão de uso
   - Detecção de anomalias no consumo

#### 🔗 **Backend Infrastructure**
1. **API REST Completa**
   - CRUD para todos os recursos
   - Sistema de autenticação JWT
   - Rate limiting e segurança
   - Sincronização entre dispositivos

2. **Banco de Dados Estruturado**
   - Schema otimizado para análise temporal
   - Histórico completo de consumo
   - Configurações por usuário
   - Analytics e métricas

### **FASE 3: APP NATIVO & FEATURES AVANÇADAS (8-12 semanas)**

#### 📱 **React Native App**
1. **Features Nativas**
   - Push notifications reais
   - Integração com calendário
   - Scanner de código de barras nativo
   - Widget para tela inicial
   - Compartilhamento nativo

2. **Funcionalidades Premium**
   - Sugestões de receitas baseadas no estoque
   - Integração com supermercados
   - Comparação de preços
   - Histórico familiar compartilhado

---

## 📊 **MÉTRICAS DE SUCESSO**

### **Métricas Primárias**
- **DAU (Daily Active Users):** Objetivo de 1.000 usuários em 6 meses
- **Taxa de Retenção:** 70% após 7 dias, 40% após 30 dias
- **OCR Success Rate:** Manter 99% de sucesso na leitura de notas
- **Time to Value:** Usuário adiciona primeiro item em < 2 minutos

### **Métricas Secundárias**
- **Tempo médio economizado:** De 10min para 2min na criação de listas
- **Redução de desperdício:** 30% menos produtos vencidos reportado pelos usuários
- **Satisfação do usuário:** NPS > 50 após 30 dias de uso
- **Engajamento:** 3+ sessões por semana por usuário ativo

### **Métricas Técnicas**
- **Performance:** Carregamento inicial < 3s
- **Uptime:** 99.9% disponibilidade da API
- **Error Rate:** < 1% de erros em funcionalidades críticas
- **Mobile Performance:** Core Web Vitals > 90

---

## 🎨 **ESPECIFICAÇÕES DE UX/UI**

### **Design System**
- **Tema Principal:** Gradiente slate com toques de azul/verde
- **Typography:** Inter/System fonts para legibilidade
- **Componentes:** Sistema modular com Tailwind CSS
- **Responsividade:** Mobile-first, adaptativo até desktop

### **Fluxo Principal do Usuário**
1. **Onboarding:** Tutorial de 3 passos (fotografar → confirmar → pronto)
2. **Dashboard:** Visão geral com call-to-actions claros
3. **Adição:** FAB com opções câmera/manual
4. **Confirmação:** Interface de edição antes de salvar
5. **Lista de Compras:** Geração automática com toggle manual

### **Estados da Interface**
- **Loading States:** Spinners com mensagens contextuais
- **Empty States:** Ilustrações motivadoras com CTAs
- **Error States:** Mensagens claras com ações de recuperação
- **Success States:** Feedback positivo com próximos passos

---

## 🔐 **REQUISITOS TÉCNICOS**

### **Performance**
- **Web Vitals:** LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Bundle Size:** < 500KB gzipped inicial
- **Offline Capability:** Funcionalidade completa sem internet
- **Cache Strategy:** Service Worker com estratégia cache-first

### **Segurança**
- **Data Privacy:** Todos os dados começam locais
- **API Security:** Rate limiting, CORS, sanitização
- **Authentication:** JWT com refresh tokens
- **Compliance:** LGPD compliance para dados brasileiros

### **Compatibilidade**
- **Browsers:** Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- **Mobile:** iOS 14+, Android 8+
- **PWA:** Installable, offline-capable
- **Accessibility:** WCAG 2.1 AA compliance

---

## 🗓️ **ROADMAP E CRONOGRAMA**

### **Q4 2025 (Out-Dez): MVP Web Completion**
- ✅ Finalizar tracking de consumo
- ✅ Implementar notificações web
- ✅ Migrar para IndexedDB
- ✅ Beta testing com 50 usuários

### **Q1 2026 (Jan-Mar): Backend & ML**
- 🔨 Desenvolver API backend completa
- 🔨 Implementar engine de machine learning
- 🔨 Sistema de usuários e autenticação
- 🔨 Deploy em produção

### **Q2 2026 (Abr-Jun): Mobile Development**
- 📱 Migração para React Native
- 📱 Features nativas implementadas
- 📱 Beta testing em stores
- 📱 Launch oficial iOS/Android

### **Q3 2026 (Jul-Set): Growth & Scale**
- 📈 Marketing e aquisição de usuários
- 📈 Features premium
- 📈 Integrações com supermercados
- 📈 Análise e otimização baseada em dados

---

## 💰 **MODELO DE NEGÓCIO**

### **Fase 1: Freemium (0-12 meses)**
- **Gratuito:** Todas as funcionalidades básicas
- **Premium ($9.90/mês):** Analytics avançados, histórico ilimitado, sugestões de receitas
- **Objetivo:** Ganhar base de usuários e validar PMF

### **Fase 2: SaaS + Partnerships (12+ meses)**
- **B2C Subscription:** Tiers de funcionalidades
- **B2B Partnerships:** Comissões de supermercados
- **Data Insights:** Relatórios anonimizados para FMCG
- **Objetivo:** Monetização escalável e sustentável

---

## 🚨 **RISCOS E MITIGAÇÕES**

### **Riscos Técnicos**
- **API Costs:** OCR pode ser caro em escala → Cache agressivo + otimização
- **Accuracy:** OCR pode falhar → 3 providers + validação manual
- **Performance:** App pode ficar lento → Lazy loading + otimização bundle

### **Riscos de Mercado**
- **Adoção:** Usuários podem não aderir → Onboarding simplificado + value demo
- **Competição:** Grandes players podem copiar → Foco em execução + inovação
- **Monetização:** Difficulty to monetize → Multiple revenue streams

### **Riscos Operacionais**
- **Team Capacity:** Equipe pequena → Priorização rigorosa + MVP approach
- **Technical Debt:** Código pode degradar → Code review + refactoring regular
- **User Support:** Suporte pode não escalar → FAQ + self-service tools

---

## 📈 **DEFINIÇÃO DE SUCESSO**

### **6 Meses (MVP Success)**
- 1.000 usuários ativos mensalmente
- 70% dos usuários completam onboarding
- 4.5/5 rating em user feedback
- 99% uptime e performance

### **12 Meses (Product-Market Fit)**
- 10.000 usuários ativos mensalmente
- 40% retenção após 30 dias
- NPS > 50
- Break-even operacional

### **24 Meses (Scale Success)**
- 100.000 usuários ativos mensalmente
- App nas top 50 de produtividade nas stores
- Parcerias com 3+ grandes redes de supermercado
- Receita recorrente de $100k/mês

---

*PRD criado em: 30 de setembro de 2025*  
*Próxima revisão: 15 de outubro de 2025*