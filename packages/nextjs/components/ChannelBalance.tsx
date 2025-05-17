import { formatEther } from "viem";
import { useChannelBalance } from "~~/app/hooks/useChannelBalance";

export const ChannelBalance = ({ connectedAddress }: { connectedAddress: string | undefined }) => {
  const { balance, loading } = useChannelBalance(connectedAddress);

  const balanceEth = balance !== null ? Number(formatEther(balance)).toLocaleString() : null;
  return (
    <div className="w-full max-w-xs rounded-xl bg-base-200 p-4 shadow-lg text-center">
      {loading ? (
        <p className="animate-pulse text-secondary">Loading balance…</p>
      ) : balanceEth !== null ? (
        <>
          <p className="text-sm text-base-content/70 mb-1">Channel balance</p>
          <p className="text-3xl font-extrabold ">{balanceEth} ETH</p>
        </>
      ) : (
        <p className="text-error">
          No balance found. <br /> Please fund your channel.
        </p>
      )}
    </div>
  );
};
