# Integração Chatwoot + Baileys (Fazer-AI) - Documentação Oficial

Esta documentação consolida o conhecimento arquitetônico sobre a integração do CRM "Agenticx.ia" com o Chatwoot e sua engine do WhatsApp (Baileys), garantindo conexões estáveis, criação de campanhas automatizadas e fluxos imunes ao "Erro 401" e "Race Conditions" na API.

## 1. Topologia da Rede e API Oficial

O CRM utiliza o Fazer-AI Chatwoot como *Hub* de comunicação. Diferente de implementações antigas (como Evolution API externa), o motor do WhatsApp (Baileys) roda nativamente *dentro* da stack do Chatwoot.

- **URL Base:** `https://app.chatwoot.com` (Exemplo) ou a configurada no CRM (`http://chatai.sajur.com.br`).
- **Portas de Serviço:**
  - `3002`: API Ruby/Gateway Oficial do Chatwoot. **ESTA É A PORTA CORRETA PARA O BACKEND.**
  - `3026`: Porta interna do nó Baileys. **(Ignorar)** Essa porta é bloqueada por Firewalls do Google Cloud (GCP) publicamente. A API `3002` fará a comunicação paralela para a `3026` com segurança.
  - `443/80 (HTTPS)`: Frontend / Proxym NGINX do Chatwoot. Se o disparo das campanhas (S2S) tentar rodar nessa porta *sem cookies* de sessão web, o NGINX redirecionará para a página de Login via Devise, resultando no famigerado Erro HTTP `401 - Você precisa entrar ou se cadastrar`. Para Server-to-Server, utilize sempre a porta `:3002`.

## 2. Automação de Provisionamento (O Ciclo Start)

Quando um usuário clica no **Modo Automático** para conectar o WhatsApp, o seguinte fluxo acontece silencioso no backend:

1. O CRM usa o Token Master de Super-Admin para forjar um novo `Inbox` (Caixa de Entrada) do tipo `Channel::Whatsapp` dentro do Chatwoot centralizado com o número fornecido. Ao criar essa caixa, a Inbox apenas "nasce" inerte, sem sessão Ativa e sem ligar o pareamento.
2. É despachado um Webhook oficial do CRM para o Chatwoot:
   `POST /api/v1/accounts/1/inboxes/{inboxId}/setup_channel_provider`
   Este gatilho desperta a thread dorminhoca do Baileys e muda o estado da conexão para `connecting`, iniciando o Boot da engine.

## 3. Resolvendo Condição de Corrida de QR Code (Race Condition)

O motor do Baileys leva cerca de **15 a 20 segundos pensando** (no status `connecting`) antes de finalmente cuspir a imagem em `Base64` do QR Code na API de consulta do Chatwoot (`GET /inboxes/{id}`).
 
**Regra de Ouro Implementada:**
Se o frontend fizer Polling rápido demais (ex: a cada 1.5s) para colher a imagem e perceber que ela está nula, não podemos mandar reiniciar ou forçar novamente o gatilho de `setup_channel_provider`. 
Forçar a recarga do provedor infinitamente durante o estado `connecting` causará a Morte Súbita da thread do Baileys (State: `"close"`), travando o aplicativo em um loop de timeout. A rotina do CRM atual está instruída a aguardar passivamente enquanto o provider Connection reportar _"connecting"_.

## 4. Nuvem e Server Actions (AppHosting Next.js)

Se a nuvem estiver devolvendo `Loading Infinito` nas telas ou vomitando erros `500 - Only plain objects can be passed to Client Components`, isso ocorre devido ao vazamento da Classe/Date do Firestore.
Classes `FieldValue: serverTimestamp()` oriundas do Firebase precisam de `createdAt: novaData.toISOString()` antes de retornarem das *Server Actions* pro Fronte para passarem pela validação rigorosa de hidratação do Next.js AppHosting. Isto está sanado!

## 5. Exclusão e Tratativa de Reféns (Erro 422 - Telefone já está em uso)

A plataforma do Chatwoot **proíbe a criação de múltiplos Inboxes usando o mesmo `phone_number`**.

Se um usuário deletar uma conexão corrompida apenas no MongoDB/Firestore, o telefone continuará refém e "preso" lá na API do Chatwoot em formato *Órfão*. Quando o cliente for recadastrar e bater, verá um erro cego (`422 Unprocessable Entity - has already been taken`).

*A Blindagem do CRM:*
A função "Deletar Instância" da lixeira do CRM agora viaja em Backgound (Server) e despacha fisicamente um `HTTP DELETE /api/inboxes/{inboxId}` para o núcleo Admin do Chatwoot utilizando as credencias Mestre (`CHATWOOT_ADMIN_TOKEN`), destruindo as amarras e libertando o número do usuário na hora. E caso haja lixo antigo inalcançável, o CRM detecta o `422` e solta um Toast de Acessibilidade compreensível exigindo exclusões sistêmicas amigáveis.
