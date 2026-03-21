# Documentação Oficial Agenticx.ia - CRM

Bem-vindo ao repositório de conhecimento do CRM Agenticx.ia. Esta base de documentos foi construída não só para os desenvolvedores parceiros da plataforma garantirem uma operação livre de bugs e alta captação de Leads, como também para os revendedores, marketing e equipes de atendimento explorarem todo o potencial do nosso fluxo Server-to-Server e Next.js.

## Estrutura da Documentação

A documentação está dividida em três pilares fundamentais, estruturados para atender desde times técnicos aos times de operação comercial.

### 1. ⚙️ Manuais Técnicos e de Integração
Localizados em `/docs/technical/`:
- **[Chatwoot Omnichannel](./technical/chatwoot-integration.md)**: Todas as arquiteturas limpas para criar instâncias automáticas usando Chatwoot e o Baileys Fazer-AI Nativo. Explica nossa blindagem de Race Conditions, a liberação de telefones órfãos e o mapeamento das portas (3002).
- **[Z-API Hub de Vendas](./technical/zapi-integration.md)**: Como plugar as chaves Cloud da Z-API para clientes "Heavy-users" que focam em disparam campanhas de massa através do worker de Background sem usar interfaces Web.

### 2. 🚀 Vendas, Objeções e Playbooks Onboarding
Localizados em `/docs/sales/`:
- **[Seller Playbook & Pitch Deck](./sales/seller-playbook.md)**: Scripts para convencer o Lojista/B2B de que ter as rédeas invisíveis via IA em conversas de WhatsApp é o futuro.
- **[Tratamento de Objeções](./sales/objection-handling.md)**: Respostas táticas para o clássico "Minha atual ferramenta de disparo já funciona" ou "É muito caro".

### 3. 📈 Marketing e Materiais Estratégicos
Localizados em `/docs/marketing/`:
- **[Casos de Uso e Funis Globais](./marketing/use-cases.md)**: Demonstrações de sucesso usando a Agentia para capturar leads através de Landing pages e nutri-los automaticamente no "Funil Invisível" do WhatsApp.

---

> **Nota Adicional de Versão (V2):** Todo o trágico "Servidor Terceiro de Evolution API" foi banido desta stack V2. Todo o poderio reside agora num Frontend React/Next.js consumindo Firebase Server Actions limpas, enviando Tasks assíncronas limpas, conversando com o Chatwoot limpo. Em caso de dúvidas estruturais, visite o arquivo de integração técnica do Chatwoot.
