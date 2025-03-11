"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { encodePacked, keccak256, parseEther, toBytes } from "viem";
import { useAccount } from "wagmi";
import { useSignMessage } from "wagmi";
import { ChannelBalance } from "~~/components/ChannelBalance";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync, isPending } = useScaffoldWriteContract("Streamer");
  const { signMessageAsync } = useSignMessage();
  const ETH_PER_REQUEST = "0.001";

  // Chat message handling
  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    setMessages(prev => [...prev, { user: "You", text: inputText }]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/getCompletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputText }),
      });

      if (!response.ok) throw new Error("Error fetching completion");

      const data = await response.json();
      setMessages(prev => [...prev, { user: "chETHGPT", text: data.message }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [
        ...prev,
        {
          user: "chETHGPT",
          text: "Oops! Something went wrong. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Existing blockchain functions
  const fundChannel = async () => {
    try {
      await writeContractAsync(
        {
          functionName: "fundChannel",
          value: parseEther("0.01"),
        },
        {
          onBlockConfirmation: txnReceipt => {
            console.log("Transaction blockHash", txnReceipt.blockHash);
          },
        },
      );
    } catch (error) {
      console.error("Error funding channel", error);
    }
  };

  const reimburseService = async () => {
    const initialBalance = parseEther("0.01");
    const costPerRequest = parseEther(ETH_PER_REQUEST);
    let updatedBalance = initialBalance - costPerRequest;
    if (updatedBalance < 0n) updatedBalance = 0n;

    try {
      const packed = encodePacked(["uint256"], [updatedBalance]);
      const signature = await signMessageAsync({
        message: { raw: toBytes(keccak256(packed)) },
      });

      if (signature) {
        await fetch("/api/postSignature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: connectedAddress,
            signature,
            updatedBalance: updatedBalance.toString(),
          }),
        });
      }
    } catch (error) {
      console.error("Signing error:", error);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <ChannelBalance connectedAddress={connectedAddress} />
        <Address address={connectedAddress} />
        <div className="flex-grow bg-base-300 w-full mt-2 px-1 py-5">
          <div className="max-w-2xl mx-auto">
            <div className="bg-base-100 rounded-lg p-6 h-[400px] overflow-y-auto mb-4">
              {messages.map((msg, index) => (
                <div key={index} className={`mb-4 ${msg.user === "You" ? "text-right" : "text-left"}`}>
                  <span className="font-bold text-secondary">{msg.user}:</span>
                  <p className="mt-1 bg-base-200 p-2 rounded-lg inline-block">{msg.text}</p>
                </div>
              ))}
              {isLoading && (
                <div className="text-left">
                  <div className="mt-1 bg-base-200 p-2 rounded-lg inline-block">...</div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="input input-bordered w-full"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyPress={e => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading}
              />
              <button className="btn btn-primary" onClick={handleSendMessage} disabled={isLoading}>
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>

        {/* Blockchain Actions */}
        <div className="mt-8 text-center space-y-4">
          <div>
            <p>1. Open a channel</p>
            <button className="btn btn-primary" onClick={fundChannel} disabled={isPending}>
              {isPending ? <span className="loading loading-spinner loading-sm"></span> : "Fund Channel"}
            </button>
          </div>

          <div>
            <p>2. Sign transaction</p>
            <button className="btn btn-primary" onClick={reimburseService}>
              Sign Tx
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
