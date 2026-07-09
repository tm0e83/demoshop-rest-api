import 'dotenv/config';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert } from 'firebase-admin/app';
import serviceAccount from '../serviceAccountKey.json' with { type: 'json' };

initializeApp({
  credential: cert(serviceAccount as any),
});

const UID = process.env.ADMIN_UID!;

async function run() {
  await getAuth().setCustomUserClaims(UID, { admin: true });
  console.log('Claim set successfully.');
}

run();