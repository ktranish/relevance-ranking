"use server";

import { EmbeddingsList, Pinecone } from "@pinecone-database/pinecone";
import { Article, Pressrelease } from "./types";
import client from "./lib/mongodb";
import { ObjectId, OptionalId } from "mongodb";
import fs from "fs";
import csvParser from "csv-parser";
import path from "path";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

// Step 1,
export const seedMongoDB = async () => {
  const db = client.db("relevance-ranking");

  const loadCSVtoMongo = async (filePath: string, collectionName: string) => {
    const collection = db.collection(collectionName);
    const dataArray: OptionalId<Document>[] = [];

    return new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (data) => dataArray.push(data))
        .on("end", async () => {
          try {
            const insertResult = await collection.insertMany(dataArray);
            console.log(
              `${insertResult.insertedCount} records inserted into ${collectionName}.`,
            );
            resolve();
          } catch (error) {
            console.error(
              `Error inserting records into ${collectionName}:`,
              error,
            );
            reject(error);
          }
        });
    });
  };

  // Load each CSV file
  await loadCSVtoMongo(
    path.join(process.cwd(), "data/fake_articles.csv"),
    "articles",
  );
  await loadCSVtoMongo(
    path.join(process.cwd(), "data/fake_pressreleases.csv"),
    "pressreleases",
  );

  await generateEmbeddings();
};

// Step 2.
export const generateEmbeddings = async () => {
  const articles = await client
    .db("relevance-ranking")
    .collection<Article>("articles")
    .find()
    .toArray();

  const model = "multilingual-e5-large";

  const embeddings = await pc.inference.embed(
    model,
    articles.map(
      (item) => item.headline + " - " + item.outlet_name + " - " + item.text,
    ),
    {
      inputType: "passage",
      truncate: "END",
    },
  );
  await upsertEmbeddings(articles, embeddings);
  await updateArticles(articles, embeddings);
};

// Step 3.
export const upsertEmbeddings = async (
  articles: Article[],
  embeddings: EmbeddingsList,
) => {
  const index = await pc.createIndex({
    dimension: 1024,
    name: "example-index",
    spec: {
      serverless: {
        cloud: "aws",
        region: "us-east-1",
      },
    },
    deletionProtection: "disabled",
  });

  if (!index) {
    throw new Error("Failed to create index");
  }

  const records = articles.map((d, i) => ({
    id: d._id,
    values: embeddings[i].values ?? [],
    metadata: {
      _id: d._id,
      journalist_email: d.journalist_email,
      headline: d.headline,
      outlet_name: d.outlet_name,
      text: d.text,
    },
  }));

  await pc.Index("example-index").upsert(records);
};

// Step 4.
export const updateArticles = async (
  articles: Article[],
  embeddings: EmbeddingsList,
) => {
  for (const [index, { _id, ...data }] of articles.entries()) {
    await client
      .db("relevance-ranking")
      .collection("articles")
      .updateOne(
        {
          _id: new ObjectId(_id),
        },
        {
          $set: {
            ...data,
            embeddings: embeddings[index].values,
          },
        },
      );
  }
};

export const getArticles = async () =>
  JSON.parse(
    JSON.stringify(
      await client
        .db("relevance-ranking")
        .collection("articles")
        .find()
        .toArray(),
    ) ?? null,
  ) as Article[];

export const getNewsrooms = async () =>
  JSON.parse(
    JSON.stringify(
      (
        await client
          .db("relevance-ranking")
          .collection<Pressrelease>("pressreleases")
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
          .toArray()
      )[0],
    ) ?? null,
  ) as { newsrooms: string[] };
