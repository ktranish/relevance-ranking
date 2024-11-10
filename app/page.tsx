"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";
import { seedMongoDB } from "./actions";
import { Article } from "./types";

export default function Home() {
  const queryClient = useQueryClient();

  const articles = useQuery({
    queryKey: ["articles"],
    queryFn: async () =>
      (await (
        await fetch(process.env.NEXT_PUBLIC_URL + "/api/articles")
      ).json()) as Article[],
  });

  const newsrooms = useQuery({
    queryKey: ["newsrooms"],
    queryFn: async () =>
      (
        await (
          await fetch(process.env.NEXT_PUBLIC_URL + "/api//newsrooms")
        ).json()
      )[0] as { newsrooms: string[] },
  });

  const { mutateAsync } = useMutation({
    mutationFn: seedMongoDB,
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["articles"],
      });
      queryClient.invalidateQueries({
        queryKey: ["newsrooms"],
      });
    },
  });

  const handleOnClick = async () => {
    toast.promise(mutateAsync(), {
      error: (err) =>
        err.message ? err.message : "Oh no, something went wrong",
      loading: "Loading...",
      success: "Embeddings have been generated",
    });
  };

  if (articles.error || newsrooms.error)
    console.log({
      articles: articles.error,
      newsrooms: newsrooms.error,
    });

  if (articles.isLoading || newsrooms.isLoading) return <></>;

  return (
    <div className="relative isolate h-screen overflow-hidden bg-gray-900">
      <svg
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
      >
        <defs>
          <pattern
            x="50%"
            y={-1}
            id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
            width={200}
            height={200}
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 200V.5H200" fill="none" />
          </pattern>
        </defs>
        <svg x="50%" y={-1} className="overflow-visible fill-gray-800/20">
          <path
            d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
            strokeWidth={0}
          />
        </svg>
        <rect
          fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)"
          width="100%"
          height="100%"
          strokeWidth={0}
        />
      </svg>
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl shrink-0 lg:mx-0 lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <Link
              href="https://github.com/ktranish/assignment-journalist-relevance"
              target="_blank"
              className="inline-flex space-x-6"
            >
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-sm/6 font-semibold text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                Relevance ranking
              </span>
              <span className="inline-flex items-center space-x-2 text-sm/6 font-medium text-gray-300">
                <span>Just shipped v1.0</span>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="h-5 w-5 text-gray-500"
                />
              </span>
            </Link>
          </div>
          <h1 className="mt-10 text-pretty text-5xl font-semibold tracking-tight text-white sm:text-7xl">
            My solution to the assigment
          </h1>
          <p className="mt-8 text-pretty text-lg font-medium text-gray-400 sm:text-xl/8">
            Open README.md for a detailed explaination on my throught process
            and methodology for this assignment.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6">
            {!articles.data ||
            !newsrooms.data ||
            articles.data?.find((item) => !item.embeddings) ? (
              <button
                type="button"
                onClick={handleOnClick}
                className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
              >
                Generate embeddings
              </button>
            ) : (
              <>
                {newsrooms.data?.newsrooms?.map((item, index) => (
                  <Link
                    key={index}
                    href={`/newsroom/${item.toLowerCase()}`}
                    className="text-sm/6 font-semibold text-white"
                  >
                    {item} <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
