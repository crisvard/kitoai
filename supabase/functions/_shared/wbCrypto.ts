// Utilitário de criptografia para credenciais WhatsApp Business API
// Usa AES-256-GCM via Web Crypto API (compatível com Deno/Edge Functions)

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits para GCM

async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptToken(plaintext: string): Promise<string> {
  const password = Deno.env.get('WHATSAPP_ENCRYPTION_KEY');
  const salt = Deno.env.get('WHATSAPP_ENCRYPTION_SALT');

  if (!password || !salt) {
    throw new Error('WHATSAPP_ENCRYPTION_KEY ou WHATSAPP_ENCRYPTION_SALT não configurados');
  }

  const key = await deriveKey(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const enc = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    enc.encode(plaintext)
  );

  // Formato: base64(iv):base64(encryptedData)
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const encBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

  return `${ivBase64}:${encBase64}`;
}

export async function decryptToken(encryptedText: string): Promise<string> {
  const password = Deno.env.get('WHATSAPP_ENCRYPTION_KEY');
  const salt = Deno.env.get('WHATSAPP_ENCRYPTION_SALT');

  if (!password || !salt) {
    throw new Error('WHATSAPP_ENCRYPTION_KEY ou WHATSAPP_ENCRYPTION_SALT não configurados');
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Formato de token criptografado inválido');
  }

  const iv = Uint8Array.from(atob(parts[0]), (c) => c.charCodeAt(0));
  const encryptedData = Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0));

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encryptedData
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}
