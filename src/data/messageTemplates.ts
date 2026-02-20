
export interface MessageTemplate {
  id: string;
  label: string;
  text: string;
  category: 'saudacao' | 'evento' | 'aniversario' | 'reativacao';
}

export const messageTemplates: MessageTemplate[] = [
  {
    id: "welcome",
    label: "Mensagem de Boas-Vindas",
    text: "Olá {nome}, tudo bem? Aqui é {lider}. Seja muito bem-vindo(a) à nossa equipe! Sua participação é fundamental para construirmos uma cidade melhor. 🙌",
    category: 'saudacao'
  },
  {
    id: "birthday",
    label: "Aniversário — Parabéns!",
    text: "Olá {nome}! Hoje é o seu dia e eu não poderia deixar de passar para desejar um feliz e abençoado aniversário! Que seja um ciclo de muita saúde, paz e conquistas. 🎉",
    category: 'aniversario'
  },
  {
    id: "event_invite",
    label: "Convite para Evento",
    text: "Fala, {nome}! Tudo certo? Gostaria de te convidar para o nosso próximo encontro que será sobre {assunto_evento}, no dia {data_evento}. Sua presença é muito importante!",
    category: 'evento'
  },
  {
    id: "event_confirmation",
    label: "Confirmação de Presença",
    text: "Olá {nome}, passando para confirmar sua presença em nosso evento amanhã. Contamos com você para fazer a diferença. Um abraço!",
    category: 'evento'
  },
  {
    id: "reactivate_supporter",
    label: "Reativar Apoiador",
    text: "Olá {nome}, como vai? Aqui é {lider}. Senti sua falta em nossas últimas atividades. Está tudo bem? Seu apoio é muito importante para nós. Vamos conversar?",
    category: 'reativacao'
  }
];
