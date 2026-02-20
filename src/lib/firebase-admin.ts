import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

function initializeAdminApp(): App {
  // Se o app já estiver inicializado, retorna a instância existente.
  if (getApps().length > 0) {
    return getApp();
  }

  try {
    let serviceAccount;
    const serviceAccountPath = path.join(process.cwd(), 'firebase-admin.json');

    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else {
      // FALHA SILENCIOSA NO BUILD DO NEXT.JS CI: Retorna inicialização nula para não quebrar 
      // o 'next build' no Firebase App Hosting (que pré-roda o código de rotas back-end sem credenciais injetadas).
      // Se a rota for chamada no runtime real, falhará.
      console.warn('⚠️ [Firebase Admin] Nenhuma credencial encontrada. Assumindo modo de Build (App Hosting). App inicializado vazio.');
      return initializeApp();
    }

    // Inicializa o SDK do Admin
    return initializeApp({
      credential: cert(serviceAccount),
    });

  } catch (error) {
    console.error("Erro ao inicializar o Firebase Admin SDK:", error);
    throw error;
  }
}

const adminApp: App = initializeAdminApp();
const auth: Auth = getAuth(adminApp);

// Conecta-se à instância padrão do banco de dados
const firestore: Firestore = getFirestore(adminApp);

export { adminApp, auth, firestore };
