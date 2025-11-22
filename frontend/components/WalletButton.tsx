"use client";

import { Wallet } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEnsName, useEnsAvatar } from "wagmi";
import { type Address } from "viem";

function ConnectedWalletButton({
  address,
  onClick,
}: {
  address: Address;
  onClick: () => void;
}) {
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName!,
    query: { enabled: !!ensName },
  });

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-lg overflow-hidden transition-opacity hover:opacity-80"
      aria-label="Account"
    >
      {ensAvatar ? (
        <img
          src={ensAvatar}
          alt="ENS Avatar"
          className="w-8 h-8 rounded-full"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
          <Wallet size={20} className="text-gray-300" />
        </div>
      )}
    </button>
  );
}

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="flex items-center justify-center p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                aria-label="Connect wallet"
              >
                <Wallet size={24} />
              </button>
            ) : (
              <ConnectedWalletButton
                address={account.address as Address}
                onClick={openAccountModal}
              />
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
