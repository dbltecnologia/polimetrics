import { Timestamp } from 'firebase/firestore';

export interface City {
  id: string;
  name: string;
  state: string;
  createdAt?: Timestamp | string;
}

