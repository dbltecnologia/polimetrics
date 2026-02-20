# Casos de Uso (Use Cases)

A flexibilidade da PoliMetrics a torna útil em diversos cenários da jornada política, desde a captação inicial até o dia da eleição. Abaixo estão os cenários mais comuns (Casos de Uso) onde a plataforma resolve dores crônicas das campanhas eleitorais.

## Cenário 1: Dispersão e "Perda" de Lideranças de Bairro
**A Dor:** O candidato possui uma rede de "apoiadores chave" (líderes) responsáveis por captar votos, mas a equipe administrativa se perde no controle de planilhas. Alguns líderes deixam de atuar e ninguém percebe.
**A Solução PoliMetrics:**
1. O administrador cadastra um novo Líder no sistema através do formulário de Líderes. Ele vincula o CPF, Área de Atuação e Nível de Influência.
2. O Líder acessa seu próprio "Gabinete Virtual" usando seus dados de acesso restrito (protegido por MFA - Multiple Factor Authentication, se configurado via Firebase).
3. O Líder começa a usar o botão **Cadastrar Apoiador** no seu próprio celular durante reuniões de bairro, preenchendo os dados daquelas pessoas que declaram apoio ao candidato.
4. O sistema imediatamente incrementa os "Membros" deste Líder.
5. No **Dashboard Admin**, a barra de **Potencial de Votos** daquele bairro específico sobe automaticamente. O Candidato agora sabe matematicamente que aquele Líder "entrega resultado".

## Cenário 2: Tomada de Decisão e Estratégia de Eventos
**A Dor:** O estrategista de campanha não sabe em qual bairro alocar orçamentos de publicidade nem onde marcar os eventos da agenda do candidato no final de semana, pois não mede o "volume digital" da área.
**A Solução PoliMetrics:**
1. A equipe de análise acessa a guia **Eleições e Análises**.
2. Observa o gráfico "Potencial de Votos por Bairro". Nota que o Bairro X tem uma barra altíssima, porém nos pleitos passados o desempenho global nessa mesma zona foi baixo (comparando com **Histórico de Eleições**).
3. A equipe entende que a base atual **ainda não se converteu em votos consolidados** no passado e foca o roteiro do próximo evento (Carreata) no Bairro X para cristalizar a intenção de voto.

## Cenário 3: Fidelização do Cabo Eleitoral (Pós-Eleição/Mandato)
**A Dor:** Assim que a eleição acaba ou durante o mandato, o líder comunitário se sente "abandonado" pela gestão. O WhatsApp do político vira um gargalo, as mensagens se perdem e apoios são desfeitos por frustração.
**A Solução PoliMetrics:**
1. O líder comunitário utiliza o **Gabinete Virtual**. Se há um pedido de melhoria em rua sem asfalto, ele registra uma "Proposta" na plataforma oficial.
2. Essa proposta aparece organizada como um **Chamado** no Dashboard Admin do Mandato. A equipe responde institucionalmente através do sistema, documentando as soluções e as tentativas de ajuda que a gestão realizou.
3. Se a prefeitura recusa consertar a rua, a equipe sinaliza. O líder sabe que o candidato "tentou" o benefício.
4. Paralelamente, a pauta do próximo envio de recursos do mandato é levantada numa **Minivotação**. Os próprios líderes votam. O processo se torna colaborativo, garantindo a permanência orgânica dessa liderança para a eleição seguinte.

## Cenário 4: Apagamento Visual Georreferenciado
**A Dor:** Candidatos a deputados precisam atuar em regiões difusas de múltiplos municípios, dificultando a noção territorial do "banco de votos".
**A Solução PoliMetrics:**
1. A ferramenta **Mapa Interativo** carrega todo o estado/região no `Leaflet`.
2. Pontos de marcação mostram **onde** existem líderes trabalhando pelo candidato (baseado em Lat/Lng ou Bairros). Áreas em branco no mapa revelam buracos estratégicos que precisam de novos recrutamentos locais (novas filiações de lideranças).
