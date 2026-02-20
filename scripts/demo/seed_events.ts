
import { getFirestore } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';

const db = getFirestore();

const seedEvents = async () => {
  console.log('Iniciando o seed de eventos...');
  const eventsCollection = db.collection('events');
  const leaders = await db.collection('users').where('isDemo', '==', true).where('role', '==', 'leader').get();
  const leaderIds = leaders.docs.map(doc => doc.id);

  for (let i = 0; i < 8; i++) {
    const eventId = faker.string.uuid();
    const eventData = {
      title: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      location: faker.location.streetAddress(),
      date: faker.date.future(),
      type: faker.helpers.arrayElement(['Reunião', 'Treinamento', 'Conferência']),
      participantsCount: faker.number.int({ min: 10, max: 100 }),
      leaderId: faker.helpers.arrayElement(leaderIds),
      isDemo: true
    };

    await eventsCollection.doc(eventId).set(eventData);
  }

  console.log('Seed de eventos concluído.');
};

export { seedEvents };
