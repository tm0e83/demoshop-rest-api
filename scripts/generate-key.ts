import crypto from 'crypto';

const rawKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

console.log('Raw key:', rawKey);
console.log('Hash:', hash);