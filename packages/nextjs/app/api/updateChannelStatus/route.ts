import { NextResponse } from "next/server";
import client from "../../../lib/mongodb";

/** PUT /api/updateChannelStatus
 * Body: { address: string, isChannelChallenged?: boolean, isChannelDefunded?: boolean, challengedAt?: number }
 */
export async function PUT(req: Request) {
  try {
    const { address, ...flags } = await req.json();
    if (!address) {
      return NextResponse.json({ error: "address required" }, { status: 400 });
    }

    const db = client.db("signaturesDB");
    const signatures = db.collection("signatures");

    const $set: Record<string, unknown> = {};
    if (flags.isChannelChallenged !== undefined) $set.isChannelChallenged = flags.isChannelChallenged;
    if (flags.isChannelDefunded !== undefined) $set.isChannelDefunded = flags.isChannelDefunded;
    if (flags.challengedAt !== undefined) $set.challengedAt = flags.challengedAt;

    const res = await signatures.updateOne({ address }, { $set }, { upsert: false });
    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "channel not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Status updated" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
