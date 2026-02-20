
// scripts/validation/fixAndValidateLeaders.ts
import { firestore, auth } from '../../src/lib/firebase-admin';

interface Report {
  leaders_without_uid_field: string[];
  leaders_with_mismatched_id_and_uid: string[];
  auth_users_without_leader_doc: string[];
  leader_docs_orphans: string[];
  updated_leaders: string[];
}

async function fixAndValidateLeaders() {
  const report: Report = {
    leaders_without_uid_field: [],
    leaders_with_mismatched_id_and_uid: [],
    auth_users_without_leader_doc: [],
    leader_docs_orphans: [],
    updated_leaders: [],
  };

  let batch = firestore.batch();
  let batchSize = 0;

  try {
    console.log('Step 1: Fetching all leaders from Firestore...');
    const leadersSnapshot = await firestore.collection('leaders').get();
    console.log(`Found ${leadersSnapshot.docs.length} documents in /leaders collection.`);

    const leaderUidsFromFirestore = new Set<string>();

    console.log('Step 2: Checking and fixing leader documents...');
    for (const leaderDoc of leadersSnapshot.docs) {
      const leaderData = leaderDoc.data();
      const docId = leaderDoc.id;
      const expectedUid = docId;
      
      if (leaderData.uid) {
        leaderUidsFromFirestore.add(leaderData.uid);
      } else {
        leaderUidsFromFirestore.add(expectedUid); // Assume docId is the UID for old docs
      }

      if (!leaderData.uid) {
        report.leaders_without_uid_field.push(docId);
        const leaderRef = firestore.collection('leaders').doc(docId);
        batch.update(leaderRef, { uid: expectedUid });
        report.updated_leaders.push(docId);
        batchSize++;
      } else if (leaderData.uid !== docId) {
        report.leaders_with_mismatched_id_and_uid.push(docId);
      }

      if (batchSize >= 400) {
          console.log(`Committing a batch of ${batchSize} updates...`);
          await batch.commit();
          batch = firestore.batch();
          batchSize = 0;
          console.log('Batch committed.');
      }
    }

    if (batchSize > 0) {
        console.log(`Committing the final batch of ${batchSize} updates...`);
        await batch.commit();
        console.log('Final batch committed.');
    }

    console.log('Step 3: Comparing Firestore leaders with Firebase Auth users...');
    const listUsersResult = await auth.listUsers(1000);
    const allAuthUids = new Set(listUsersResult.users.map(user => user.uid));
    console.log(`Found ${allAuthUids.size} users in Firebase Auth.`);

    for (const leaderUid of leaderUidsFromFirestore) {
        if (!allAuthUids.has(leaderUid)) {
            report.leader_docs_orphans.push(leaderUid);
        }
    }

    for (const authUid of allAuthUids) {
        if (!leaderUidsFromFirestore.has(authUid)) {
            try {
              const user = await auth.getUser(authUid);
              const userRoles = user.customClaims?.roles || [];
              if (userRoles.includes('leader') || userRoles.includes('master') || userRoles.includes('sub')) {
                   report.auth_users_without_leader_doc.push(authUid);
              }
            } catch(e) {
                // user might have been deleted during script execution
            }
        }
    }

    console.log('--- Validation & Migration Report ---');
    console.log(JSON.stringify(report, null, 2));
    console.log('--- End of Report ---');

  } catch (error) {
    console.error('Error during validation and migration script:', error);
  }
}

fixAndValidateLeaders();
