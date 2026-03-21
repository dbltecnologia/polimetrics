# Integrações e Automação

O Agenticx.ia CRM é uma plataforma aberta que se conecta com as melhores ferramentas de comunicação e infraestrutura de nuvem.

## 🟢 Evolution API (WhatsApp)

A principal interface de comunicação externa é a **Evolution API**, que permite a conexão de números de WhatsApp para envio de mensagens automáticas.

### Configurações de Conexão
- **Base URL:** `https://evolutionapi.dbltecnologia.com.br`
- **Fluxo de Trabalho:**
    1. O sistema cria uma instância via servidor (`POST /instance/create`).
    2. O usuário escaneia o QR Code no dashboard do CRM.
    3. O CRM armazena a `instanceName` no Firestore para uso futuro em campanhas.

### Campanhas e Prospecção
O **Campaign Worker** do CRM é o responsável por orquestrar os disparos:
- Ele lê os planos de abordagem aprovados.
- Envia comandos para a Evolution API.
- **Humanização:** Implementamos um delay randômico (5-10 min) entre mensagens para evitar bloqueios de número.

---

## 🔥 Infraestrutura Firebase

O CRM utiliza o Firebase como backend robusto e escalável.

- **Firestore:** Banco de dados NoSQL para leads, históricos, configurações de funil e instâncias de API.
- **Auth:** Gerenciamento de usuários e controle de acesso (RBAC).
- **App Hosting:** Hospedagem da aplicação Next.js com deploy automático via GitHub.

---

## 🛠️ Webhooks (Em breve)
Estamos implementando webhooks para que eventos externos (ex: formulário de site) possam criar leads automaticamente sem a necessidade de polling.

> [!IMPORTANT]
> A comunicação com a Evolution API é feita exclusivamente via **Server Actions** no Next.js para segurança das chaves de acesso.
