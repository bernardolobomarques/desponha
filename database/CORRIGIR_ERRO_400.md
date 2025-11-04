# 🔧 Corrigindo Erro 400 no Supabase

## ❌ O Problema
```
Failed to load resource: the server responded with a status of 400
❌ Erro ao registrar compra no Supabase
message: 'DELETE requires a WHERE clause'
```

## 🎯 Causas (2 problemas!)
1. **Trigger com DELETE sem WHERE** - Trigger tentando deletar sem filtro de usuário
2. **Row Level Security (RLS)** - Bloqueando inserções

## ✅ Solução Rápida (5 minutos)

### Passo 1: Acessar Supabase SQL Editor
1. Abra https://supabase.com
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral
4. Clique em **"New Query"**

### Passo 2: Executar Script de Correção
Copie e cole este código COMPLETO no SQL Editor:

```sql
-- CORREÇÃO 1: Corrigir Triggers (CRÍTICO!)
DROP TRIGGER IF EXISTS after_purchase_insert ON purchases;
DROP TRIGGER IF EXISTS after_consumption_insert ON consumption;
DROP FUNCTION IF EXISTS trigger_recalculate_patterns();

CREATE OR REPLACE FUNCTION trigger_recalculate_patterns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM calculate_consumption_patterns(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_purchase_insert
  AFTER INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_patterns();

CREATE TRIGGER after_consumption_insert
  AFTER INSERT ON consumption
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_patterns();

-- CORREÇÃO 2: Desabilitar RLS para desenvolvimento
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE consumption DISABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_patterns DISABLE ROW LEVEL SECURITY;

-- Verificar se funcionou
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('purchases', 'consumption', 'consumption_patterns');
```

Clique em **"Run"** ou `Ctrl+Enter`

### Passo 3: Verificar Resultado
Você deve ver algo assim:
```
tablename              | rls_enabled
----------------------|-------------
purchases             | false
consumption           | false
consumption_patterns  | false
```

✅ Se `rls_enabled = false` → Sucesso!

---

## 🧪 Testar Novamente

1. Volte para o app (`http://localhost:5174`)
2. Abra o Console (F12)
3. Adicione um produto (nota fiscal ou manual)
4. Deve aparecer: `✅ Compra registrada no Supabase: NomeProduto (quantidade)`

---

## 🔍 Outras Causas Possíveis (se ainda não funcionar)

### Verificar 1: Tabelas Existem?
No Supabase SQL Editor, execute:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN ('purchases', 'consumption', 'consumption_patterns');
```

**Deve retornar 3 linhas.** Se não retornar, execute `reset-and-create.sql` novamente.

### Verificar 2: Colunas Corretas?
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchases';
```

**Deve ter:** id, user_id, product_name, quantity, purchase_date, expiry_date, created_at

### Verificar 3: Credenciais .env Corretas?
Abra `.env` e confirme:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi... (chave longa)
```

**IMPORTANTE:** Depois de alterar `.env`, reinicie o servidor:
```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

---

## 📊 Ver Logs Detalhados

Com o código atualizado, agora você verá detalhes completos do erro no console:
```javascript
{
  error: {...},
  message: "descrição do erro",
  details: "detalhes técnicos",
  hint: "dica do PostgreSQL",
  code: "código do erro",
  produto: { name: "...", quantity: ... }
}
```

Copie esse log e me mostre se o problema persistir!

---

## 🎯 Checklist de Correção

- [ ] Executei `fix-permissions.sql` no Supabase
- [ ] RLS está desabilitado (false)
- [ ] Reiniciei o servidor (`npm run dev`)
- [ ] Console mostra "✅ Compra registrada"
- [ ] Não há mais erros 400

Se todos os itens estiverem ✅, está funcionando! 🎉

---

## 💡 Próximo Passo (Depois de Corrigir)

1. Adicione 2-3 produtos via OCR ou manual
2. Vá para **Lista de Compras**
3. Expanda **MLStats** → Clique **"📦 Popular Testes"**
4. Veja os padrões aprendidos na tabela
5. Teste as recomendações! 🚀
