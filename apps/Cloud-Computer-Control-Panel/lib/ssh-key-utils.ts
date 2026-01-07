import forge from 'node-forge';

export interface SSHKeyPair {
  privateKey: string;
  publicKey: string;
  fingerprint: string;
}

/**
 * Generates an RSA SSH key pair
 * @param bits - Key size in bits (default: 2048)
 * @returns SSH key pair with private key (PEM format), public key (OpenSSH format), and fingerprint
 */
export function generateSSHKeyPair(bits: number = 2048): SSHKeyPair {
  // Generate RSA key pair
  const keypair = forge.pki.rsa.generateKeyPair({ bits, workers: -1 });

  // Convert private key to PEM format
  const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

  // Convert public key to OpenSSH format
  const publicKeySSH = convertPublicKeyToOpenSSH(keypair.publicKey);

  // Calculate fingerprint (MD5 hash of the public key)
  const fingerprint = calculateFingerprint(keypair.publicKey);

  return {
    privateKey: privateKeyPem,
    publicKey: publicKeySSH,
    fingerprint,
  };
}

/**
 * Converts a forge public key to OpenSSH format
 */
function convertPublicKeyToOpenSSH(publicKey: forge.pki.rsa.PublicKey): string {
  // Get the public key components
  const n = publicKey.n;
  const e = publicKey.e;

  // Convert to bytes
  const nBytes = hexToBytes(n.toString(16));
  const eBytes = hexToBytes(e.toString(16));

  // Build SSH public key format
  const algorithmName = 'ssh-rsa';
  const algorithmBytes = stringToBytes(algorithmName);

  // Create the binary format
  const parts: number[] = [];

  // Add algorithm
  addUint32(parts, algorithmBytes.length);
  parts.push(...algorithmBytes);

  // Add exponent
  addUint32(parts, eBytes.length);
  parts.push(...eBytes);

  // Add modulus
  addUint32(parts, nBytes.length);
  parts.push(...nBytes);

  // Encode to base64
  const binary = new Uint8Array(parts);
  const base64 = forge.util.encode64(String.fromCharCode(...binary));

  return `${algorithmName} ${base64}`;
}

/**
 * Calculates MD5 fingerprint of the public key
 */
function calculateFingerprint(publicKey: forge.pki.rsa.PublicKey): string {
  const publicKeySSH = convertPublicKeyToOpenSSH(publicKey);
  const base64Part = publicKeySSH.split(' ')[1];
  const binary = forge.util.decode64(base64Part);

  const md = forge.md.md5.create();
  md.update(binary);
  const hash = md.digest().toHex();

  // Format as colon-separated hex pairs
  return hash.match(/.{2}/g)?.join(':') || '';
}

/**
 * Helper function to convert hex string to bytes
 */
function hexToBytes(hex: string): number[] {
  // Ensure even length
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }

  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }

  // Add leading zero byte if MSB is set (for positive integer representation)
  if (bytes[0] & 0x80) {
    bytes.unshift(0);
  }

  return bytes;
}

/**
 * Helper function to convert string to bytes
 */
function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}

/**
 * Helper function to add a 32-bit unsigned integer in network byte order
 */
function addUint32(array: number[], value: number): void {
  array.push((value >>> 24) & 0xff);
  array.push((value >>> 16) & 0xff);
  array.push((value >>> 8) & 0xff);
  array.push(value & 0xff);
}

/**
 * Stores an SSH key pair in localStorage
 */
export function storeSSHKey(keyName: string, keyPair: SSHKeyPair): void {
  const keys = getStoredSSHKeys();
  keys[keyName] = keyPair;
  localStorage.setItem('ssh_keys', JSON.stringify(keys));
}

/**
 * Retrieves an SSH key pair from localStorage
 */
export function getSSHKey(keyName: string): SSHKeyPair | null {
  const keys = getStoredSSHKeys();
  return keys[keyName] || null;
}

/**
 * Retrieves all stored SSH keys from localStorage
 */
export function getStoredSSHKeys(): Record<string, SSHKeyPair> {
  if (typeof window === 'undefined') {
    return {};
  }

  const stored = localStorage.getItem('ssh_keys');
  if (!stored) {
    return {};
  }

  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Deletes an SSH key from localStorage
 */
export function deleteSSHKey(keyName: string): void {
  const keys = getStoredSSHKeys();
  delete keys[keyName];
  localStorage.setItem('ssh_keys', JSON.stringify(keys));
}
