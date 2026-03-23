

## Plano: Corrigir Bug de Carregamento Infinito no Login

### Problema Identificado
O `useAuth.tsx` chama `supabase.auth.getUser()` **dentro** do callback `onAuthStateChange`. A documentação do Supabase alerta que chamadas async ao Supabase dentro desse callback podem causar **deadlocks** -- o callback fica esperando a resposta do servidor, mas o Supabase client está travado esperando o callback terminar. Isso causa o "carregando infinito".

Além disso, quando `getUser()` falha dentro do callback, ele chama `signOut()`, que dispara outro `onAuthStateChange`, criando um possível loop infinito.

### Solução

#### Modificar `src/hooks/useAuth.tsx`

1. **No `onAuthStateChange`**: Usar apenas os dados que já vêm no callback (session/user) para atualizar o state imediatamente, SEM fazer chamadas async ao Supabase. Isso elimina o deadlock.

2. **Validação server-side separada**: Fazer a validação com `getUser()` fora do callback, como uma operação independente que roda após o state ser atualizado.

3. **Timeout de segurança**: Adicionar um timeout de 10 segundos para garantir que `loading` nunca fique `true` infinitamente.

4. **Manter re-validação periódica**: Continuar com a verificação a cada 5 minutos, mas de forma que não cause loops.

### Lógica Corrigida (resumo)

```text
onAuthStateChange:
  → Se tem session: setUser(session.user), setSession(session)
  → Se não tem: setUser(null), setSession(null)
  → setLoading(false)
  → (Depois, em background, validar com getUser() sem bloquear)

Inicialização:
  → getSession() para estado inicial (rápido, local)
  → Depois getUser() para validar no servidor
  → Timeout de 10s como fallback
```

### Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useAuth.tsx` | Remover `getUser()` de dentro do `onAuthStateChange`, usar session diretamente, adicionar timeout de segurança |

