'use server';

import { firestore } from '@/lib/firebase-admin';
import { serializeCollection } from '@/lib/firestore-serializers';
import { City } from '@/models/City';

/**
 * Fetches all cities from the 'cities' collection in Firestore.
 * 
 * @returns A promise that resolves to an array of City objects.
 */
export async function getAllCities(): Promise<City[]> {
  try {
    console.log('Fetching all cities from Firestore.');
    const citiesSnapshot = await firestore.collection('cities').get();

    if (citiesSnapshot.empty) {
      console.log('No cities found in the collection.');
      return [];
    }

    const cities = serializeCollection(citiesSnapshot);
    console.log(`Found ${cities.length} cities.`);

    return cities as City[];

  } catch (error) {
    console.error("Error fetching cities:", error);
    throw new Error('Failed to fetch cities from the database.');
  }
}
