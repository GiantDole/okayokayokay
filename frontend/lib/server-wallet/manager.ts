import { createServerClient } from '@/lib/supabase/server';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { encryptPrivateKey, decryptPrivateKey } from './crypto';

export interface ServerWallet {
  id: string;
  session_id: string;
  wallet_address: string;
  created_at: string;
  updated_at: string;
}

export interface ServerWalletWithKey extends ServerWallet {
  private_key: string;
}

/**
 * Get or create a server wallet for a session
 */
export async function getOrCreateServerWallet(
  sessionId: string
): Promise<ServerWalletWithKey> {
  const supabase = await createServerClient();

  // Try to get existing wallet
  const { data: existing } = await supabase
    .from('server_wallets')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (existing) {
    // Decrypt the private key
    const privateKey = decryptPrivateKey(existing.encrypted_private_key);
    return {
      ...existing,
      private_key: privateKey,
    };
  }

  // Create new wallet with viem
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const encryptedPrivateKey = encryptPrivateKey(privateKey);

  const { data: newWallet, error } = await supabase
    .from('server_wallets')
    .insert({
      session_id: sessionId,
      encrypted_private_key: encryptedPrivateKey,
      wallet_address: account.address.toLowerCase(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create server wallet: ${error.message}`);
  }

  return {
    ...newWallet,
    private_key: privateKey,
  };
}

/**
 * Get server wallet by session ID (without CDP wallet)
 */
export async function getServerWallet(
  sessionId: string
): Promise<ServerWallet | null> {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('server_wallets')
    .select('id, session_id, wallet_address, created_at, updated_at')
    .eq('session_id', sessionId)
    .single();

  return data;
}
