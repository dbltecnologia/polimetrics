
import { getFirestore } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';

const db = getFirestore();

const seedMissionLogs = async () => {
  console.log('Iniciando o seed de logs de missões...');
  const missionLogsCollection = db.collection('mission_logs');

  const leaders = await db.collection('users').where('isDemo', '==', true).where('role', '==', 'leader').get();
  const members = await db.collection('members').where('isDemo', '==', true).get();
  const missions = await db.collection('missions').where('isDemo', '==', true).get();

  const leaderIds = leaders.docs.map(doc => doc.id);
  const memberIds = members.docs.map(doc => doc.id);
  const missionIds = missions.docs.map(doc => doc.id);
  const missionPoints = missions.docs.reduce((acc, doc) => {
    acc[doc.id] = doc.data().rewardPoints;
    return acc;
  }, {} as { [key: string]: number });


  for (let i = 0; i < 75; i++) { // 15 por líder, em média
    const missionId = faker.helpers.arrayElement(missionIds);
    const logData = {
      missionId,
      leaderId: faker.helpers.arrayElement(leaderIds),
      memberId: faker.helpers.arrayElement(memberIds),
      completedAt: faker.date.recent(90),
      pointsEarned: missionPoints[missionId],
      isDemo: true,
    };
    await missionLogsCollection.add(logData);
  }

  console.log('Seed de logs de missões concluído.');
};

export { seedMissionLogs };

