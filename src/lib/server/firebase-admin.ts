/**
 * Compat layer para imports antigos via `@/lib/firebase-admin`.
 *
 * IMPORTANTE:
 * Este módulo deve apontar para a mesma instância/config do Firebase Admin usada
 * em `@/lib/firebase-admin`.
 * Caso contrário, partes diferentes do app podem ler/escrever em bancos distintos.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { adminApp, auth, firestore } from '../firebase-admin';

// Mantém compatibilidade com código legado que importa `adminAuth`.
const adminAuth = auth;

// Mantém compatibilidade com código legado que usa `serverTimestamp()`.
const serverTimestamp = () => FieldValue.serverTimestamp();

export { adminApp, adminAuth, firestore, serverTimestamp, FieldValue };
