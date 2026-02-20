
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';

// Configure o app do Firebase Admin
const serviceAccount = require('../../firebase-admin.json'); 

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const seedLeaders = async () => {
  console.log('Iniciando o seed de líderes...');
  const leadersCollection = db.collection('users');
  const leaderStatsCollection = db.collection('leader_stats');

  for (let i = 0; i < 5; i++) {
    const leaderId = faker.string.uuid();
    const leaderData = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      points: faker.number.int({ min: 1000, max: 10000 }),
      level: faker.number.int({ min: 1, max: 10 }),
      avatarUrl: faker.image.avatar(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isDemo: true,
      role: 'leader'
    };

    await leadersCollection.doc(leaderId).set(leaderData);

    const leaderStatsData = {
      totalMembers: faker.number.int({ min: 5, max: 50 }),
      missionsCompleted: faker.number.int({ min: 10, max: 100 }),
      eventsCreated: faker.number.int({ min: 1, max: 10 }),
      engagementIndex: faker.number.float({ min: 0.5, max: 1, precision: 0.01 })
    };

    await leaderStatsCollection.doc(leaderId).set(leaderStatsData);
  }

  console.log('Seed de líderes concluído.');
};

export { seedLeaders };
