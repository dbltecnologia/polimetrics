import { adminAuth as auth, firestore } from '../src/lib/server/firebase-admin';

async function setupUsers() {
    const defaultPassword = "password123";

    const usersToCreate = [
        { email: "admin@polimetrics.com.br", role: "admin", name: "Administrador Geral" },
        { email: "lider@polimetrics.com.br", role: "leader", name: "Líder Comunitário" }
    ];

    for (const u of usersToCreate) {
        let user;
        try {
            user = await auth.getUserByEmail(u.email);
            console.log(`Usuário ${u.email} já existe. Atualizando permissões para '${u.role}'...`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log(`Criando novo usuário ${u.email}...`);
                user = await auth.createUser({
                    email: u.email,
                    password: defaultPassword,
                    displayName: u.name,
                });
            } else {
                console.error(`Erro ao buscar usuário ${u.email}:`, error);
                continue;
            }
        }

        // Set Custom Claims (FirebaseAuth)
        const currentClaims = user.customClaims || {};
        await auth.setCustomUserClaims(user.uid, {
            ...currentClaims,
            role: u.role,
        });

        // Registra o usuário nas coleções do Firestore
        await firestore.collection('users').doc(user.uid).set({
            role: u.role,
            email: u.email,
            name: u.name,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        await firestore.collection('leaders').doc(user.uid).set({
            role: u.role,
            email: u.email,
            name: u.name,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log(`[OK] Usuário ${u.email} configurado com sucesso! Senha (se criado agora): ${defaultPassword}`);
    }
}

console.log("Iniciando provisionamento de contas base...");
setupUsers()
    .then(() => {
        console.log("Processo concluído.");
        process.exit(0);
    })
    .catch((e) => {
        console.error("Falha ao provisionar usuários:", e);
        process.exit(1);
    });
