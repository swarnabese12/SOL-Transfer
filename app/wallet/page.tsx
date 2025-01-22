"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";

export default function Page() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<"success" | "error" | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [explorerLink, setExplorerLink] = useState<string | null>(null);

  const createTestWallet = () => {
    const newWallet = Keypair.generate();
    console.log("Receiver PUB key:", newWallet.publicKey.toString());
    return newWallet.publicKey.toString();
  };

  const connectWallet = async () => {
    setLoading(true);
    setNotificationMessage(null);

    try {
      if (window.solana && window.solana.isPhantom) {
        const response = await window.solana.connect();
        setWalletAddress(response.publicKey.toString());
        setIsConnected(true);
        setNotificationMessage("Wallet connected successfully! 🎉🎉🎉🎉");
        setNotificationType("success");
      } else {
        alert("Please install Phantom Wallet!");
      }
    } catch {
      setNotificationMessage("Failed to connect wallet.");
      setNotificationType("error");
    } finally {
      setLoading(false);
    }
  };

  const getBalance = useCallback(async () => {
    if (walletAddress) {
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      const publicKey = new PublicKey(walletAddress);
      const walletBalance = await connection.getBalance(publicKey);
      setBalance(walletBalance / 1e9);
    }
  }, [walletAddress]);

  const sendTransaction = async () => {
    if (!walletAddress || !recipientAddress || !amount) {
      setNotificationMessage("Please enter a valid recipient address and amount.");
      setNotificationType("error");
      return;
    }

    setLoading(true);
    setExplorerLink(null);

    try {
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      const fromPublicKey = new PublicKey(walletAddress);
      const toPublicKey = new PublicKey(recipientAddress);
      const lamports = parseFloat(amount) * 1e9;

      const { blockhash } = await connection.getLatestBlockhash("confirmed");

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      );

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPublicKey;

      const { signature } = await window.solana.signAndSendTransaction(transaction);

      const explorerLink = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
      setExplorerLink(explorerLink);

      await connection.confirmTransaction(signature, "confirmed");

      setNotificationMessage("Hurray! Transaction successful! 🎉🎉🎉🎉");
      setNotificationType("success");

      getBalance();
    } catch {
      setNotificationMessage("Transaction failed. Please try again.");
      setNotificationType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const newTestWalletAddress = createTestWallet();
    setRecipientAddress(newTestWalletAddress);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      getBalance();
    }
  }, [walletAddress, getBalance]);

  useEffect(() => {
    if (notificationMessage) {
      const timer = setTimeout(() => {
        setNotificationMessage(null);
        setNotificationType(null);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [notificationMessage]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Solana Wallet Integration</h1>
      {notificationMessage && (
        <div
          className={`flex items-center p-4 mb-4 text-${notificationType === "success" ? "green" : "red"}-700 bg-green-200 rounded-lg shadow-md w-full sm:w-96`}
        >
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.293 5.293a1 1 0 00-1.414 0L9 10.586 7.121 8.707a1 1 0 10-1.414 1.414l2.293 2.293a1 1 0 001.414 0l4-4a1 1 0 000-1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span>{notificationMessage}</span>
        </div>
      )}

      <div className="bg-white shadow-lg rounded-lg p-6 w-full sm:w-[600px] text-center">
        {!isConnected ? (
          <button
            onClick={connectWallet}
            className="w-full py-3 btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner text-success"></span> Connecting to wallet...
              </>
            ) : (
              "Connect Phantom Wallet"
            )}
          </button>
        ) : (
          <div className="w-full px-4 py-6">
            <p className="text-lg text-gray-800 mb-4">
              <strong>My Wallet Address:</strong> {walletAddress}
            </p>
            <p className="text-lg text-gray-800">
              <strong>My Balance:</strong> {balance} SOL
            </p>

            <div className="mt-6">
              <label className="text-gray-800 text-lg block mb-2">
                <strong>Receiver Wallet Address:</strong>
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full input input-bordered mb-4"
              />
              <input
                type="number"
                placeholder="Amount (SOL)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full input input-bordered mb-4"
              />
              <button
                onClick={sendTransaction}
                className={`w-full btn ${loading ? "bg-green-500" : "btn-success"}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner text-success"></span> <span className="text-green-700">Sending SOL...</span>
                  </>
                ) : (
                  "Send SOL"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {explorerLink && (
        <div className="mt-4">
          <p className="text-gray-800">
            <strong>Transaction Explorer Link:</strong>
          </p>
          <a
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            {explorerLink}
          </a>
        </div>
      )}
    </div>
  );
}
