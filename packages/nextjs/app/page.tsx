"use client";

import { useState } from "react";
import { useChannelBalance } from "./hooks/useChannelBalance";
import type { NextPage } from "next";
import { encodePacked, keccak256, parseEther, toBytes } from "viem";
import { useAccount } from "wagmi";
import { useSignMessage } from "wagmi";
import { ChallengeDefundButton } from "~~/components/ChallengeDefundButton";
import { ChannelBalance } from "~~/components/ChannelBalance";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const ETH_PER_REQUEST = "0.001";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  // ────────────────────────────────────────────────────────────
  // Channel balance state (read + refresh) ⤵
  const { balance, loading, refresh } = useChannelBalance(connectedAddress);
  // ────────────────────────────────────────────────────────────

  const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync, isPending } = useScaffoldWriteContract("Streamer");
  const { signMessageAsync } = useSignMessage();

  // ───────────────── Chat handling ─────────────────
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const ok = await reimburseService();
    if (!ok) return;

    setMessages(prev => [...prev, { user: "You", text: inputText }]);
    setInputText("");
    setIsLoading(true);
    await refresh();

    try {
      const res = await fetch("/api/getCompletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputText }),
      });
      if (!res.ok) throw new Error("Error fetching completion");
      const data = await res.json();
      setMessages(prev => [...prev, { user: "chETHGPT", text: data.message }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { user: "chETHGPT", text: "Oops! Something went wrong. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ───────────────── Blockchain actions ─────────────────
  const fundChannel = async () => {
    try {
      await writeContractAsync(
        {
          functionName: "fundChannel",
          value: parseEther("0.01"),
        },
        {
          onBlockConfirmation: async () => {
            await fetch("/api/postSignature", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                address: connectedAddress,
                signature: "0x00",
                updatedBalance: "10000000000000000",
                isChannelChallenged: false, // new line
                isChannelDefunded: false, // new line
                challengedAt: 0,
              }),
            });
            await refresh();
          },
        },
      );
    } catch (err) {
      console.error("Error funding channel", err);
    }
  };

  const reimburseService = async (): Promise<boolean> => {
    const initialBalance = await refresh();
    if (initialBalance === null) {
      alert("You need to open a channel first!");
      return false;
    }

    const costPerRequest = parseEther(ETH_PER_REQUEST);
    let updatedBalance = initialBalance - costPerRequest;
    if (updatedBalance < 0n) updatedBalance = 0n;

    try {
      const packed = encodePacked(["uint256"], [updatedBalance]);
      const signature = await signMessageAsync({
        message: { raw: toBytes(keccak256(packed)) },
      });

      await fetch("/api/updateBalance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: connectedAddress,
          signature,
          updatedBalance: updatedBalance.toString(),
        }),
      });
      //await refresh();
      return true;
    } catch (err) {
      console.error("Signing error", err);
      alert("Could not deduct channel balance");
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-300 flex flex-col items-center py-8 px-4">
      {/* Header */}
      {/* <h1 className="text-4xl font-bold mb-6 text-primary">chETHGPT</h1> */}

      {/* Balance widget always visible */}
      {/* <ChannelBalance connectedAddress={connectedAddress} /> */}
      {/* Balance widget */}
      <ChannelBalance balance={balance} loading={loading} />

      {/* Open‑channel button if none */}
      {!loading && balance === null && (
        <button className="btn btn-primary mt-6" onClick={fundChannel} disabled={isPending}>
          {isPending ? <span className="loading loading-spinner loading-sm" /> : "Open a Channel with 0.01 ETH"}
        </button>
      )}

      {/* Chat UI */}
      {!loading && balance !== null && (
        <div className="w-full max-w-2xl flex flex-col flex-grow mt-8 bg-base-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-base-content/20">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.user === "You" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[80%] break-words shadow-md ${
                    m.user === "You" ? "bg-primary text-primary-content" : "bg-base-100"
                  }`}
                >
                  <span className="block text-xs opacity-70 mb-1 font-semibold">{m.user}</span>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl bg-base-100 animate-pulse shadow-md">...</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-base-300 p-4 bg-base-100 flex gap-3">
            <input
              className="input input-bordered flex-1"
              placeholder="Type your message…"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleSendMessage()}
              disabled={isLoading}
            />
            <button className="btn btn-primary" onClick={handleSendMessage} disabled={isLoading || !inputText.trim()}>
              {isLoading ? "Sending…" : "Send"}
            </button>
          </div>
          <ChallengeDefundButton
            address={connectedAddress}
            onStatusChange={refresh} // refresh balance once channel closes
          />
        </div>
      )}
    </div>
  );
};

export default Home;
