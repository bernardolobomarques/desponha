# 🚀 Setup Rápido - Autenticação

## Passo a Passo para Habilitar Login

### 1️⃣ Executar Script SQL

Abra o **Supabase Dashboard** → **SQL Editor** e execute:

```sql
-- Copie e cole TODO o conteúdo do arquivo:
-- database/auth-schema-update.sql
```

⏱️ Tempo: ~30 segundos

### 2️⃣ Reiniciar Servidor

```bash
# Pare o servidor (Ctrl+C) e reinicie
npm run dev
```

### 3️⃣ Testar

1. Acesse `http://localhost:5174`
2. Você verá a tela de login
3. Clique em "Não tem conta? Criar uma"
4. Digite email e senha
5. Faça login

✅ **Pronto!** O sistema agora tem autenticação completa.

---

## ⚠️ Importante

Se você tinha dados com `user_id: 'user_123'`:

```sql
-- Opção 1: Deletar dados antigos
DELETE FROM purchases WHERE user_id::text = 'user_123';
DELETE FROM consumption WHERE user_id::text = 'user_123';
DELETE FROM consumption_patterns WHERE user_id::text = 'user_123';

-- Opção 2: Associar a um usuário real
-- Primeiro, crie um usuário via interface
-- Depois, pegue o UUID do usuário:
SELECT id FROM auth.users WHERE email = 'seu@email.com';

-- Atualize os dados (substitua UUID abaixo):
UPDATE purchases SET user_id = 'UUID_AQUI'::uuid 
WHERE user_id::text = 'user_123';
```

---

## 🎯 O que Mudou

**Antes:**
```typescript
// Todos usavam o mesmo user_id hardcoded
user_id: 'user_123'
```

**Depois:**
```typescript
// Cada usuário autenticado tem seu UUID único
user_id: user.id  // Ex: '550e8400-e29b-41d4-a716-446655440000'
```

---

## 📱 Funcionalidades Disponíveis

✅ Criar conta  
✅ Login  
✅ Logout  
✅ Sessão persistente (fica logado ao fechar/abrir)  
✅ Dados isolados por usuário  
✅ Segurança via Row Level Security  

---

## 💡 Dicas

### Desabilitar Confirmação de Email (Dev)

Dashboard → Authentication → Settings → **Disable** "Enable email confirmations"

### Ver Usuários Cadastrados

Dashboard → Authentication → Users

### Debug

```typescript
// Em qualquer componente:
const { user } = useAuth();
console.log('User:', user);
console.log('User ID:', user?.id);
```

---

## 🔗 Links Úteis

- [Documentação Completa](./AUTENTICACAO.md)
- [Schema SQL](./database/auth-schema-update.sql)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
