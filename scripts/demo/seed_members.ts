
import { getFirestore } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';

const db = getFirestore();

const seedMembers = async () => {
  console.log('Iniciando o seed de membros...');
  const membersCollection = db.collection('members');
  const leaders = await db.collection('users').where('isDemo', '==', true).where('role', '==', 'leader').get();
  const leaderIds = leaders.docs.map(doc => doc.id);

  for (let i = 0; i < 30; i++) {
    const memberId = faker.string.uuid();
    const memberData = {
      leaderId: faker.helpers.arrayElement(leaderIds),
      name: faker.person.fullName(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipcode: faker.location.zipCode(),
      status: faker.helpers.arrayElement(['Ativo', 'Em Risco', 'Potencial', 'Inativo']),
      lastContact: faker.date.recent(),
      points: faker.number.int({ min: 100, max: 5000 }),
      joinDate: faker.date.past(),
      avatarUrl: faker.image.avatar(),
      history: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
        action: faker.lorem.sentence(),
        date: faker.date.recent(),
      })),
      isDemo: true
    };

    await membersCollection.doc(memberId).set(memberData);
  }

  console.log('Seed de membros concluído.');
};

export { seedMembers };
