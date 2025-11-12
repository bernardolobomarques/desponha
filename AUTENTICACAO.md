# Sistema de Autenticação com Supabase Auth

## ✅ Implementado

O sistema agora conta com autenticação completa usando **Supabase Auth**, isolando os dados de cada usuário e garantindo segurança através de Row Level Security (RLS).

---

## 🔧 Configuração do Banco de Dados

### 1. Executar o Script de Migração

Execute o script `/database/auth-schema-update.sql` no **SQL Editor** do Supabase:

```bash
# O script irá:
# ✅ Converter user_id de TEXT para UUID
# ✅ Adicionar foreign keys para auth.users
# ✅ Atualizar funções para aceitar UUID
# ✅ Habilitar Row Level Security (RLS)
# ✅ Criar policies de acesso isolado por usuário
```

### 2. Principais Mudanças no Banco

- **Tabelas**: `purchases`, `consumption`, `consumption_patterns`
  - Campo `user_id` agora é `UUID` (antes era `TEXT`)
  - Foreign key para `auth.users(id)` com `ON DELETE CASCADE`
  - RLS habilitado para isolamento de dados

- **Funções**:
  - `calculate_consumption_patterns(p_user_id UUID)`
  - `get_shopping_suggestions(p_user_id UUID, p_days_threshold INTEGER)`
  - `seed_test_data(p_user_id UUID)`

- **Policies RLS**:
  - Cada usuário só pode ver, inserir, atualizar e deletar seus próprios dados
  - Policies configuradas para todas as operações (SELECT, INSERT, UPDATE, DELETE)

---

## 🚀 Como Funciona

### 1. Tela de Login/Cadastro

- **Login**: Email + senha (mínimo 6 caracteres)
- **Cadastro**: Cria conta e envia email de confirmação
- Gerenciamento automático de sessão via cookies

### 2. Fluxo de Autenticação

```typescript
// AuthContext gerencia estado global do usuário
const { user, loading, signIn, signUp, signOut } = useAuth();

// App.tsx verifica autenticação
if (loading) return <LoadingScreen />;
if (!user) return <Auth />;
return <AppContent />;
```

### 3. Isolamento de Dados

Todos os componentes agora usam `user.id` automaticamente:

- **App.tsx**: `normalizeProducts(newItems, user.id)`
- **ShoppingList**: `get_shopping_suggestions({ p_user_id: user.id })`
- **ConsumptionTracker**: `insert({ user_id: user.id })`
- **MLStats**: Todas as funções RPC com `user.id`

---

## 📝 Componentes Criados

### 1. `contexts/AuthContext.tsx`

Provider de autenticação com:
- Estado global do usuário autenticado
- Funções: `signUp`, `signIn`, `signOut`
- Listener de mudanças de sessão
- Carregamento automático de sessão persistida

### 2. `components/Auth.tsx`

Tela de login/cadastro com:
- Toggle entre Login e Signup
- Validação de email/senha
- Mensagens de erro/sucesso
- UI moderna e responsiva

### 3. `components/Header.tsx` (Atualizado)

Agora exibe:
- Email do usuário autenticado
- Botão "Sair" para logout
- Layout responsivo

---

## 🔐 Segurança Implementada

### Row Level Security (RLS)

Todas as tabelas agora têm policies que garantem:

```sql
-- Exemplo de policy
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);
```

**Benefícios**:
- ✅ Usuários só acessam seus próprios dados
- ✅ Impossível ver/modificar dados de outros usuários
- ✅ Segurança no nível do banco de dados
- ✅ Proteção contra SQL injection

### Autenticação JWT

- Tokens seguros gerenciados pelo Supabase
- Renovação automática de sessão
- Logout limpa todos os tokens

---

## 🧪 Como Testar

### 1. Criar Conta

```
1. Acesse a aplicação
2. Clique em "Não tem conta? Criar uma"
3. Digite email e senha (mín. 6 caracteres)
4. Clique em "Criar Conta"
5. Verifique seu email para confirmar (opcional para desenvolvimento)
```

### 2. Popular Dados de Teste

Após login, na aba "Lista de Compras":
1. Expanda o painel "ML Debug Stats"
2. Clique em "Popular Testes"
3. Isso criará dados fictícios vinculados ao seu user_id

### 3. Testar Isolamento

```
1. Crie conta A e adicione produtos
2. Faça logout
3. Crie conta B e adicione produtos diferentes
4. Verifique que cada conta vê apenas seus próprios dados
```

---

## 🔄 Mudanças nos Arquivos

### Arquivos Modificados

1. **App.tsx**
   - Wrapped com `<AuthProvider>`
   - Verificação de autenticação antes de renderizar
   - `user.id` em todas as chamadas ao banco

2. **ShoppingList.tsx**
   - `useAuth()` para pegar user.id
   - RPC calls com `p_user_id: user.id`

3. **ConsumptionTracker.tsx**
   - `useAuth()` para pegar user.id
   - Insert com `user_id: user.id`

4. **MLStats.tsx**
   - `useAuth()` para pegar user.id
   - Todas as RPCs com `p_user_id: user.id`

5. **Header.tsx**
   - Exibe email do usuário
   - Botão de logout

6. **productNormalizationService.ts**
   - Removido default value `'user_123'`
   - Agora obrigatório passar userId

### Arquivos Criados

1. `contexts/AuthContext.tsx` - Provider de autenticação
2. `components/Auth.tsx` - Tela de login/signup
3. `database/auth-schema-update.sql` - Script de migração

---

## ⚙️ Configuração de Email (Opcional)

Por padrão, Supabase envia emails de confirmação. Para desenvolvimento:

### Desabilitar Confirmação de Email

1. Acesse Supabase Dashboard
2. Authentication > Settings
3. Desabilite "Enable email confirmations"

### Configurar Email Customizado

1. Authentication > Email Templates
2. Customize templates para:
   - Confirmação de conta
   - Reset de senha
   - Magic link

---

## 🐛 Troubleshooting

### "Error: User not authenticated"

```typescript
// Certifique-se de que o componente está dentro do AuthProvider
<AuthProvider>
  <YourComponent />
</AuthProvider>
```

### "Cannot read property 'id' of null"

```typescript
// Sempre verifique se user existe antes de usar
if (!user) return;
await someFunction(user.id);
```

### RLS bloqueando queries

```sql
-- Verifique se as policies estão corretas
SELECT * FROM pg_policies WHERE tablename = 'purchases';

-- Se necessário, desabilite RLS temporariamente para debug
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
```

### Erro ao executar auth-schema-update.sql

```
Se houver erro de "column does not exist", execute as migrações em ordem:
1. Primeiro DROP das constraints antigas
2. Depois ALTER COLUMN para UUID
3. Por último ADD CONSTRAINT com foreign key
```

---

## 📊 Próximos Passos

- [ ] Implementar "Esqueci minha senha"
- [ ] Adicionar login social (Google, GitHub)
- [ ] Profile page para editar dados do usuário
- [ ] Verificação de email obrigatória em produção
- [ ] Rate limiting para evitar abuso

---

## 🎉 Benefícios Implementados

✅ **Segurança**: Dados isolados por usuário via RLS  
✅ **Privacidade**: Impossível acessar dados de outros  
✅ **Escalabilidade**: Pronto para múltiplos usuários  
✅ **UX**: Login/logout simples e intuitivo  
✅ **Manutenibilidade**: Código limpo com Context API  
✅ **Conformidade**: Preparado para LGPD/GDPR  

---

## 📞 Suporte

Em caso de dúvidas:
1. Verifique os logs do navegador (Console)
2. Verifique os logs do Supabase (Dashboard > Logs)
3. Consulte a documentação: https://supabase.com/docs/guides/auth
