"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon, FlagTriangleRightIcon } from "lucide-react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Props {
  address: string | undefined;
  onStatusChange?: () => void;
}

export const ChallengeDefundButton: React.FC<Props> = ({ address, onStatusChange }) => {
  const { writeContractAsync, isPending } = useScaffoldWriteContract("Streamer");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [stage, setStage] = useState<"idle" | "challenged" | "readyToDefund" | "defunded">("idle");

  /* --------------------------------- load status -------------------------------- */
  useEffect(() => {
    const fetchStatus = async () => {
      if (!address) return;
      try {
        const res = await fetch(`/api/channelStatus?address=${address}`);
        if (!res.ok) return;
        const { isChannelChallenged, isChannelDefunded, challengedAt } = await res.json();
        if (isChannelDefunded) {
          setStage("defunded");
        } else if (isChannelChallenged) {
          const elapsed = Date.now() / 1000 - challengedAt;
          const remaining = 30 - Math.floor(elapsed);
          if (remaining > 0) {
            setStage("challenged");
            setSecondsLeft(remaining);
          } else {
            setStage("readyToDefund");
          }
        }
      } catch (err) {
        console.error("channelStatus fetch failed:", err);
      }
    };
    fetchStatus();
  }, [address]);

  /* ------------------------------- ticker --------------------------------------- */
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      setStage("readyToDefund");
      setSecondsLeft(null);
      return;
    }
    const id = setInterval(() => setSecondsLeft(s => (s ?? 1) - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  /* -------------------------------- handlers ------------------------------------ */
  const challenge = async () => {
    if (!address) return;
    try {
      await writeContractAsync({ functionName: "challengeChannel" });
      await fetch("/api/updateChannelStatus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, isChannelChallenged: true, challengedAt: Date.now() / 1000 }),
      });
      setStage("challenged");
      setSecondsLeft(30);
      onStatusChange?.();
    } catch (err) {
      console.error(err);
    }
  };

  const defund = async () => {
    if (!address) return;
    try {
      await writeContractAsync({ functionName: "defundChannel" });
      await fetch("/api/updateChannelStatus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, isChannelDefunded: true }),
      });
      setStage("defunded");
      onStatusChange?.();
    } catch (err) {
      console.error(err);
    }
  };

  /* --------------------------------- styling helpers ---------------------------- */
  const btnClassesByStage: Record<typeof stage, string> = {
    idle: "btn-accent",
    challenged: "btn-warning animate-pulse",
    readyToDefund: "btn-primary",
    defunded: "btn-success btn-disabled",
  };

  const label =
    stage === "idle"
      ? "Challenge"
      : stage === "challenged"
        ? `Waiting… ${secondsLeft}s`
        : stage === "readyToDefund"
          ? "Defund"
          : "Defunded";

  const onClick = stage === "idle" ? challenge : stage === "readyToDefund" ? defund : undefined;

  /* --------------------------------- render ------------------------------------- */
  return (
    <div className="flex flex-col gap-2 w-full mt-4">
      <button className={`btn w-full ${btnClassesByStage[stage]}`} disabled={isPending || !onClick} onClick={onClick}>
        {isPending ? (
          <span className="loading loading-spinner loading-sm" />
        ) : stage === "defunded" ? (
          <CheckCircleIcon className="w-4 h-4 mr-1" />
        ) : stage === "idle" ? (
          <FlagTriangleRightIcon className="w-4 h-4 mr-1" />
        ) : null}
        {label}
      </button>

      {stage === "challenged" && secondsLeft !== null && (
        <progress className="progress w-full progress-warning" value={30 - secondsLeft} max={30} />
      )}
    </div>
  );
};
