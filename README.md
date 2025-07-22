
# Viagens Opportunity

Sistema completo de agendamento e gerenciamento de viagens corporativas desenvolvido em React com TypeScript.

## 🚀 Sobre o Projeto

O **Viagens Opportunity** é uma aplicação web moderna e intuitiva para gestão completa de viagens corporativas. O sistema permite controle total sobre agendamentos, funcionários, veículos, setores e relatórios de viagem.

### ✨ Funcionalidades Principais

- **Gestão de Viagens**: Agendamento, edição e controle completo de viagens
- **Calendário Interativo**: Visualização clara de todas as viagens agendadas
- **Controle de Funcionários**: Cadastro e gerenciamento de colaboradores
- **Gestão de Veículos**: Controle de frota e disponibilidade
- **Setores Organizacionais**: Organização por departamentos
- **Relatórios Avançados**: Estatísticas e relatórios detalhados
- **Sistema de Aprovação**: Workflow de aprovação para viagens
- **Controle de Usuários**: Gestão de perfis e permissões (Admin, Manager, User)
- **Interface Responsiva**: Funciona perfeitamente em desktop e mobile

### 🏗️ Arquitetura do Sistema

**Frontend:**
- React 18 com TypeScript
- Vite para build ultra-rápido
- Tailwind CSS para estilização
- shadcn/ui para componentes
- React Hook Form para formulários
- React Query para gerenciamento de estado
- React Router para navegação

**Backend:**
- Supabase (PostgreSQL)
- Autenticação integrada
- Row Level Security (RLS)
- API REST automática

**Recursos Avançados:**
- Temas claro/escuro
- Componentes reutilizáveis
- Validação de formulários
- Notificações toast
- Estados de loading
- Tratamento de erros

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta no Supabase (para banco de dados)

### Passo a Passo

1. **Clone o repositório:**
```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd viagens-opportunity
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
Crie um arquivo `.env.local` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. **Execute as migrações do banco:**
Configure seu projeto Supabase e execute as migrações SQL disponíveis na pasta `supabase/migrations/`

5. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

6. **Acesse a aplicação:**
Abra [http://localhost:8080](http://localhost:8080) no seu navegador

## 📱 Como Usar

### Primeiro Acesso

1. **Cadastre-se** na tela de login
2. Sua conta ficará **pendente de aprovação**
3. Um administrador deve aprovar sua conta
4. Após aprovação, você pode fazer login normalmente

### Perfis de Usuário

- **User**: Pode visualizar viagens e criar solicitações
- **Manager**: Pode gerenciar viagens do seu setor
- **Admin**: Acesso completo ao sistema

### Funcionalidades por Seção

**Dashboard:**
- Visão geral das viagens
- Estatísticas importantes
- Viagens pendentes

**Viagens:**
- Lista todas as viagens
- Filtros avançados
- Criação e edição

**Calendário:**
- Visualização mensal
- Navegação intuitiva
- Detalhes rápidos

**Relatórios:**
- Gráficos interativos
- Exportação de dados
- Análises estatísticas

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn/ui)
│   └── ...             # Componentes específicos
├── hooks/              # Custom hooks
├── integrations/       # Integrações (Supabase)
├── lib/               # Utilitários
├── pages/             # Páginas principais
└── ...
```

### Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificação de código
```

### Tecnologias Utilizadas

- **React 18**: Biblioteca principal
- **TypeScript**: Tipagem estática
- **Vite**: Build tool moderno
- **Tailwind CSS**: Framework CSS
- **shadcn/ui**: Componentes UI
- **Supabase**: Backend as a Service
- **React Query**: Gerenciamento de estado servidor
- **React Hook Form**: Gerenciamento de formulários
- **Zod**: Validação de esquemas
- **Lucide React**: Ícones
- **Recharts**: Gráficos e relatórios

## 🎨 Design System

O projeto utiliza um design system consistente baseado em:
- **Cores**: Paleta harmoniosa com suporte a tema claro/escuro
- **Tipografia**: Sistema de fontes escalável
- **Componentes**: Biblioteca reutilizável e consistente
- **Espaçamento**: Grid system baseado em Tailwind
- **Animações**: Transições suaves e naturais

## 🔧 Configuração Avançada

### Banco de Dados

O sistema utiliza PostgreSQL via Supabase com:
- **Row Level Security (RLS)** para segurança
- **Triggers** para automações
- **Views** para consultas otimizadas
- **Índices** para performance

### Autenticação

- Sistema completo de auth via Supabase
- Controle de perfis e permissões
- Recuperação de senha
- Validação de email

## 📈 Performance

- **Lazy Loading** de componentes
- **Code Splitting** automático
- **Otimização de imagens**
- **Caching inteligente**
- **Bundle size otimizado**

## 🔒 Segurança

- **Row Level Security** no banco
- **Validação client e server-side**
- **Sanitização de dados**
- **Headers de segurança**
- **HTTPS obrigatório**

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte ou dúvidas:
- Abra uma issue no repositório
- Entre em contato via email
- Consulte a documentação

---

**Desenvolvido com ❤️ para gestão eficiente de viagens corporativas**
