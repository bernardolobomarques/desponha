# 📁 Database Scripts

Esta pasta contém todos os scripts SQL para configurar e testar o sistema de ML.

## 📄 Arquivos

### 1. `supabase-schema-v2.sql` ⭐ **EXECUTAR PRIMEIRO**
**O que faz:** Cria todas as tabelas, funções, triggers e views no banco de dados.

**Quando usar:** Uma única vez, no início do setup do Supabase.

**Como usar:**
1. Abra o Supabase SQL Editor
2. Copie TODO o conteúdo deste arquivo
3. Cole e execute (Run/F5)
4. Verifique se apareceu: "✅ Schema criado com sucesso!"

---

### 2. `quick-seed.sql` ⭐ **RECOMENDADO PARA TESTES**
**O que faz:** Popula o banco com 8 produtos realistas com diferentes padrões de consumo.

**Produtos incluídos:**
- 🥛 Leite (a cada 5 dias)
- 🍞 Pão (a cada 3 dias - URGENTE!)
- ☕ Café (a cada 14 dias - URGENTE!)
- 🥚 Ovos (a cada 10 dias)
- 🧀 Queijo (a cada 7 dias)
- 🍚 Arroz (a cada 30 dias)
- 🫘 Feijão (a cada 21 dias)
- 🧈 Manteiga (a cada 12 dias)

**Quando usar:** Sempre que quiser testar com dados completos e realistas.

**Como usar:**
1. Copie TODO o conteúdo do arquivo
2. Cole no Supabase SQL Editor
3. Execute
4. Verifique com: `SELECT * FROM v_patterns_summary;`

---

### 3. `seed-data-scenarios.sql` 📚 **CENÁRIOS AVANÇADOS**
**O que faz:** Contém 10+ cenários diferentes para testar situações específicas.

**Cenários incluídos:**
- **Cenário 1:** Dados básicos (Leite e Pão)
- **Cenário 2:** Despensa completa (10 produtos)
- **Cenário 3:** Produto novo (aprendendo padrão)
- **Cenário 4:** Produtos urgentes (acabando hoje!)
- **Cenário 5:** Manipulação de datas
- **Cenário 6:** Padrão irregular
- **Cenário 7:** Múltiplos usuários
- **Cenário COMPLETO:** Simulação de 1 mês

**Quando usar:** Para testar casos específicos e entender como o algoritmo funciona.

**Como usar:**
1. Escolha um cenário
2. Copie o código do cenário (do `SELECT clear_all_data()` até o final)
3. Cole no SQL Editor
4. Execute e observe os resultados

---

### 4. `useful-commands.sql` 🛠️ **COMANDOS ÚTEIS**
**O que faz:** Coleção de comandos prontos para usar durante os testes.

**Inclui:**
- Ver dados (padrões, histórico, sugestões)
- Adicionar compras e consumos manualmente
- Manipular datas (simular passagem do tempo)
- Editar e corrigir dados
- Análises e estatísticas
- Comandos de debug

**Quando usar:** Durante os testes, copie e execute conforme necessário.

**Dica:** Mantenha este arquivo aberto enquanto testa!

---

### 5. `supabase-schema.sql` ⚠️ **LEGADO - NÃO USAR**
Versão antiga do schema. Use o `supabase-schema-v2.sql` em vez deste.

---

## 🚀 Fluxo Recomendado

### Setup Inicial (1x apenas)
```sql
-- 1. Executar schema
-- Arquivo: supabase-schema-v2.sql
-- Resultado: Tabelas e funções criadas ✅

-- 2. Popular com dados de teste
-- Arquivo: quick-seed.sql
-- Resultado: 8 produtos com padrões prontos ✅

-- 3. Verificar
SELECT * FROM v_patterns_summary;
SELECT * FROM get_shopping_suggestions('default-user', 2);
```

### Durante Desenvolvimento
```sql
-- Limpar e repopular (quando precisar resetar)
SELECT clear_all_data();
-- Depois execute quick-seed.sql novamente

-- Testar cenários específicos
-- Use: seed-data-scenarios.sql

-- Comandos rápidos durante debug
-- Use: useful-commands.sql
```

---

## 📊 Queries Mais Importantes

### Ver Padrões Calculados
```sql
SELECT * FROM v_patterns_summary;
```

### Ver Sugestões para Lista de Compras
```sql
-- Produtos que acabam em até 2 dias
SELECT * FROM get_shopping_suggestions('default-user', 2);
```

### Adicionar Compra
```sql
INSERT INTO purchases (product_name, quantity) 
VALUES ('Leite', 2);
```

### Adicionar Consumo
```sql
INSERT INTO consumption (product_name, quantity_consumed, remaining_quantity) 
VALUES ('Leite', 1, 1);
```

### Simular Passagem de Tempo
```sql
-- Fazer parecer que produto foi comprado há 7 dias
UPDATE purchases 
SET purchase_date = purchase_date - INTERVAL '7 days'
WHERE product_name = 'Leite';

-- Recalcular padrões
SELECT * FROM calculate_consumption_patterns();
```

### Limpar Tudo
```sql
SELECT clear_all_data();
```

---

## 🧪 Testando o Algoritmo

### Teste Básico: Leite comprado a cada 7 dias

```sql
-- Limpar
SELECT clear_all_data();

-- Compra 1 (21 dias atrás)
INSERT INTO purchases (product_name, quantity, purchase_date)
VALUES ('Leite', 2, CURRENT_DATE - INTERVAL '21 days');

-- Compra 2 (14 dias atrás)
INSERT INTO purchases (product_name, quantity, purchase_date)
VALUES ('Leite', 2, CURRENT_DATE - INTERVAL '14 days');

-- Compra 3 (7 dias atrás)
INSERT INTO purchases (product_name, quantity, purchase_date)
VALUES ('Leite', 2, CURRENT_DATE - INTERVAL '7 days');

-- Calcular padrão
SELECT * FROM calculate_consumption_patterns();

-- Ver resultado
SELECT * FROM v_patterns_summary WHERE product_name = 'Leite';
-- Resultado esperado: 
-- - Intervalo: 7 dias
-- - Próxima compra: HOJE (7 dias após a última)
-- - Dias restantes: 0 (urgente!)
```

---

## 🎯 Validações

### ✅ Tudo funcionando se:

1. **Schema criado:**
   ```sql
   SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name IN ('purchases', 'consumption', 'consumption_patterns');
   -- Resultado: 3
   ```

2. **Função calcula padrões:**
   ```sql
   SELECT * FROM calculate_consumption_patterns();
   -- Retorna tabela (vazia se não há dados, preenchida se há)
   ```

3. **Dados de teste carregados:**
   ```sql
   SELECT COUNT(*) FROM purchases;
   -- Resultado: > 0
   
   SELECT COUNT(*) FROM consumption_patterns;
   -- Resultado: > 0 (se executou quick-seed.sql)
   ```

4. **Sugestões funcionam:**
   ```sql
   SELECT * FROM get_shopping_suggestions('default-user', 7);
   -- Retorna produtos com dias_until_needed <= 7
   ```

---

## 🐛 Troubleshooting

### Erro: "function does not exist"
**Causa:** Schema não foi executado corretamente.
**Solução:** Execute `supabase-schema-v2.sql` novamente.

### Erro: "relation does not exist"
**Causa:** Tabelas não foram criadas.
**Solução:** Execute `supabase-schema-v2.sql` novamente.

### Padrões não aparecem
**Causa:** Produtos precisam de pelo menos 2 compras.
**Solução:** Execute `quick-seed.sql` ou adicione mais compras manualmente.

### Sugestões vazias
**Causa:** Nenhum produto está próximo de acabar.
**Solução:** 
```sql
-- Ver todos os produtos e quando acabam
SELECT * FROM v_patterns_summary;

-- Ou manipular data para simular urgência
UPDATE consumption_patterns
SET days_until_next_purchase = 1
WHERE product_name = 'Leite';
```

---

## 📚 Documentação Adicional

- **INICIO_RAPIDO.md** - Guia passo a passo para setup
- **CHECKLIST_SETUP.md** - Checklist interativo
- **GUIA_IMPLEMENTACAO_ML.md** - Documentação técnica completa

---

**Dúvidas?** Todos os scripts têm comentários explicativos! 🚀
