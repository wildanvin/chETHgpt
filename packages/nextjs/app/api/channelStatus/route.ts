import { NextResponse } from "next/server";
import client from "../../../lib/mongodb";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

  const db = client.db("signaturesDB");
  const doc = await db.collection("signatures").findOne({ address });

  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { isChannelChallenged = false, isChannelDefunded = false, challengedAt = 0 } = doc as any;
  return NextResponse.json({ isChannelChallenged, isChannelDefunded, challengedAt }, { status: 200 });
}
