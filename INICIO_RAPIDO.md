# 🚀 INÍCIO RÁPIDO - 5 Passos

## ✅ PASSO 1: Criar Projeto no Supabase (5 min)

1. Acesse https://supabase.com e faça login
2. Clique em **"New Project"**
3. Preencha:
   - **Name:** `desponha-ml`
   - **Database Password:** Crie uma senha forte e ANOTE
   - **Region:** `South America (São Paulo)`
4. Clique em **"Create new project"**
5. ⏳ Aguarde ~2 minutos

## ✅ PASSO 2: Copiar Credenciais (2 min)

1. No dashboard do projeto, vá em: **Settings** (ícone de engrenagem) → **API**
2. Você verá duas informações importantes:

```
Project URL:  https://xxxxxxxxxxxxx.supabase.co
anon public:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
```

3. **COPIE** ambas!

## ✅ PASSO 3: Configurar .env (1 min)

1. Abra o arquivo `.env` na raiz do projeto
2. Preencha as duas linhas do Supabase:

```env
VITE_SUPABASE_URL=cole_a_project_url_aqui
VITE_SUPABASE_ANON_KEY=cole_a_anon_public_key_aqui
```

**Exemplo:**
```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ✅ PASSO 4: Criar Tabelas no Banco (3 min)

1. No Supabase, vá em **SQL Editor** (ícone <>)
2. Clique em **"New Query"**
3. Abra o arquivo `database/supabase-schema-v2.sql` deste projeto
4. **Copie TODO o conteúdo** do arquivo
5. **Cole** no SQL Editor do Supabase
6. Clique em **"Run"** (ou F5)
7. ✅ Deve aparecer mensagens de sucesso

**Verificar:**
- Vá em **Table Editor** (ícone de tabela)
- Deve ver 3 tabelas: `purchases`, `consumption`, `consumption_patterns`

## ✅ PASSO 5: Popular com Dados de Teste (1 min)

### Opção A: Dados Simples (Leite e Pão)
1. Ainda no **SQL Editor**, crie uma nova query
2. Cole este comando:

```sql
SELECT seed_test_data();
```

3. Clique em **"Run"**
4. ✅ Deve retornar: "Dados de teste inseridos com sucesso!"

### Opção B: Despensa Completa (8 produtos - RECOMENDADO!)
1. Abra o arquivo `database/quick-seed.sql` deste projeto
2. **Copie TODO o conteúdo** do arquivo
3. **Cole** no SQL Editor do Supabase
4. Clique em **"Run"**
5. ✅ Vai criar 8 produtos com diferentes urgências!

**Verificar os dados:**
```sql
SELECT * FROM v_patterns_summary;
```

Deve mostrar padrões calculados! 🎉

**Ver sugestões para lista de compras:**
```sql
SELECT * FROM get_shopping_suggestions('default-user', 2);
```

---

## 🎉 PRONTO! Agora rode o app:

```bash
npm run dev
```

Abra http://localhost:5173 e o app já está conectado ao Supabase!

---

## 🧪 Como Testar o Sistema

### Teste 1: Verificar Conexão

No console do navegador (F12), deve aparecer:
```
✅ Supabase conectado com sucesso!
```

### Teste 2: Adicionar um Produto

1. Clique no botão **+** (FAB)
2. Escolha "Adicionar Manualmente"
3. Adicione um produto (ex: "Café")
4. Vá no Supabase → **Table Editor** → **purchases**
5. ✅ Deve aparecer uma nova linha com "Café"

### Teste 3: Registrar Consumo

1. Na despensa, clique em um item
2. Clique em "Registrar consumo" (ícone de garfo/faca)
3. Informe quantidade e confirme
4. Vá no Supabase → **Table Editor** → **consumption**
5. ✅ Deve aparecer o registro do consumo

### Teste 4: Ver Padrões Calculados

No Supabase SQL Editor:
```sql
SELECT * FROM v_patterns_summary;
```

Deve mostrar os padrões calculados automaticamente!

### Teste 5: Ver Sugestões Inteligentes

1. No app, vá na aba **"Lista de Compras"**
2. Deve mostrar produtos que estão perto de acabar
3. Produtos com badge **"Padrão de Consumo"** são sugestões baseadas em IA!

---

## 🎯 Simulando Semanas de Uso

Para testar o algoritmo, você pode manipular as datas no banco:

```sql
-- Fazer parecer que um produto foi comprado há 7 dias
UPDATE purchases 
SET purchase_date = CURRENT_DATE - INTERVAL '7 days'
WHERE product_name = 'Café';

-- Recalcular padrões
SELECT * FROM calculate_consumption_patterns();

-- Ver quando o app vai sugerir comprar de novo
SELECT * FROM v_patterns_summary WHERE product_name = 'Café';
```

---

## ❓ Problemas Comuns

**Erro: "Supabase não configurado"**
- Verifique se o `.env` está preenchido corretamente
- Reinicie o servidor: `Ctrl+C` e depois `npm run dev`

**Tabelas não aparecem no Supabase**
- Execute novamente o SQL do schema-v2.sql
- Verifique se não houve erros na execução

**Sugestões não aparecem na lista**
- Execute: `SELECT * FROM calculate_consumption_patterns();`
- Verifique se há produtos com `days_until_next_purchase <= 2`

---

## 📚 Próximos Passos

Depois que tudo estiver funcionando:

1. ✅ Teste adicionar vários produtos
2. ✅ Teste registrar consumos
3. ✅ Manipule datas para simular padrões
4. ✅ Observe as sugestões inteligentes aparecerem
5. 🎨 Vamos criar o painel de debug (MLStats) para facilitar os testes

**Está tudo funcionando?** Me avise e vamos para o próximo passo! 🚀
