# Credenciais de Teste — PoliMetrics
# Arquivo para uso em testes automatizados e subagentes QA
# ⚠️  NÃO COMMITAR com credenciais de produção reais

## Ambiente de Teste: http://localhost:9003

### 👑 Conta ADMIN (acesso a /dashboard/admin)
EMAIL=admin@polimetrics.com.br
PASSWORD=password123
ROLE=admin
EXPECTED_REDIRECT=/dashboard/admin

### 🧭 Conta LÍDER (acesso a /dashboard)
EMAIL=lider@polimetrics.com.br
PASSWORD=password123
ROLE=leader
EXPECTED_REDIRECT=/welcome  # (depois do onboarding vai para /dashboard)

### 🔒 Conta PENDENTE (deve ir para /pending)
EMAIL=pendente@polimetrics.com.br
PASSWORD=pendente123
ROLE=pending
EXPECTED_REDIRECT=/pending

---
## Notas para Subagentes

- O campo "Estado de Atuação" FOI REMOVIDO do formulário de login
- O login agora tem apenas: Email + Senha
- Após o login, o admin pode filtrar por estado no Header do dashboard
- O padrão é "Brasil (Todos)" — mostra dados de todos os estados

## Como usar no browser subagent

1. Acesse http://localhost:9003/login
2. Clique no campo Email → digite EMAIL acima
3. Clique no campo Senha → digite PASSWORD acima
4. Clique em "Acessar"
5. Aguarde redirecionamento para EXPECTED_REDIRECT
