# Tickets OPP - Sistema de Gerenciamento de Tickets

Este é um aplicativo separado do sistema "Viagem Certa" que utiliza o mesmo banco de dados Supabase para gerenciar tickets de suporte.

## 🚀 Funcionalidades

- **Autenticação**: Login e cadastro de usuários
- **Board de Tickets**: Visualização estilo Kanban com 4 colunas (Pendente, Em Análise, Corrigido, Negado)
- **Criação de Tickets**: Formulário completo com título, descrição, prioridade, tags e data de vencimento
- **Detalhes do Ticket**: Visualização detalhada com comentários e edição (para usuários autorizados)
- **Sistema de Comentários**: Comentários em tempo real nos tickets
- **Controle de Acesso**: Baseado em roles (admin, manager, user) compartilhadas com o sistema principal
- **Status de Conta**: Tela de aprovação pendente para novos usuários

## 🛠️ Tecnologias

- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Radix UI** para componentes base
- **Supabase** para backend (mesmo banco do "Viagem Certa")
- **React Query** para gerenciamento de estado
- **React Router** para navegação

## 📦 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse http://localhost:5173

## 🌐 Deploy

Para fazer o deploy, execute:
```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`.

## 🔧 Configuração do Supabase

O app já está configurado para usar o mesmo projeto Supabase do "Viagem Certa":
- URL: `https://ninybkgnipuxmvcaxkwt.supabase.co`
- Anon Key: Configurada no código

### Configuração de URLs de Redirecionamento

No painel do Supabase (Authentication > URL Configuration), adicione:
- **Site URL**: URL do seu app em produção
- **Redirect URLs**: 
  - URL de desenvolvimento (ex: http://localhost:5173)
  - URL de produção

## 👥 Sistema de Usuários

- **Usuários compartilhados**: Mesma base de usuários do "Viagem Certa"
- **Roles compartilhadas**: admin, manager, user
- **Aprovação de conta**: Novos usuários precisam ser aprovados por um admin
- **Login separado**: Por estar em domínio diferente, é necessário fazer login novamente

## 🎯 Funcionalidades por Role

### User (Usuário Comum)
- Criar tickets próprios
- Visualizar tickets próprios
- Comentar em tickets próprios
- Editar tickets próprios (apenas status pendente)

### Manager (Gerente)
- Todas as funcionalidades de User
- Visualizar todos os tickets
- Comentar em qualquer ticket
- Atribuir tickets a funcionários
- Alterar status e prioridade

### Admin (Administrador)
- Todas as funcionalidades de Manager
- Aprovar contas de usuários
- Gerenciar todos os aspectos do sistema

## 🔒 Segurança

- **RLS (Row Level Security)** ativo em todas as tabelas
- **Políticas de acesso** baseadas em roles
- **Validação de permissões** em frontend e backend
- **Autenticação obrigatória** para todas as funcionalidades

## 📱 Responsividade

O aplicativo é totalmente responsivo e funciona bem em:
- Desktop
- Tablet
- Mobile

## 🐛 Desenvolvimento

Para desenvolvimento local:
1. Clone o repositório
2. Instale as dependências com `npm install`
3. Execute `npm run dev`
4. Acesse http://localhost:5173

## 📞 Suporte

Este sistema utiliza o mesmo banco de dados do "Viagem Certa", então:
- Usuários são compartilhados
- Setores e funcionários são os mesmos
- Roles e permissões são compartilhadas

Para questões de configuração do Supabase, consulte a documentação do projeto principal.