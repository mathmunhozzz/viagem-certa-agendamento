## Diagnóstico

Verifiquei o sistema. Aqui está a situação atual:

### O que JÁ funciona
- **Criar funcionário** (Aba "👤 Funcionários"): admin e gerente conseguem criar via `EmployeeForm`. ✅
- **Vincular funcionário a usuário**: cada linha da lista de funcionários tem um botão que abre o `EmployeeLinkDialog`. ✅
- **Gerenciar usuários existentes** (Aba "👤 Usuários" + botão "Usuários" no header): admin pode aprovar/rejeitar contas, mudar papel (user/manager/admin) e redefinir senha. ✅

### O que NÃO existe (origem da sua dúvida)
- **Não há botão "Criar Usuário"** em lugar nenhum. Hoje, novos usuários só entram no sistema **se eles mesmos se cadastrarem em `/auth`** e depois o admin aprova. Não existe um fluxo "admin cria o usuário direto com email/senha".
- **Gerente não vê a aba/botão "Usuários"**: por código, é admin-only (`hasRole('admin')`). Por isso você não acha nada logado como gerente.

## Plano

### 1. Criar Edge Function `admin-create-user`
- Recebe `{ email, password, name, role, accountStatus }`.
- Valida que quem chama é admin (via JWT + `has_role`).
- Usa `supabase.auth.admin.createUser` (service role) para criar o usuário já com email confirmado.
- O trigger `handle_new_user` já cria o profile automaticamente.
- Depois insere o `role` desejado em `user_roles` e atualiza `account_status` em `profiles` (por padrão já cria `approved` para não precisar aprovar de novo).

### 2. Botão "➕ Novo Usuário" em `UserManagement`
- No topo da página de Gerenciamento de Usuários, adicionar botão que abre um Dialog com formulário:
  - Nome, Email, Senha, Papel (user/gerente/admin), Status inicial (aprovado por padrão).
- Ao confirmar, chama a edge function acima e recarrega a lista.

### 3. Acesso para Gerente (opcional — confirme abaixo)
Hoje só admin vê "Usuários". Posso:
- **Opção A**: manter admin-only (mais seguro).
- **Opção B**: deixar gerente também ver a aba, mas **sem** poder promover ninguém a admin nem criar admins.

### 4. Pequena melhoria de UX nos Funcionários
- Adicionar um destaque/aviso visual no `EmployeeList` quando o funcionário ainda não está vinculado a um usuário (já existe o botão, mas vou deixar mais óbvio com um badge "Sem login" e tooltip).

### Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/admin-create-user/index.ts` | **Novo**: cria usuário via service role, valida admin |
| `supabase/config.toml` | Registrar a função (verify_jwt = true) |
| `src/components/UserManagement.tsx` | Botão + Dialog "Novo Usuário" |
| `src/components/EmployeeList.tsx` | Badge "Sem login" para não vinculados |
| `src/pages/Index.tsx` / `Header.tsx` | (Se opção B) liberar aba Usuários para gerente |

### Pergunta antes de implementar
Quer que **gerente** também possa criar/gerenciar usuários, ou mantenho **apenas admin** com essa permissão?