"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { encodePacked, keccak256, parseEther, toBytes } from "viem";
import { useAccount, useSignMessage } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const [completion, setCompletion] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const { address: connectedAddress } = useAccount();
  const { writeContractAsync, isPending } = useScaffoldWriteContract("Streamer");
  const ETH_PER_REQUEST = "0.001";

  const { signMessageAsync } = useSignMessage();
  // STEP 1. FUND A CHANNEL

  const fundChannel = async () => {
    try {
      await writeContractAsync(
        {
          functionName: "fundChannel",

          value: parseEther("0.01"),
        },
        {
          onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
          },
        },
      );
    } catch (error) {
      console.error("Error funding channel", error);
    }
  };

  //STEP 2. SIGN A MESSAGE WITH THE NEW BALANCE

  async function reimburseService() {
    const initialBalance = parseEther("0.01"); // This should be fetched from the database
    const costPerRequest = parseEther(ETH_PER_REQUEST);

    let updatedBalance = initialBalance - costPerRequest;

    if (updatedBalance < 0n) {
      updatedBalance = 0n;
    }

    const packed = encodePacked(["uint256"], [updatedBalance]);
    const hashed = keccak256(packed);
    const arrayified = toBytes(hashed);

    let signature;
    try {
      signature = await signMessageAsync({ message: { raw: arrayified } });
    } catch (err) {
      console.error("signMessageAsync error", err);
    }

    const hexBalance = updatedBalance.toString(16);

    if (hexBalance && signature) {
      console.log("Signing correct");
      //Here we should store the signature in the database
    }
  }

  // OPEN AI INTEGRATION

  const fetchCompletion = async () => {
    try {
      const response = await fetch("/api/getCompletion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: prompt }),
      });

      if (!response.ok) {
        throw new Error("Error fetching completion");
      }

      const data = await response.json();
      setCompletion(data.message);

      // Log to the browser console after setting the response
      console.log("OpenAI Completion Response:", data.message);
    } catch (error) {
      console.error("Error fetching completion:", error);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <p className="text-center text-lg">
            Get started by editing{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/nextjs/app/page.tsx
            </code>
          </p>
          <p className="text-center text-lg">
            Edit your smart contract{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              YourContract.sol
            </code>{" "}
            in{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/hardhat/contracts
            </code>
          </p>
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <p>
                Tinker with your smart contract using the{" "}
                <Link href="/debug" passHref className="link">
                  Debug Contracts
                </Link>{" "}
                tab.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p>
                Explore your local transactions with the{" "}
                <Link href="/blockexplorer" passHref className="link">
                  Block Explorer
                </Link>{" "}
                tab.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2>Enter a prompt for OpenAI:</h2>
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-1/2 mt-4"
            placeholder="Write your prompt here..."
          />
          <button onClick={fetchCompletion} className="bg-blue-500 text-white rounded px-4 py-2 ml-4 mt-4">
            Get Completion
          </button>
          <h2 className="mt-8">OpenAI Completion Response:</h2>
          {completion ? <p>{completion}</p> : <p>Loading...</p>}
        </div>

        <div className="mt-8 text-center">
          <p>1. Open a channel</p>
          <button className="btn btn-primary" onClick={fundChannel} disabled={isPending}>
            {isPending ? <span className="loading loading-spinner loading-sm"></span> : "Send"}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p>2. Sign the tx</p>
          <button className="btn btn-primary" onClick={reimburseService}>
            Sign Tx
          </button>
        </div>
      </div>
    </>
  );
};

export default Home;
