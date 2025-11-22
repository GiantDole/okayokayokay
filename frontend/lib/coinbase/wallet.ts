import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';

let walletInstance: Wallet | null = null;

/**
 * Get or create a server-side Coinbase wallet for automated payments
 */
export async function getServerWallet(): Promise<Wallet> {
  if (walletInstance) {
    return walletInstance;
  }

  // Initialize Coinbase SDK
  const apiKeyName = process.env.COINBASE_API_KEY_NAME;
  const privateKey = process.env.COINBASE_API_PRIVATE_KEY;

  if (!apiKeyName || !privateKey) {
    throw new Error('Coinbase API credentials not configured. Set COINBASE_API_KEY_NAME and COINBASE_API_PRIVATE_KEY in environment variables.');
  }

  Coinbase.configure({
    apiKeyName,
    privateKey,
  });

  // Get or create wallet
  const walletId = process.env.COINBASE_WALLET_ID;

  if (walletId) {
    // Load existing wallet
    walletInstance = await Wallet.fetch(walletId);
  } else {
    // Create new wallet
    const user = await Coinbase.defaultUser();
    walletInstance = await user.createWallet({
      networkId: Coinbase.networks.BaseMainnet,
    });

    console.log('Created new Coinbase wallet:', walletInstance.getId());
    console.log('Add this to your .env.local: COINBASE_WALLET_ID=' + walletInstance.getId());
  }

  return walletInstance;
}

/**
 * Get the default address for the server wallet
 */
export async function getServerWalletAddress(): Promise<string> {
  const wallet = await getServerWallet();
  const address = await wallet.getDefaultAddress();
  return address.getId();
}
