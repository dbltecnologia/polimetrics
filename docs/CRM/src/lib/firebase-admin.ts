// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Hardcoded service account credentials
const serviceAccount: admin.ServiceAccount = {
    projectId: "dbltecnologia-de408",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCai0SDY5UhU7V3\nF3M4R42lksrPPd/jsJZE5j47wzi1OgBSA9j3B6Hf6XeOtoc+hr/u0im3s0Y+txJi\ns9fhVZcJ0AK+uekkzMgBXelBCmgaPT5aIPAoJRge9eRogZp+x0d1Q18ONtgT6Jcp\nv1N7YqeIaZWTYgsltCVKsSRPEtjHfCqHfDjpGHz80+GNPJen+Oc8WGRJcYKp06EM\njslOfR/fwhLg3oURQYMTuyw7J243+VPj1SxAn5JjNJjLxPe1dfoaNr8qsDB0VNgI\nbQWQTDn4A5RGiZWa6HosLI0iHKIR6YVUf1Pjpdcj3kkRVD0EtaIW5z9e9T91Zg3W\n6Ouq+iDFAgMBAAECggEAFofYQLl7a+Tqz0Z1b06LOYjZlXYlVmoPtlLE3uyar10Z\n39scvgL4WA8O9ZjpxbVadQRhvZze0FTbUtV6UykpwG35gHnVIh7Sx9Q7pdZREAY+\nuWAU8x1ZU2Yw2wWOEw6VfeSJDqbzQI/HvffdQV9EInCWNGr2ShRl3WpO61JJlWds\nMXEY48NmEfyIiqNkRbZxWnyHJTyQbQUHkMkiFSotZAOMRJLlgPe/2XGez0J1j3Go\nIyhozgrcHYaztWCMVXVjcIW736yBb8A5I2L14mKJSrV3Z2bXft+rQsjTUk96im71\nI2z4NZYY11JLHFbnpvkOMGt9+xafB6QbpYulFSYFYQKBgQDQuWT5Qiy3CcQqHV9/\nv8HehOMvQFS/0n+/ZaRUnuGuY6MmzLQRLbVFq3AdhegtGkjp1mfdLN5ip4yX48IB\nybX7FQyPOhcvlx9YfNmlIzcCH4DXJWLAK4JiHj//EvXvBofYWBWrukTvAiR+O4BI\nMc0gbJGtC5pWPOpXeDg3mDG3MQKBgQC9jE36rO2uF8Cl0McxJNff5fz7AcB6uUee\n/o11Y1UDwnuKUaBGlZyWwlIY7tijtLE+IRQxtm2Lu2uGIrkVuYvOCzO98t1ucXsV\nljXK5RSVcVyRdZlFrnCbW6MA5KX8lP5qrMCV1VGRwEznm6wEGU5s3FppFofhiYfG\ndJKmoOTF1QKBgQCh1X2C/lopOXtNpCStqoKpA6QauOh9Krs+LZLywZX+XubbaJCd\nWTFZ6YkueusAPYcXN9SkWuu61mpeQovkUv+0xCdOzh24GpaFR5iBQAKgtMhzCFu+\n4H1hkk7QeWUShZ/CkNmMowpbvu+IqJ3YXDTN1SBGad6qyuRwGZiNEoZJoQKBgEHY\n7vIJhxw2li9EYx54bSIT9JmCV0qK+Q2L4rqIAm2m72Hyz1oV+WsKIJkWyF2+lOA/\nf5Nxi4bCWi0j/OZGKgIvNA9lwnTuqVKrdw6AHHF6Cy1hDBj/65Cc+fiCdgNUAzot\nv02N6KNYiZ7gHpbh77OzrRjaweOg8nEH6DZIqJDtAoGBALcr2aypJ+n14F3gIdpy\n4LdYqV63CzlskpLwBkKuhx5Po79lyKdnE8Y6/gkuVTc4M9eLRexk+v/PaHi8GSEf\nH2h1Iyw+DOaJFnMl8PX7SceZHbl5iJC+PKSemoqjTB7qLs35fLmVBwnVff9ACDzJ\nHSpii4ziMiiuVM93gjzmMwZI\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
    clientEmail: "firebase-adminsdk-fbsvc@dbltecnologia-de408.iam.gserviceaccount.com",
};

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e: any) {
        console.error('Falha ao inicializar o Firebase Admin SDK com credenciais hardcoded.', e.message);
    }
}

const auth = admin.auth();
// Use the named database 'agenticx-ia-crm' (must match firebase.ts)
const db = getFirestore(admin.apps[0]!, 'agenticx-ia-crm');

export { auth, db };
