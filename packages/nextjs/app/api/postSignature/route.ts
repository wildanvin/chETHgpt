import { NextResponse } from "next/server";
import client from "../../../lib/mongodb";

export async function POST(req: Request) {
  try {
    const { address, signature, updatedBalance } = await req.json();

    if (!address || !signature || updatedBalance === undefined) {
      return NextResponse.json({ error: "Address, signature, and balance are required" }, { status: 400 });
    }

    const db = client.db("signaturesDB");
    const signaturesCollection = db.collection("signatures");

    // Store the signature, balance, and address
    const result = await signaturesCollection.insertOne({ address, signature, updatedBalance });

    return NextResponse.json({ message: "Signature stored", signatureId: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("Error storing signature:", error);
    return NextResponse.json({ error: "Error storing signature" }, { status: 500 });
  }
}
