import { NextResponse } from "next/server";
import client from "../../../lib/mongodb";

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const db = client.db("usersDB");
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Insert new user
    const result = await usersCollection.insertOne({ name, email });

    return NextResponse.json({ message: "User created", userId: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("Error inserting user:", error);
    return NextResponse.json({ error: "Error inserting user" }, { status: 500 });
  }
}
