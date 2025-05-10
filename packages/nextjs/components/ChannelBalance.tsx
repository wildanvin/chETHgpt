import { useChannelBalance } from "~~/app/hooks/useChannelBalance";

export const ChannelBalance = ({ connectedAddress }: { connectedAddress: string | undefined }) => {
  const { balance, loading } = useChannelBalance(connectedAddress);

  return (
    <div>
      <h2>Connected Address: {connectedAddress}</h2>
      {loading && <p>Loading balance…</p>}
      {!loading && balance !== null && <p>Updated Balance: {balance.toString()} wei</p>}
      {!loading && balance === null && <p>No balance found. Please fund your channel.</p>}
    </div>
  );
};
