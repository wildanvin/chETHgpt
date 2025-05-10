import { useCallback, useEffect, useState } from "react";

/**
 * Fetches the on‑chain/off‑chain balance for a payment channel.
 *
 * @param address – the wallet address that “owns” the channel
 * @returns {
 *   balance: bigint | null,
 *   loading: boolean,
 *   error: string | null,
 *   refresh: () => Promise<bigint | null>
 * }
 */
export const useChannelBalance = (address?: string) => {
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // one copy of the fetch logic, memoised by address
  const refresh = useCallback(async (): Promise<bigint | null> => {
    if (!address) return null;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/getBalance?address=${address}`);
      const data = await res.json();

      if (res.status === 200) {
        const wei = BigInt(data.updatedBalance);
        setBalance(wei);
        return wei;
      }

      if (res.status === 404) {
        setBalance(null);
        return null;
      }

      setError(data.error ?? "Unknown error");
      return null;
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setError("Network error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [address]);

  // auto‑load whenever the address changes
  useEffect(() => {
    if (address) void refresh();
    else setBalance(null);
  }, [address, refresh]);

  return { balance, loading, error, refresh };
};
