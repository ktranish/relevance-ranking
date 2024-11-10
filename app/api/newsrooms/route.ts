import client from "../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await client
    .db("relevance-ranking")
    .collection("pressreleases")
    .aggregate([
      {
        $group: {
          _id: null,
          newsrooms: { $addToSet: "$newsroom" },
        },
      },
      {
        $project: {
          _id: 0,
          newsrooms: 1,
        },
      },
    ])
    .toArray();
  return NextResponse.json(data);
}
