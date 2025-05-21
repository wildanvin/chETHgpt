"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

/**
 * /signatures – lists every stored signature & lets the Guru withdraw earnings
 */
const SignaturesPage = () => {
  interface SigDoc {
    _id: string;
    address: string;
    signature: string; // 0x + 130‑hex‑chars (65‑byte) compact signature
    updatedBalance: string; // wei as decimal string
    isChannelChallenged?: boolean;
    isChannelDefunded?: boolean;
    challengedAt?: number;
  }

  const [data, setData] = useState<SigDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync, isPending } = useScaffoldWriteContract("Streamer");
  const [txStatus, setTxStatus] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /* utils                                                              */
  /* ------------------------------------------------------------------ */
  const shorten = (str: string, start = 6, end = 4) =>
    str.length <= start + end ? str : `${str.slice(0, start)}…${str.slice(-end)}`;

  // split a 65‑byte compact sig into (r,s,v)
  const splitSig = (sig: string) => {
    if (!sig || sig.length !== 132) throw new Error("Bad signature length");
    const r = `0x${sig.slice(2, 66)}`;
    const s = `0x${sig.slice(66, 130)}`;
    const v = Number.parseInt(sig.slice(130, 132), 16);
    return { r, s, v } as const;
  };

  const statusBadge = (doc: SigDoc) => {
    if (doc.isChannelDefunded) {
      return <span className="badge badge-neutral">Defunded</span>;
    }
    if (doc.isChannelChallenged) {
      return <span className="badge badge-error">Challenged</span>;
    }
    return <span className="badge badge-success">Open</span>;
  };

  /* ------------------------------------------------------------------ */
  /* data load                                                          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchSigs = async () => {
      try {
        const res = await fetch("/api/signatures");
        if (!res.ok) throw new Error("Failed to fetch signatures");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchSigs();
  }, [txStatus]); // refresh list after a withdrawal

  /* ------------------------------------------------------------------ */
  /* withdraw handler                                                   */
  /* ------------------------------------------------------------------ */
  const withdrawFor = async (doc: SigDoc) => {
    try {
      setTxStatus(`Withdrawing for ${shorten(doc.address)}`);
      const { r, s, v } = splitSig(doc.signature);
      const updatedBalanceBig = BigInt(doc.updatedBalance);

      await writeContractAsync({
        functionName: "withdrawEarnings",
        args: [
          {
            updatedBalance: updatedBalanceBig,
            sig: { r: r as `0x${string}`, s: s as `0x${string}`, v },
          },
        ],
      } as any);
      setTxStatus(`✅ Withdrawn for ${shorten(doc.address)}`);
    } catch (err: any) {
      console.error(err);
      setTxStatus(`❌ ${err.message || "Tx failed"}`);
    }
  };

  /* ------------------------------------------------------------------ */
  /* render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-300 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-primary">Stored Signatures</h1>

      {txStatus && (
        <div className="alert alert-info mb-4 shadow-lg">
          <span>{txStatus}</span>
        </div>
      )}

      {loading && <p className="animate-pulse">Loading…</p>}
      {error && <p className="text-error">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto w-full max-w-6xl bg-base-200 rounded-xl shadow-xl">
          <table className="table w-full">
            <thead>
              <tr className="text-base-content/70">
                <th>#</th>
                <th>Address</th>
                <th>Status</th>
                <th>Signature (r,s,v)</th>
                <th className="text-right">Balance (ETH)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((doc, idx) => (
                <tr key={doc._id} className="hover:bg-base-100/60">
                  <td>{idx + 1}</td>
                  <td className="font-mono">{shorten(doc.address)}</td>
                  <td>{statusBadge(doc)}</td>
                  <td className="font-mono text-xs break-all max-w-xs">{shorten(doc.signature, 10, 10)}</td>
                  <td className="text-right font-semibold">
                    {Number(formatEther(BigInt(doc.updatedBalance))).toLocaleString()} ETH
                  </td>
                  <td className="text-right">
                    <button className="btn btn-sm btn-primary" onClick={() => withdrawFor(doc)}>
                      {isPending ? "…" : "Withdraw"}
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6">
                    No signatures stored yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SignaturesPage;
