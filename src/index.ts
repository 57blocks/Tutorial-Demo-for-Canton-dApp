import 'dotenv/config';
import { loop } from '@fivenorth/loop-sdk/server';
import forge from 'node-forge';

/**
 * Ensures the private key is 64 bytes (128 hex chars).
 * If a 32-byte seed is provided, expands it to the full Ed25519 keypair (seed + public key).
 */
function expandPrivateKey(hexKey: string): string {
  const clean = hexKey.replace(/^0x/, '');
  if (clean.length === 128) {
    // Already 64 bytes — full private key
    return clean;
  }
  if (clean.length === 64) {
    // 32-byte seed — derive public key and concatenate
    const seed = Buffer.from(clean, 'hex');
    const keypair = forge.ed25519.generateKeyPair({ seed });
    const fullKey = Buffer.concat([Buffer.from(keypair.privateKey), Buffer.from(keypair.publicKey)]);
    return fullKey.toString('hex');
  }
  throw new Error(
    `PRIVATE_KEY must be 64 hex chars (32-byte seed) or 128 hex chars (64-byte full key). Got ${clean.length} chars.`
  );
}

async function main() {
  const rawPrivateKey = process.env.PRIVATE_KEY;
  const partyId = process.env.PARTY_ID;
  const network = (process.env.NETWORK || 'local') as 'local' | 'devnet' | 'mainnet';

  if (!rawPrivateKey || !partyId) {
    console.error('Missing PRIVATE_KEY or PARTY_ID in environment variables.');
    console.error('Copy .env.example to .env and fill in your values.');
    process.exit(1);
  }

  const privateKey = expandPrivateKey(rawPrivateKey);

  // Initialize the Loop Server SDK
  loop.init({
    privateKey,
    partyId,
    network,
    ...(process.env.WALLET_URL && { walletUrl: process.env.WALLET_URL }),
    ...(process.env.API_URL && { apiUrl: process.env.API_URL }),
  });

  console.log(`Connecting to Loop (${network})...`);
  console.log(`Party: ${partyId}`);

  // Authenticate
  await loop.authenticate();
  console.log('Authenticated successfully.\n');

  // Get provider and fetch holdings
  const provider = loop.getProvider();
  const holdings = await provider.getHolding();

  console.log('=== Holdings ===');
  if (!holdings || (Array.isArray(holdings) && holdings.length === 0)) {
    console.log('No holdings found.');
  } else {
    console.log(JSON.stringify(holdings, null, 2));
  }

  // Fetch active holding contracts
  console.log('\n=== Active Holding Contracts ===');
  const holdingContracts = await provider.getActiveContracts({
    interfaceId: '#splice-api-token-holding-v1:Splice.Api.Token.HoldingV1:Holding',
  });

  if (!holdingContracts || (Array.isArray(holdingContracts) && holdingContracts.length === 0)) {
    console.log('No active holding contracts found.');
  } else {
    console.log(JSON.stringify(holdingContracts, null, 2));
  }

  // Fetch active credential contracts
  console.log('\n=== Active Credential Contracts ===');
  const credentialContracts = await provider.getActiveContracts({
    templateId: '#utility-credential-app-v0:Utility.Credential.App.V0.Model.Offer:CredentialOffer',
  });

  const ownCredentialContacts = await provider.getActiveContracts({
    templateId: '#utility-credential-v0:Utility.Credential.V0.Credential:Credential',
  });
  if (!credentialContracts || (Array.isArray(credentialContracts) && credentialContracts.length === 0)) {
    console.log('No active credential contracts found.');
  } else {
    console.log(JSON.stringify(credentialContracts, null, 2));
  }

  console.log('\n=== Own Credential Contracts ===');
  if (!ownCredentialContacts || (Array.isArray(ownCredentialContacts) && ownCredentialContacts.length === 0)) {
    console.log('No own credential contracts found.');
  } else {
    console.log(JSON.stringify(ownCredentialContacts, null, 2));
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
