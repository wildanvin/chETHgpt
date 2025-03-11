import { useCallback, useEffect, useState } from "react";

export const ChannelBalance = ({ connectedAddress }: { connectedAddress: string | undefined }) => {
  const [balance, setBalance] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      const response = await fetch(`/api/getBalance?address=${connectedAddress}`);
      const data = await response.json();

      if (response.status === 200) {
        console.log("User Balance:", data.updatedBalance);
        return data.updatedBalance;
      } else if (response.status === 404) {
        console.warn("Error:", data.error);
        alert("You need to open a channel first!");
        return null;
      } else {
        console.error("Unexpected error:", data.error);
        return null;
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      return null;
    }
  }, [connectedAddress]); // Memoize fetchBalance to avoid re-creation

  useEffect(() => {
    if (connectedAddress) {
      fetchBalance().then(bal => setBalance(bal));
    }
  }, [connectedAddress, fetchBalance]); // No more ESLint warning

  return (
    <div>
      <h2>Connected Address: {connectedAddress}</h2>
      {balance !== null ? <p>Updated Balance: {balance} Wei</p> : <p>No balance found. Please fund your channel.</p>}
    </div>
  );
};
