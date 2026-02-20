import { adminAuth as auth, firestore } from '../src/lib/server/firebase-admin';

// Substitua pelo e-mail do usuário que você deseja tornar administrador
const adminEmail = process.argv[2];

if (!adminEmail) {
    console.error("Por favor, forneça o email do usuário como argumento.");
    console.log("Uso: npx ts-node scripts/makeAdmin.ts seu_email@exemplo.com");
    process.exit(1);
}

async function makeAdmin() {
    try {
        const user = await auth.getUserByEmail(adminEmail);
        console.log(`Localizado usuário: ${user.uid}`);

        // Set Custom Claims (FirebaseAuth)
        const currentClaims = user.customClaims || {};
        await auth.setCustomUserClaims(user.uid, {
            ...currentClaims,
            role: 'admin',
        });
        console.log(`Custom Claims de 'admin' injetados com sucesso no Auth!`);

        // Registra esse usuário na coleção leaders/users para que a interface encontre
        await firestore.collection('users').doc(user.uid).set({
            role: 'admin',
            email: adminEmail,
            name: user.displayName || 'Administrador',
            updatedAt: new Date().toISOString()
        }, { merge: true });

        await firestore.collection('leaders').doc(user.uid).set({
            role: 'admin',
            email: adminEmail,
            name: user.displayName || 'Administrador',
            updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log(`Coleções do Firestore atualizadas com permissão 'admin'.`);
        console.log('Operação concluída. O usuário agora tem permissão irrestrita no painel PoliMetrics.');

    } catch (error) {
        console.error(`Erro ao atualizar o usuário ${adminEmail}:`, error);
    }
}

makeAdmin();
