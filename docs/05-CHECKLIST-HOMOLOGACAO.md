# Checklist de Homologação Final - PoliMetrics

Este documento detalha os testes de homologação exigidos para assegurar a prontidão final do sistema PoliMetrics antes do seu lançamento em produção. Os itens estão organizados por funcionalidades-chave (os 6 Pilares) e níveis de acesso (Admin e Líder).

## 1. Autenticação e Gestão de Sessões
- [ ] **Login do Coordenador (Admin):** Validar acesso ao painel através da rota `/dashboard/admin`.
- [ ] **Login do Cabo Eleitoral (Líder):** Validar acesso ao painel do Líder através da rota `/dashboard`.
- [ ] **Proteção de Rotas:** Tentar acessar as rotas de Admin com o perfil de Líder ou sem estar autenticado. O sistema deve redirecionar forçosamente para o login.
- [ ] **MFA (Multiple Factor Authentication):** Se configurado (via Firebase), testar o envio e exigência de código de segurança no acesso.

## 2. Cadastro de Lideranças e Apoiadores
- [ ] **Criação de Líderes pelo Admin:** O Admin deve conseguir preencher e salvar o formulário com Nome, Cidade, Tipo de Líder (Master/Sub), Nível de Influência e CPF.
- [ ] **Geração de Credenciais:** Confirmar se uma senha inicial é gerada ao finalizar o cadastro de um Líder no painel Admin.
- [ ] **Criação de Apoiadores via Líder (Mobile):** O Leader Dashboard deve permitir o lançamento de novos cidadãos/apoiadores na rua, vinculando-os automaticamente ao bairro e ao próprio líder em campo.
- [ ] **Incremento no Potencial de Votos:** Verificar se o KPI de "Potencial de Votos" e o banco de "Membros" deste Líder sobem no Dashboard Central do Admin imediatamente após o cadastro do novo apoiador.

## 3. Inteligência Geográfica (Mapa Interativo)
- [ ] **Renderização de Pins (Leaflet):** O Mapa deve carregar os marcadores de acordo com as coordenadas geográficas cadastradas nos perfis dos Líderes.
- [ ] **Dados no Modal de Geolocalização:** Ao clicar em um pino no mapa, um modal/pop-up interativo deve apresentar os dados do Líder local e seu volume de influência.
- [ ] **Desempenho Visual e Zoom:** Conferir se ao renderizar zonas/cidades espalhadas e múltiplos pins o mapa não apresenta lentidão ou bloqueio.

## 4. Gabinete Virtual (Comunicação e Ticket/Chamados)
- [ ] **Abertura de Propostas:** O líder, com sua conta, deve submeter um pedido de melhoria ou relatório acessando a aba "Propostas" / "Nova Proposta".
- [ ] **Recebimento de Demandas:** O Admin deve receber no painel lateral "Demandas (Chamados)" o novo ticket do líder.
- [ ] **Tramitação de Status:** O fluxo de atendimento (Aberto -> Em Andamento -> Concluído) precisa ser alterável pelo Admin.
- [ ] **Feedbacks ao Líder:** Ao ter seu ticket respondido, o líder logado deve conseguir visualizar o retorno da coordenação no portal e o ticket como arquivado/concluído.

## 5. Minivotações (Engajamento Colaborativo)
- [ ] **Criação da Enquete Relâmpago (Admin):** Garantir a publicação de uma nova pauta gerando o Título e N múltiplas Opções.
- [ ] **Disparos Mobile-First (Líderes):** Confirmar a aparição automática da enquete no portal de todos os líderes assim que for criada pelo Coordenador.
- [ ] **Bloqueio de Duplicidade:** Cada líder deve poder clicar/votar em uma opção **apenas uma vez**; votos subsequentes na mesma pauta devem ser rejeitados.
- [ ] **Gráficos Tempo Real:** Verifique se as barras de porcentagem se ajustam instantaneamente de acordo com o peso de cada submissão de voto.
- [ ] **Encerramento de Enquete:** A função "Encerrar" do lado do Admin deve congelar e inviabilizar a janela de votação para todos os apoiadores.

## 6. Dashboards e Histórico Eleitoral
- [ ] **Consolidação dos KPIs Supremos (Admin):** O agregador bruto de dados deve somar perfeitamente Cidades, Líderes, Apoiadores e Demandas Abertas do banco de dados na Home do Coordenador.
- [ ] **Gráfico de Engajamento por Bairro:** Validar se o gráfico de barras horizontal agrupa com precisão o potencial somado por cada região cadastrada.
- [ ] **Lançamento de Histórico (Análise):** Incluir dados de campanhas/fatos passados e verificar nas plotagens (`Recharts`) se a curva do gráfico passado "conversa" e se projeta com as quantias atuais de base.
- [ ] **Edição de Perfil (Lideranças):** Confirmar se a mudança de telefone, cidade ou coordenadas é salva perfeitamente na conta de um Cabo Eleitoral, impactando o mapa do Admin.

## 7. Performance e Usabilidade Geral
- [ ] **Responsividade Mobile:** Todo o painel de atuação do Cabo Eleitoral deve estar "Mobile-First" (botões largos, sem encolhimento de fontes) não exigindo computadores.
- [ ] **Carregamento Condicional de Dados:** Validar se ao longo de uma base maciça, os quadros do `Dashboard Web` carregam os gráficos em tempos toleráveis (otimizações e índices do DB).
