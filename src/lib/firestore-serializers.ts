
import { Timestamp } from 'firebase-admin/firestore';

export function serializeTimestamp(timestamp: Timestamp): string {
  return timestamp.toDate().toISOString();
}

export function serializeDoc(doc: FirebaseFirestore.DocumentData): any {
  const data = doc.data();
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = serializeTimestamp(data[key]);
    }
  }
  return { ...data, id: doc.id };
}

export function serializeCollection(snapshot: FirebaseFirestore.QuerySnapshot): any[] {
  return snapshot.docs.map(serializeDoc);
}
