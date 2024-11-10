import client from "../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await client
    .db("relevance-ranking")
    .collection("articles")
    .find()
    .toArray();
  return NextResponse.json(data);
}
