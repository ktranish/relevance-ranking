# My Solution

## Problem statement

Given two types of datasets, one being articles and one being pressreleases from newsrooms. How can we rate each journalist based on the pressreleases provided from the newsrooms and how can we develop a ranking system that presents the most suitable journalists based on their relevance score?

## Purpose

> The goal is to enable users to easily identify and select journalists who are the best fit for specific newsrooms.

## Approach

I'd like to propose that we add 2 new fields to the article table. One of the fields will be reserved for the embeddings of each article, which we can store as number arrays. This means that during the retrieval process of new articles, we include a process of which we convert the fields we are interested in, into embeddings. Next I'd like to set up a cronjob, the interval is TBD (To Be Determined) but the idea is to have the embeddings sent to a vector database that will index our embeddings. My weapon of choice for this is Pinecone. The second field that I'd like to add is a flag for if an article has been sent to a vector database.

With that in mind. This is how I would set up the relevance score and ranking system. From retrieving new articles, to indexing them in a vector database to present relevant journalist to the users

1. Retrieve a new article from external source.
2. Convert relevant fields into embeddings and store them in the same article table.
3. Create a cron job that sends the embeddings into a vector database.
4. Register that the article has been sent through a flag field in the same article table.
5. Fetch pressrelease details when a user visits a newsroom (limit the amount of pressreleases fetched to 10)
6. Create an embedding on the pressreleases from that newsroom and use those embeddings to fetch articles on-demand by performing the search operation on the vector database. The vector database in turn will return a set of articles in the form of

```ts
ID
Similarity score
Metadata // when we send the embeddings to the vector database, we can specify certain metadata that we can later use to retrieve data from our own database
```

6. Query the articles from our own database (This may or may not include multiple articles from the same journalist)
7. Group results by journalist_email and calculate a relevance score for each journalist based on their associated articles.
8. Present them to the user in a form of a list that is set up with either or both pagination and filters
9. Cache the results to reduce workload from our side

If we want to include a short motivation for why the most relevant journalist was selected we can add an additional step to prompt an LLM and ask it why it would consider this journalist from this/these specific article/s to be relevant to that newsroom.

## Tech stack

- Next.js (Fullstack framework)
- MongoDB (DBMS)
- OpenAI (LLM)
- Pinecone (Vector Database)
- Tailwind CSS (Styling)
- Tanstack query (Data fetching)
- React hot toast (Notifications)

## Implementation

1. Import CSV data into MongoDB
2. Use Pinecone SDK to convert some of the article fields into embeddings and store them back into my MongoDB database
3. Upsert embeddings into a Pinecone index
4. Update article table with embeddings field
5. Fetch newsroom details based on which newsroom the user is in
6. Convert the pressreleases into embeddings to use in a similarity search query performed on the vector database
7. Perform the similarity search
8. Group results by journalist_email and calculate a relevance score for each journalist based on their associated articles.
9. Calculate the average relevance score for each journalist
10. Send the journalist + pressrelease details along with their metadata to Open AI in order to generate the motivation for each journalist

## Final result

[Demo link](https://relevance-ranking.vercel.app/)

## Design choices & parts left out

- Cronjob
- Pagination/Filter list
- Caching

## Prerequisites

1. Install pnpm `npm install -g pnpm`
2. Install MongoDB community server locally or set up a cluster on MongoDB Atlas
3. Create an account on Pinecone and retrieve an API key
4. Create an account on Open AI platform and retrieve an API key
5. Add the MongoDB connection URI, the Pinecone API key and the Open AI Api key to the .env.local file

## Usage

1. Clone the repo
2. Run pnpm install
3. Run pnpm dev
4. Generate embeddings on the first page
5. Navigate to a newsroom and click generate journalists

## Sources

1. [Generate embeddings with Pinecone SDK](https://docs.pinecone.io/guides/inference/generate-embeddings)
2. [Vector similarity search explained](https://www.pinecone.io/learn/vector-similarity/)

### FYI

I was under the impression that one might be able to self host a pinecone instance but I don't see that anywhere being verified. However I'm not sure vector data and meta data are under the GDPR legislation. In any case I'd like to raise my concern regarding this, but I'm optimistic and don't believe it will impact our business as I'm sure we have railguards in place for other instances similar to this when we are working with our customer's data.
