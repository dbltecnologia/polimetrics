
// scripts/debug/listCollections.ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

async function listAllCollections() {
  try {
    console.log('Initializing Firebase Admin SDK...');

    let serviceAccount;
    const serviceAccountPath = path.join(process.cwd(), 'firebase-admin.json');

    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else {
      throw new Error('Could not find firebase-admin.json or FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
    }

    const adminApp = initializeApp({
      credential: cert(serviceAccount),
    });

    // Connect to the specific database
    const dbName = 'mapapoliticoclaudiocunha';
    const firestore = getFirestore(adminApp, dbName);
    console.log(`Successfully connected to database: ${dbName}`);

    console.log('Fetching all root collections from Firestore...');
    const collections = await firestore.listCollections();
    
    if (collections.length === 0) {
      console.log('No collections found in the database.');
      return;
    }

    console.log('--- Firestore Collections ---');
    collections.forEach(collection => {
      console.log(`- ${collection.id}`);
    });
    console.log('--- End of List ---');

  } catch (error) {
    console.error('Error listing collections:', error);
  }
}

listAllCollections();
