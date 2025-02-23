import { useState } from "react";

export const UserForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submitUser = async () => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    const data = await response.json();
    console.log(data);
  };

  return (
    <div>
      <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={submitUser}>Submit</button>
    </div>
  );
};
