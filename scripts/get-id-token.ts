import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function main() {
  const { user } = await signInWithEmailAndPassword(
    auth,
    process.env.ADMIN_EMAIL!,
    process.env.ADMIN_PASSWORD!,
  );
  const token = await user.getIdToken();
  console.log(token);
}

main();