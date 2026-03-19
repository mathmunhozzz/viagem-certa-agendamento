

## Plano: Fortalecer Segurança contra Injeção de Sessão via Console

### Problema
Atualmente, o sistema usa `localStorage` para persistir tokens de sessão do Supabase. Um atacante pode injetar tokens JWT no localStorage via console do navegador e ganhar acesso ao sistema.

### Realidade Importante
Com Supabase (e qualquer sistema JWT client-side), é impossível impedir 100% a injeção de tokens **válidos** no client. Porém, podemos adicionar camadas de proteção:

### Mudanças Propostas

#### 1. Validar sessão no servidor a cada carregamento (useAuth.tsx)
- Após `getSession()`, chamar `supabase.auth.getUser()` que faz uma requisição ao servidor Supabase para validar o token (não confia apenas no JWT local)
- Se `getUser()` falhar, fazer logout automático e limpar localStorage
- Isso impede tokens expirados, revogados ou fabricados de funcionar

#### 2. Verificar account_status no servidor (useAccountStatus.tsx)
- Já existe e já consulta o banco — isso é bom
- Garantir que mesmo com token injetado, o RLS bloqueia acesso (já está configurado nas tabelas)

#### 3. Adicionar validação periódica da sessão (useAuth.tsx)
- A cada X minutos, re-validar com `getUser()` no servidor
- Se o token for inválido/revogado, fazer logout automático

#### 4. Usar `signOut({ scope: 'global' })` no logout
- Revogar todas as sessões do usuário no servidor, não apenas a local

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useAuth.tsx` | Adicionar validação server-side com `getUser()`, re-validação periódica, logout global |

### Detalhes Técnicos

```typescript
// Em useAuth.tsx - validação server-side
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session) {
        // Validar token no servidor (não confiar só no JWT local)
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          // Token inválido/fabricado - forçar logout
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(user);
      }
      setSession(session);
      if (!session) setUser(null);
      setLoading(false);
    }
  );

  // Validação inicial
  supabase.auth.getUser().then(({ data: { user }, error }) => {
    if (error || !user) {
      supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } else {
      setUser(user);
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
    }
    setLoading(false);
  });

  // Re-validação periódica (a cada 5 minutos)
  const interval = setInterval(async () => {
    const { error } = await supabase.auth.getUser();
    if (error) {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    }
  }, 5 * 60 * 1000);

  return () => {
    subscription.unsubscribe();
    clearInterval(interval);
  };
}, []);

// Logout global
const signOut = async () => {
  await supabase.auth.signOut({ scope: 'global' });
};
```

### O que isso protege
- Tokens fabricados/inválidos injetados via console são rejeitados pelo servidor
- Tokens revogados (ex: após logout) param de funcionar em até 5 minutos
- O RLS no banco já protege os dados mesmo se o token for válido mas o usuário não tiver permissão

