# 🤖 Sistema de Normalização de Produtos com IA

## O Que Faz?

O sistema usa **OpenAI GPT-3.5** para:

1. **Normalizar nomes** de produtos (ex: "leite integral parmalat 1L" → "Leite")
2. **Identificar produtos similares** no banco de dados
3. **Evitar duplicatas** agrupando variações do mesmo produto
4. **Padronizar nomenclatura** para análise ML mais eficaz

## Como Funciona?

### Fluxo Automático

```
OCR da Nota Fiscal
        ↓
["leite integral 1L", "pão francês 6un", "café pilão 500g"]
        ↓
    IA OpenAI analisa cada produto
        ↓
["Leite", "Pão", "Café"]  ← Nomes normalizados
        ↓
Verifica se já existe no banco
        ↓
Se existir: AUMENTA quantidade
Se não: CRIA novo produto
```

### Exemplo Real

**Entrada (OCR):**
```
- Leite integral Parmalat 1 litro
- Leite desnatado Itambé 1L
- Pão francês 6 unidades
- Pão de forma Pullman
```

**Processamento IA:**
```
🔍 Analisando: "Leite integral Parmalat 1 litro"
  ✅ Normalizado: "Leite"
  📊 Similaridade: SIM (Leite existente) - 95%
  ➕ Aumentou quantidade: Leite (3)

🔍 Analisando: "Leite desnatado Itambé 1L"
  ✅ Normalizado: "Leite"
  📊 Similaridade: SIM (Leite existente) - 90%
  ➕ Aumentou quantidade: Leite (4)

🔍 Analisando: "Pão francês 6 unidades"
  ✅ Normalizado: "Pão"
  📊 Similaridade: NÃO
  ✨ Novo produto: Pão

🔍 Analisando: "Pão de forma Pullman"
  ✅ Normalizado: "Pão"
  📊 Similaridade: SIM (Pão) - 85%
  ➕ Aumentou quantidade: Pão (7)
```

**Resultado Final:**
- ✅ 2 produtos únicos criados
- ✅ 4 itens agrupados corretamente
- ✅ Nomes padronizados para ML

## Configuração

### 1. Chave OpenAI

Já está configurada no `.env`:
```env
VITE_OPENAI_API_KEY=sk-proj-...
```

### 2. Verificar Console

Ao adicionar produtos, você verá logs detalhados:

```
🚀 Iniciando adição de produtos...
🤖 Iniciando normalização de produtos com IA...
📦 3 produtos existentes encontrados

🔍 Analisando: "leite integral 1L"
  ✅ Normalizado: "Leite"
  📊 Similaridade: SIM (Leite) - 92%

📋 Produtos normalizados:
  "leite integral 1L" -> "Leite" (EXISTENTE)
  "pão francês" -> "Pão" (NOVO)
  
✨ Normalização concluída!
```

## Benefícios

### 1. Evita Duplicatas
**Antes:**
- Leite integral 1L
- Leite desnatado
- Leite Parmalat
- Leite semi desnatado

**Depois:**
- Leite (quantidade: 4)

### 2. ML Mais Preciso
Padrões de consumo ficam mais consistentes:
```sql
-- Antes (dados fragmentados)
Leite integral → comprado 2x
Leite Parmalat → comprado 1x
Leite 1L → comprado 1x

-- Depois (dados consolidados)
Leite → comprado 4x ✅
```

### 3. Recomendações Melhores
Sistema aprende padrões reais de consumo:
- "Você compra Leite a cada 7 dias"
- "Você compra Pão a cada 3 dias"

## Como Testar

### Teste 1: Produtos Similares
1. Adicione via OCR: "leite integral parmalat 1L"
2. Veja no console: normalizado para "Leite"
3. Adicione via OCR: "leite desnatado itambé 1L"
4. Veja: aumentou quantidade do "Leite" existente!

### Teste 2: Produtos Diferentes
1. Adicione: "arroz tio joão 5kg"
2. Adicione: "feijão carioca 1kg"
3. Veja: criados como produtos separados

### Teste 3: Nomes Bagunçados
```
Entrada:
- CAFÉ PILÃO TRADICIONAL 500G
- cafe pilao 500g
- Café Pilão

Resultado: Todos agrupados em "Café"
```

## Fallback (Se IA Falhar)

Se a OpenAI não responder:
- ✅ Sistema continua funcionando
- ✅ Usa normalização básica (trim, lowercase)
- ⚠️ Pode criar duplicatas

## Logs de Debug

Console mostrará:
```
🤖 Iniciando normalização...        → Início do processo
📦 5 produtos existentes             → Produtos no banco
🔍 Analisando: "produto"             → Cada produto sendo analisado
✅ Normalizado: "Produto"            → Nome final
📊 Similaridade: SIM/NÃO             → Se encontrou match
➕ Aumentou quantidade               → Agrupou com existente
✨ Novo produto                      → Criou novo
✨ Normalização concluída!           → Sucesso
```

## Custo OpenAI

- **Modelo:** GPT-3.5-turbo (mais barato)
- **Custo estimado:** ~$0.001 por produto
- **Exemplo:** 100 produtos = $0.10 USD

## Personalização

### Ajustar Prompt (productNormalizationService.ts)

Você pode editar o prompt para:
- Mudar regras de normalização
- Ajustar sensibilidade de matching
- Adicionar categorias específicas

```typescript
const prompt = `Você é um assistente especializado...
REGRAS CUSTOMIZADAS:
- Sempre use plural (Leites, Pães)
- Mantenha marcas para produtos premium
- ...
`;
```

## Troubleshooting

### ⚠️ "VITE_OPENAI_API_KEY não configurada"
**Solução:** Adicione a chave no `.env` com prefixo `VITE_`

### ⚠️ "OpenAI API error: 401"
**Solução:** Chave inválida ou expirada, gere nova em https://platform.openai.com/api-keys

### ⚠️ "OpenAI API error: 429"
**Solução:** Rate limit atingido, aguarde ou upgrade do plano

### ⚠️ Produtos não estão agrupando
**Solução:** 
1. Verifique logs no console
2. Pode ser produto genuinamente diferente
3. Ajuste confidence threshold no código

## Próximos Passos

1. ✅ Sistema funcionando
2. 🔄 Teste com produtos reais
3. 📊 Monitore logs de normalização
4. 🎯 Ajuste prompt se necessário
5. 🚀 Veja ML aprender padrões corretos!
