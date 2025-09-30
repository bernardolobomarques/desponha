# 🔄 Fluxos de Usuário - Despensa Virtual Inteligente

*Documentação completa dos fluxos de interação do usuário com a plataforma*

---

## 📱 **FLUXO BÁSICO - PRIMEIRO USO**

### **1. Onboarding (Primeira Experiência)**

```
🏠 Usuário acessa a aplicação
    ↓
📋 Tela inicial vazia com CTA principal
    ↓ [Clica em "Escanear Nota Fiscal"]
📸 Seleção de método (Câmera ou Upload)
    ↓ [Escolhe uma opção]
🤖 Processamento OCR com IA
    ↓ [IA extrai os produtos]
✅ Confirmação dos itens extraídos
    ↓ [Usuário confirma/edita]
🏠 Despensa populada com primeiros itens
```

**Tempo estimado:** 2-3 minutos
**Resultado:** Usuário tem sua primeira experiência completa e despensa populated

---

## 🔄 **FLUXOS PRINCIPAIS**

### **2.1 FLUXO: Adicionar Itens via Nota Fiscal**

#### **Versão Completa (Passo a Passo):**

```
🏠 Dashboard Principal
    ↓ [FAB ou "Escanear Nota Fiscal"]
📸 Tela de Captura
    ├── [Opção 1] Tirar Foto
    │     ↓ 📷 Câmera ativa
    │     ↓ [Usuário fotografa nota]
    │     ↓ ✅ Foto capturada
    │
    └── [Opção 2] Upload Arquivo
          ↓ 📁 Seletor de arquivo
          ↓ [Usuário seleciona imagem]
          ↓ ✅ Arquivo selecionado
    
🔧 Seleção de Serviço OCR
    ├── OpenAI Vision (Recomendado)
    ├── Google Gemini
    └── Mistral OCR
    
⏳ Processamento (2-10 segundos)
    ├── "Analisando sua nota fiscal..."
    ├── "IA identificando produtos..."
    ├── "Padronizando nomes..."
    └── "Estimando validades..."
    
📝 Tela de Confirmação
    ├── Lista de produtos extraídos
    ├── [Editar] Nome do produto
    ├── [Editar] Quantidade  
    ├── [Editar] Data de validade
    └── [Remover] Item individual
    
✅ [Confirmar] Adicionar X itens à despensa
    ↓
🏠 Retorna ao Dashboard (itens adicionados)
    ├── Mensagem de sucesso
    ├── Dashboard atualizado
    └── Itens organizados por vencimento
```

**Tempo estimado:** 30-60 segundos
**Taxa de sucesso esperada:** 95%

---

### **2.2 FLUXO: Adicionar Item Manual**

```
🏠 Dashboard Principal
    ↓ [FAB → "Adicionar Manualmente"]
📝 Formulário Manual
    ├── Nome do produto
    │   └── 🤖 Auto-padronização (OpenAI)
    ├── Quantidade
    ├── Data de validade
    └── Prioridade (Alta/Média/Baixa)
    
✅ [Salvar Item]
    ↓
🏠 Retorna ao Dashboard
```

**Tempo estimado:** 15-30 segundos
**Uso:** 20% dos itens adicionados

---

### **2.3 FLUXO: Consumir Produto**

```
🏠 Dashboard Principal
    ↓ [Seleciona item da despensa]
📦 Card do Produto Expandido
    ├── Informações detalhadas
    ├── Lotes individuais
    └── [Botão "Consumir"]
    
📊 Modal de Consumo
    ├── Quantidade a consumir
    ├── Seleção do lote (se múltiplos)
    └── [Confirmar Consumo]
    
🔄 Atualização Automática
    ├── Quantidade reduzida
    ├── Histórico de consumo atualizado
    ├── Padrão de consumo recalculado
    └── Lista de compras atualizada
```

**Frequência:** Diária (produto de uso cotidiano)
**Impacto:** Essencial para aprendizado de padrões

---

### **2.4 FLUXO: Lista de Compras**

#### **Visualização da Lista:**
```
🏠 Dashboard Principal
    ↓ [Tab "Lista de Compras"]
🛒 Lista de Compras
    ├── 📊 Resumo (X itens pendentes)
    ├── 🔍 Busca/Filtros
    ├── 📝 Itens Sugeridos
    │   ├── Estoque baixo (vermelho)
    │   ├── Padrão de consumo (azul)
    │   └── Itens vencidos (laranja)
    └── ✅ Itens já comprados
```

#### **Usando no Supermercado:**
```
🛒 Lista de Compras Ativa
    ↓ [No supermercado]
📱 Interface Simplificada
    ├── Itens grandes e claros
    ├── ✅ Marcar como comprado
    ├── 🔄 Modo offline
    └── 📊 Progresso visual
    
✅ Finalizar Compras
    ├── Resumo dos itens comprados
    ├── [Opção] Processar nova nota fiscal
    └── 🔄 Lista limpa para próxima vez
```

**Frequência:** Semanal/Quinzenal
**Tempo médio no supermercado:** Redução de 30%

---

## 🔧 **FLUXOS AVANÇADOS**

### **3.1 FLUXO: Gerenciamento Detalhado de Itens**

#### **Editando Grupos de Produtos:**
```
🏠 Dashboard → 📦 Card do Produto
    ↓ [Ícone editar]
✏️ Modo Edição do Grupo
    ├── Nome do produto
    ├── Prioridade
    ├── [Salvar] ou [Cancelar]
    └── [Excluir Grupo] ⚠️
    
⚠️ Modal de Confirmação
    ├── "Excluir [Nome] e todos os lotes?"
    ├── [Cancelar] ou [Confirmar]
    └── ✅ Item removido permanentemente
```

#### **Gerenciando Lotes Individuais:**
```
📦 Card do Produto Expandido
    ↓ Seção "Lotes Individuais"
📋 Lista de Lotes
    ├── Lote 1: Qtd 2, Vence em 5 dias
    │   ├── [Editar] ✏️
    │   └── [Excluir] 🗑️
    ├── Lote 2: Qtd 1, Vence em 12 dias
    └── [+ Adicionar novo lote]
    
✏️ Editando Lote Individual
    ├── Quantidade
    ├── Data de vencimento
    ├── [Salvar] ou [Cancelar]
    └── Auto-exclusão se quantidade = 0
```

---

### **3.2 FLUXO: Sistema de Filtros e Busca**

```
🏠 Dashboard Principal
    ↓ Barra de Filtros
🔍 Sistema de Filtros
    ├── 🔍 Busca por nome
    ├── 📊 Filtros rápidos
    │   ├── [Todos] - X itens
    │   ├── [Vencendo] - Y itens
    │   └── [Vencidos] - Z itens
    └── 📂 Seções colapsáveis
        ├── ⚠️ Itens Vencidos
        ├── ⏰ Vencendo em Breve  
        └── 📦 Demais Itens
```

**Funcionalidades:**
- Busca em tempo real
- Contadores dinâmicos
- Seções colapsáveis
- Ordenação automática por urgência

---

### **3.3 FLUXO: Notificações e Alertas**

#### **Configuração de Notificações:**
```
⚙️ Configurações (futuro)
    ↓ Seção Notificações
🔔 Preferências de Notificação
    ├── ✅ Itens vencendo (2 dias antes)
    ├── ✅ Estoque baixo
    ├── ✅ Lista de compras atualizada
    ├── ❌ Sugestões de receitas
    └── 🕐 Horário preferido: 09:00
```

#### **Recebendo Notificações:**
```
📱 Notificação Push/Web
    ├── "🏠 Despensa: 3 itens vencendo amanhã"
    ├── [Ver detalhes] → Abre app
    ├── [Adicionar à lista] → Quick action
    └── [Dispensar]
    
🏠 Abrindo via Notificação
    ├── Destaque nos itens urgentes
    ├── CTA para lista de compras
    └── Opção de "Marcar como visto"
```

---

### **3.4 FLUXO: Dashboard e Analytics**

#### **Dashboard Expandido:**
```
🏠 Dashboard Principal
    ├── 📊 Cards de Estatísticas
    │   ├── 📦 Total de Itens: X
    │   ├── ⏳ Vencendo: Y
    │   └── ❗ Vencidos: Z
    ├── 📈 Gráficos (futuro)
    │   ├── Consumo mensal
    │   ├── Produtos mais comprados
    │   └── Economia gerada
    └── 🎯 Insights Inteligentes
        ├── "Você economizou R$ X este mês"
        ├── "3 produtos não consumidos"
        └── "Padrão: compras a cada 8 dias"
```

---

## 🚨 **FLUXOS DE ERRO E RECUPERAÇÃO**

### **4.1 Erros no Processamento OCR**

```
📸 Usuário envia nota fiscal
    ↓ OCR falha ou não encontra itens
❌ Tela de Erro
    ├── "Não conseguimos processar esta nota"
    ├── Possíveis causas:
    │   ├── Imagem muito escura
    │   ├── Nota fiscal danificada
    │   └── Formato não reconhecido
    ├── [Tentar novamente]
    ├── [Trocar serviço OCR]
    └── [Adicionar manualmente]
```

### **4.2 Problemas de Conectividade**

```
📱 App sem internet
    ↓ Usuário tenta usar OCR
⚠️ Modo Offline
    ├── "Sem conexão com internet"
    ├── "Funcionalidades disponíveis:"
    │   ├── ✅ Ver despensa
    │   ├── ✅ Lista de compras
    │   ├── ✅ Consumir itens
    │   └── ❌ Processar notas fiscais
    └── 🔄 "Conecte-se para sincronizar"
```

---

## 📊 **MÉTRICAS E COMPORTAMENTOS ESPERADOS**

### **Frequência de Uso:**
- **Primeira semana:** 5-7 interações (setup inicial)
- **Uso regular:** 2-3 interações por semana
- **Pico de uso:** Fins de semana (preparação para compras)

### **Jornada Típica do Usuário:**
```
Semana 1: Descoberta e Setup
├── Escaneia 2-3 notas fiscais antigas
├── Adiciona alguns itens manuais
└── Explora funcionalidades

Semana 2-4: Adoção
├── Começa a registrar consumo
├── Usa lista de compras básica
└── Recebe primeiras notificações

Mês 2+: Engajamento
├── Padrões de consumo estabelecidos
├── Lista de compras precisa
├── Redução no desperdício
└── Hábito estabelecido
```

### **Pontos de Abandono (Churn):**
1. **Primeira nota fiscal falha** (30% abandono)
2. **Lista de compras imprecisa** (20% abandono)
3. **Muitas notificações** (15% abandono)
4. **Interface confusa** (10% abandono)

---

## 🎯 **OTIMIZAÇÕES DE UX POR FLUXO**

### **Fluxo de Onboarding:**
- ✅ Tutorial interativo
- ✅ Dados de exemplo pré-carregados
- ✅ Primeiros sucessos garantidos

### **Fluxo de OCR:**
- ✅ Feedback em tempo real
- ✅ Múltiplas opções de serviço
- ✅ Fallback para entrada manual

### **Fluxo de Consumo:**
- ✅ Quick actions
- ✅ Lembrete contextual
- ✅ Gamificação sutil

### **Fluxo de Lista de Compras:**
- ✅ Modo supermercado (UI simplificada)
- ✅ Categorização inteligente
- ✅ Compartilhamento fácil

---

## 🔮 **FLUXOS FUTUROS (Roadmap)**

### **Integração com Assistentes:**
```
🏠 Em casa → "Alexa, o que falta na despensa?"
    ↓ Integração via API
🤖 Alexa responde: "Você precisa comprar leite e pão"
    ↓ [Comando de voz]
✅ "Adicionar à lista de compras"
```

### **Integração com Supermercados:**
```
🛒 No supermercado → App detecta localização
    ↓ Oferece integração
💳 "Conectar com cartão de crédito?"
    ↓ [Usuario aceita]
📊 Compras automáticas adicionadas
    ↓ Sem necessidade de nota fiscal
🏠 Despensa atualizada automaticamente
```

### **Social Features:**
```
👨‍👩‍👧‍👦 Despensa Familiar
    ├── Múltiplos usuários
    ├── Notificações compartilhadas
    ├── Lista de compras colaborativa
    └── Histórico familiar
```

---

*Documentação de fluxos criada em: 30 de setembro de 2025*
*Baseada na análise do código atual e visão do produto*