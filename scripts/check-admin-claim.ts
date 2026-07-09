import 'dotenv/config';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert } from 'firebase-admin/app';
import serviceAccount from '../serviceAccountKey.json' with { type: 'json' };

initializeApp({
  credential: cert(serviceAccount as any),
});

const UID = process.env.ADMIN_UID!;

if (!UID) {
  throw new Error('ADMIN_UID ist nicht gesetzt.');
}

async function run() {
  const user = await getAuth().getUser(UID);
  console.log('Custom Claims:', user.customClaims);
}

run();