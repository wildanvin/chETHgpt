import { NextResponse } from "next/server";
import client from "../../../lib/mongodb";

// i am going to leave thir route so i can remember how to read from mongo

export async function GET() {
  try {
    const db = client.db("sample_mflix");
    const movies = await db.collection("movies").find({}).sort({ metacritic: -1 }).limit(10).toArray();

    return NextResponse.json(movies);
  } catch (error) {
    console.error("Error fetching movies:", error);
    return NextResponse.json({ error: "Error fetching movies" }, { status: 500 });
  }
}
