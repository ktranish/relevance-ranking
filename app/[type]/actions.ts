"use server";

import { Pinecone } from "@pinecone-database/pinecone";
import client from "../lib/mongodb";
import { Journalist, JournalistScore, Pressrelease } from "../types";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

// Step 5.
export const getPressreleasesByNewsroom = async (newsroom: string) =>
  JSON.parse(
    JSON.stringify(
      await client
        .db("relevance-ranking")
        .collection<Pressrelease>("pressreleases")
        .find({
          newsroom: { $regex: newsroom, $options: "i" },
        })
        .limit(10)
        .toArray(),
    ),
  ) as Pressrelease[];

export const searchForRelevantJournalists = async (
  pressreleases: Pressrelease[],
) => {
  const model = "multilingual-e5-large";

  // Step 6.
  const embeddings = await pc.inference.embed(
    model,
    pressreleases.map((d) => d.headline + "-" + d.newsroom + "-" + d.text),
    { inputType: "query", truncate: "END" },
  );

  // Step 7.
  const vector = embeddings
    .map((embedding) => embedding.values)
    .reduce(
      (acc, curr) => acc.map((num, idx) => num + curr?.[idx]),
      new Array(embeddings[0].values?.length).fill(0),
    )
    .map((sum) => sum / embeddings.length);

  const articles = await pc.index("example-index").query({
    topK: 10, // Assuming we restrict amount of journalist to 10 visible at a time
    vector,
    includeMetadata: true,
  });

  // Step 8.
  const relevanceByJournalist = articles.matches.reduce(
    (acc: Record<string, JournalistScore>, match) => {
      const metadata = match.metadata;
      const score = match.score;

      // Ensure metadata exists, contains journalist_email, and score is defined
      if (
        metadata &&
        typeof metadata.journalist_email === "string" &&
        typeof score === "number"
      ) {
        const journalistEmail = metadata.journalist_email;

        // Initialize the score object if it doesn't exist
        if (!acc[journalistEmail]) {
          acc[journalistEmail] = { totalScore: 0, count: 0 };
        }

        // Accumulate the score and count for each journalist
        acc[journalistEmail].totalScore += score;
        acc[journalistEmail].count += 1;
      }

      return acc;
    },
    {} as Record<string, JournalistScore>,
  );

  // Step 9.
  const journalistRelevanceScores = Object.entries(relevanceByJournalist).map(
    ([email, data]) => ({
      journalist_email: email,
      relevance_score: data.totalScore / data.count,
    }),
  );

  // Step 10.
  const pressReleaseContent = pressreleases
    .map((pr) => `${pr.headline} - ${pr.newsroom}: ${pr.text}`)
    .join("\n");

  const prompts = journalistRelevanceScores.map(
    ({ journalist_email, relevance_score }) => ({
      prompt: `Based on the following press releases:\n${pressReleaseContent}\nExplain why journalist with email ${journalist_email}, who has a relevance score of ${relevance_score}, is a relevant match for this content. Provide a clear reason based on the similarity between the journalist's focus and the press release topics.`,
      email: journalist_email,
      relevance_score,
    }),
  );

  // Send each prompt to the OpenAI model
  const journalists = await Promise.all(
    prompts.map(async ({ prompt, email, relevance_score }) => {
      const response = await openai.completions.create({
        model: "gpt-3.5-turbo-instruct",
        prompt,
        max_tokens: 100,
      });
      return {
        email,
        motivation: response.choices[0].text.trim(),
        relevance_score,
      };
    }),
  );

  return journalists as Journalist[];
};
