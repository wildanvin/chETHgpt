import { NextResponse } from "next/server";
import client from "../../../lib/mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const db = client.db("signaturesDB");
    const signaturesCollection = db.collection("signatures");

    // Check if an entry exists for the given address
    const user = await signaturesCollection.findOne({ address });

    if (!user) {
      return NextResponse.json({ error: "Open a channel first" }, { status: 404 });
    }

    return NextResponse.json({ updatedBalance: user.updatedBalance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json({ error: "Error fetching balance" }, { status: 500 });
  }
}
