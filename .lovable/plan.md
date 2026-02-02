

## Plano: Adicionar Nome do Usuário e Sistema na Lista de Backups

### Problema Identificado
Atualmente a lista de solicitações de backup mostra apenas:
- Nome da cidade
- Motivo
- Status

Falta mostrar:
1. **Nome do usuário** que solicitou
2. **Sistema** que ele precisa do backup

### Solução

#### 1. Adicionar Coluna "system_name" na Tabela
Criar uma migração para adicionar o campo `system_name` na tabela `backup_requests`:

```sql
ALTER TABLE backup_requests 
ADD COLUMN system_name text;
```

#### 2. Atualizar BackupRequestForm.tsx
Adicionar um novo campo de input para o usuário informar o sistema:
- Campo: "Sistema" (input de texto)
- Placeholder: "Ex: Sistema de Vendas, ERP, etc."
- Será enviado junto com a solicitação

#### 3. Atualizar BackupRequestList.tsx
Modificar a query para fazer join com a tabela `profiles` e buscar o nome do usuário:

```typescript
const { data, error } = await supabase
  .from('backup_requests')
  .select(`
    *,
    profiles:user_id (name)
  `)
  .order('created_at', { ascending: false });
```

Exibir na interface:
- **Solicitante:** Nome do usuário (do join com profiles)
- **Sistema:** Nome do sistema solicitado
- Cidade, motivo, status (já existem)

#### 4. Atualizar BackupRequestResponseDialog.tsx
Mostrar também o sistema e o nome do solicitante no dialog de resposta do admin.

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Nova migração SQL | Adicionar coluna `system_name` |
| `src/components/BackupRequestForm.tsx` | Adicionar campo "Sistema" |
| `src/components/BackupRequestList.tsx` | Join com profiles + exibir nome e sistema |
| `src/components/BackupRequestResponseDialog.tsx` | Mostrar sistema e solicitante |

---

### Resultado Visual Esperado

Para o admin, cada solicitação mostrará:
```
┌─────────────────────────────────────────────────────┐
│ 📍 Cidade: São Paulo                    [Pendente]  │
│ 💻 Sistema: ERP Financeiro                          │
│ 👤 Solicitante: João Silva                          │
│ 📅 Solicitado em 02 de Fevereiro de 2026 às 10:30  │
│                                                     │
│ Motivo:                                             │
│ Preciso dos dados de vendas de Janeiro...           │
│                                         [Responder] │
└─────────────────────────────────────────────────────┘
```

