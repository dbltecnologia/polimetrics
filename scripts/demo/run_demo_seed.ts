
import { seedLeaders } from './seed_leaders';
import { seedMembers } from './seed_members';
import { seedEvents } from './seed_events';
import { seedMissions } from './seed_missions';
import { seedMissionLogs } from './seed_mission_logs';


const runAllSeeds = async () => {
  console.log('Iniciando a população do banco de dados com dados de demonstração...');

  await seedLeaders();
  await seedMembers();
  await seedEvents();
  await seedMissions();
  await seedMissionLogs();


  console.log('----------------------------------------');
  console.log('✔️  POPULAÇÃO DEMO CONCLUÍDA COM SUCESSO!');
  console.log('----------------------------------------');
  process.exit(0);
};

runAllSeeds().catch(error => {
  console.error('Ocorreu um erro durante o processo de seed:', error);
  process.exit(1);
});
