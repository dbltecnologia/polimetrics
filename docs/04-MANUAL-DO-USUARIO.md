# Manual Operacional — Polimetrics v2.0

> Este manual destina-se às equipes que operam a plataforma no dia a dia.  
> A interface foi construída **mobile-first** para líderes em campo e com densidade de informações em desktop para administradores.

---

## PARTE A — Manual do Administrador (Coordenador / Candidato)

O Administrador tem visão global do projeto e opera tudo em `/dashboard/admin`.

### 1. Dashboard Central
A tela inicial apresenta os KPIs de topo: **Cidades, Líderes, Apoiadores, Potencial de Votos e Demandas Abertas**. O gráfico lateral mostra engajamento/votos por bairro, revelando onde a força está concentrada e onde há buracos na rede.

### 2. Gestão de Líderes
Acesse **Líderes** no sidebar. Para cadastrar um novo articulador:
1. Clique em **Novo Líder**
2. Preencha: nome, cidade, bairro, telefone (com DDD), nível de influência e área de atuação
3. Salve — o sistema cria as credenciais e **envia automaticamente uma mensagem de boas-vindas pelo WhatsApp**

### 3. Gestão de Demandas (Chamados)
A seção **Chamados** é a ouvidoria do mandato. Agrupa demandas enviadas pelos líderes (via painel ou via WhatsApp pelo Secretário Virtual).
- Altere o status (Aberto → Em Andamento → Atendido) clicando na linha da demanda
- O líder recebe **notificação automática via WhatsApp** quando o status muda

### 4. Minivotações
1. Acesse **Votações** → **Nova Votação**
2. Escreva o título e adicione as opções
3. Clique em **Disparar via WhatsApp** para enviar a pesquisa para o grupo desejado
4. Líderes recebem a enquete no WhatsApp e respondem com um número
5. Resultados aparecem em tempo real. Use **Encerrar** para congelar os votos

### 5. Centro de Comando IA (`/admin/ai`)
- **Pesquisas:** Selecione uma votação e um grupo de usuários → dispara pesquisa em massa
- **Alinhamento:** Gera mensagem política via IA → envia para líderes selecionados
- **Missões:** Lança um desafio de gamificação (ex: "recrute 5 apoiadores") → líderes recebem pelo WhatsApp, ganham pontos ao concluir
- **Base de Conhecimento:** Cadastre snippets sobre o projeto (propostas, biografia, FAQ) para que o Secretário Virtual use em suas respostas

### 6. Geração de Conteúdo (`/admin/content`)
1. Clique em **Novo Conteúdo** → Wizard é aberto
2. Descreva o tema da campanha
3. O sistema gera texto (Gemini/GPT), imagem (DALL-E) e áudio (ElevenLabs)
4. Salve o kit gerado → disponível para consulta e distribuição posterior

### 7. Mapa Político
Visualize a cobertura territorial. Pinos representam líderes geocodificados. Clique em um pino para ver: nome, bairro, influência e número de apoiadores. Identifique bairros sem cobertura para orientar novos recrutamentos.

### 8. Histórico Eleitoral
Insira dados de eleições passadas para gerar gráficos históricos comparativos. Use-o para justificar metas de crescimento e identificar regiões com maior potencial de virada.

---

## PARTE B — Manual do Líder (Cabo Eleitoral)

O Líder acessa o sistema com as credenciais geradas pelo admin pelo link do sistema (URL de produção).

### 1. Dashboard Inicial
Exibe métricas rápidas: membros na rede, chamados abertos e atividades recentes. Atalhos grandes para todas as áreas (mobile-first).

### 2. Cadastrar Apoiadores
Na rua, ao fechar apoio com um cidadão:
1. Acesse **Minha Rede** → **Novo Apoiador**
2. Preencha nome, telefone e bairro
3. O apoiador é vinculado automaticamente ao líder e aparece no dashboard do admin

### 3. Registrar Demandas
Acesse **Chamados** → **Nova Demanda**. Descreva o problema ou proposta do bairro. O coordenador receberá e atualizará o status. Você será notificado pelo WhatsApp quando houver novidades.

### 4. Secretário Virtual (WhatsApp)
O número de WhatsApp do projeto está disponível para qualquer líder. O Secretário responde automaticamente:
- Dúvidas sobre propostas e o projeto
- Registra demandas mencionadas
- Participa de pesquisas enviadas pelo admin
- Aceita missões de gamificação e registra conclusão

### 5. Perfil
Acesse **Perfil** e mantenha suas coordenadas geográficas atualizadas — isso garante que você apareça corretamente no Mapa Político.

---

## PARTE C — Secretário Virtual IA (Referência Rápida)

| Situação | O que o Secretário faz |
|---|---|
| Número nunca cadastrado | Cria lead + pergunta bairro e área |
| Usuário pergunta sobre o projeto | Responde com base de conhecimento + Gemini |
| Usuário menciona problema | Cria chamado automaticamente + confirma |
| Admin dispara pesquisa | Líder recebe pergunta + responde com número |
| Admin dispara missão | Líder recebe desafio + aceita/recusa + envia prova |
| Status de chamado muda | Líder recebe notificação automática |

> **Número de WhatsApp:** Configurado no Chatwoot (perguntar ao administrador técnico)
