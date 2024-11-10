import client from "../../lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const newsroom = searchParams.get("newsroom");
  if (!newsroom) throw new Error("newsroom not specified");
  const db = client.db("relevance-ranking");
  const data = await db
    .collection("pressreleases")
    .find({
      newsroom: { $regex: newsroom, $options: "i" },
    })
    .toArray();
  return NextResponse.json(data);
}
