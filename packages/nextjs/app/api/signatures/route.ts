import { NextResponse } from "next/server";
import client from "../../../lib/mongodb";

// adjust if your path differs

/** GET /api/signatures
 *  Returns every document in the `signatures` collection
 *  sorted by newest first.
 */
export async function GET() {
  try {
    const db = client.db("signaturesDB");
    const signatures = db.collection("signatures");

    const all = await signatures
      .find({})
      .sort({ _id: -1 }) // newest first
      .toArray();

    return NextResponse.json(all, { status: 200 });
  } catch (err) {
    console.error("Error fetching signatures:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
