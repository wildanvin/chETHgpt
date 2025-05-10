import { NextResponse } from "next/server";
import client from "../../../lib/mongodb";

// adjust the relative path if needed

/**
 *
 *
 * Body: { address: string, updatedBalance: string, signature?: string }
 *
 * ‑ looks up the document by `address`
 * ‑ overwrites the `updatedBalance`
 * ‑ (optionally) stores a *new* signature if you pass one
 */
export async function PUT(req: Request) {
  try {
    const { address, updatedBalance, signature } = await req.json();

    if (!address || updatedBalance === undefined) {
      return NextResponse.json({ error: "address and updatedBalance are required" }, { status: 400 });
    }

    const db = client.db("signaturesDB");
    const signatures = db.collection("signatures");

    // build the $set object dynamically so we don’t clobber other fields
    const $set: Record<string, unknown> = { updatedBalance };
    if (signature) $set.signature = signature;

    const result = await signatures.updateOne(
      { address }, // filter
      { $set }, // update
      { upsert: false }, // don’t create a new doc if it doesn’t exist
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Channel not found for that address" }, { status: 404 });
    }

    return NextResponse.json({ message: "Balance updated" }, { status: 200 });
  } catch (err) {
    console.error("Error updating balance:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
