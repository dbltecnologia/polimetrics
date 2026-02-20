#!/usr/bin/env node

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');
const cities = require('../src/data/maranhaoCities.json');

function loadServiceAccount() {
  const localPath = path.resolve(__dirname, '../firebase-admin.json');
  if (fs.existsSync(localPath)) {
    return JSON.parse(fs.readFileSync(localPath, 'utf8'));
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }

  throw new Error('Forneça firebase-admin.json ou defina FIREBASE_SERVICE_ACCOUNT_KEY.');
}

const serviceAccount = loadServiceAccount();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const DB_NAME = process.env.FIRESTORE_DB_NAME || 'mapapoliticoclaudiocunha';
const adminApp = admin.apps[0];
const firestore = getFirestore(adminApp, DB_NAME);

console.log(`Seeding ${cities.length} cities to project ${serviceAccount?.project_id} / database ${DB_NAME}`);

async function seedCities() {
  const batch = firestore.batch();
  const citiesRef = firestore.collection('cities');
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  cities.forEach((city) => {
    const cityRef = citiesRef.doc(city.id);
    batch.set(
      cityRef,
      {
        id: city.id,
        name: city.name,
        state: 'MA',
        canonicalName: city.name.toLowerCase(),
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      { merge: true }
    );
  });

  await batch.commit();
  console.log(`Seeded ${cities.length} Maranhão cities.`);
}

seedCities()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro ao semear cidades:', error);
    process.exit(1);
  });
