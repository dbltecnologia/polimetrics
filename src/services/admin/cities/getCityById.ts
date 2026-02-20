'use server';

import { firestore } from '@/lib/firebase-admin';
import { City } from '@/models/City';

/**
 * Fetches a single city by its document ID from Firestore.
 * 
 * @param cityId The ID of the city to fetch.
 * @returns A promise that resolves to a City object or null if not found.
 */
export async function getCityById(cityId: string): Promise<City | null> {
  if (!cityId) {
    console.log('getCityById called without an ID.');
    return null;
  }

  try {
    console.log(`Fetching city with ID: ${cityId}`);
    const cityRef = firestore.collection('cities').doc(cityId);
    const cityDoc = await cityRef.get();

    if (!cityDoc.exists) {
      console.log(`No city found with ID: ${cityId}`);
      return null;
    }

    const cityData = cityDoc.data();
    const city = {
      id: cityDoc.id,
      ...cityData
    } as City;

    console.log(`Found city:`, city);
    return city;

  } catch (error) {
    console.error(`Error fetching city with ID ${cityId}:`, error);
    return null;
  }
}
