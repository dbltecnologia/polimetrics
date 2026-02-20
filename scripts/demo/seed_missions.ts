
import { getFirestore } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';

const db = getFirestore();

const seedMissions = async () => {
    console.log('Iniciando o seed de missões...');
    const missionsCollection = db.collection('missions');

    const missions = [
        { title: 'Primeiro Contato', description: 'Ligue para um novo membro.', rewardPoints: 50, category: 'Engajamento', status: 'Ativa' },
        { title: 'Visita Presencial', description: 'Visite um membro em sua casa.', rewardPoints: 150, category: 'Relacionamento', status: 'Ativa' },
        { title: 'Participar de Evento', description: 'Leve um membro a um evento.', rewardPoints: 100, category: 'Participação', status: 'Ativa' },
        { title: 'Indicação de Amigo', description: 'Um membro indicou um novo participante.', rewardPoints: 200, category: 'Expansão', status: 'Ativa' },
        { title: 'Feedback Construtivo', description: 'Colete um feedback valioso de um membro.', rewardPoints: 75, category: 'Melhoria', status: 'Ativa' }
    ];

    for (const mission of missions) {
        const missionId = faker.string.uuid();
        await missionsCollection.doc(missionId).set({ ...mission, isDemo: true });
    }

    console.log('Seed de missões concluído.');
};

export { seedMissions };
