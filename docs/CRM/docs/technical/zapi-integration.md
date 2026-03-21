# Integração Z-API (Solução Profissional em Nuvem)

O CRM Agenticx.ia suporta ativamente o ecossistema Z-API (`https://www.z-api.io/`) como o provedor oficial escalável para clientes que necessitam de estabilidade extrema no WhatsApp para Envios em Massa (Campanhas) sem as complexidades de manter contêineres e motores localmente.

## Configuração Simples (Modo Manual/Avançado)
A conexão com o Z-API no portal Configurações > Instâncias se constrói exigindo três parâmetros triviais disponíveis no Console Sandbox do serviço Z-API:
- **Instance ID:** `(3B........B9)`
- **Instance Token:** `(6.........A)`
- **Client Token:** `(F.........J)`

A plataforma não precisa gerar um QR Code interno dentro do CRM. O usuário autentica no painel Cloud da Z-API e traz os tokens. A nossa plataforma, então, usa esses identificadores seguros enviando e engatilhando de forma transparente.

## Fluxo de Envio e Fallbacks Seguros
A máquina `ZApiProvider` (`src/lib/messaging/zapi-provider.ts`) do CRM foi projetada para lidar com a natureza do envio profissional (S2S):
1. Quando uma campanha rodar via *Worker de Automação*, o ID da instância é transformado no roteamento dinâmico Z-API: `https://api.z-api.io/instances/{instanceId}/token/{token}/send-messages`.
2. Diferente do Chatwoot, o Z-API não obriga a criação prévia de "Inboxes" ou "Conversas" com o contato! O provider do CRM engatilha o `POST /send-text` instantaneamente para telefones (Mesmo que não catalogados) passando o paramêtro `{ "phone": "55000000000", "message": "Texto" }`.
3.  Header Exclusivo: O Request requer `Client-Token` injectado via Headers para atestar liberação entre instâncias da mesma conta: `client-token: {clientToken}`.
4.  Retorno 200: O CRM loga na atividade imediato sem depender de Webhooks secundários de confirmação, facilitando funis rápidos de grande volume.

## Por que oferecemos Z-API junto ao Chatwoot?
- Chatwoot é o "Hub Humano": Serve maravilhosamente para Omnichannel, relatórios e controle de times na aba Inboxes.
- Z-API é a "Arma de Vendas": Desenvolvida para marketing pesado. Os pacotes mensais deles blindam conexões persistentes no WhatsApp sem risco de Quedas Silenciosas que motores de código aberto como Baileys as vezes sofrem. Um contêiner em nuvem puramente feito para aguentar rajadas sem perder a sessão.
