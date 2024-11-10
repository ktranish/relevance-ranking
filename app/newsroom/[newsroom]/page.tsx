"use client";

import {
  ArrowLeftCircleIcon,
  ChevronRightIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { notFound } from "next/navigation";
import React, { useState } from "react";
import { Journalist, Pressrelease } from "../../types";
import { searchForRelevantJournalists } from "./actions";

export default function Page({
  params,
}: {
  params: Promise<{ newsroom: string }>;
}) {
  const { newsroom } = React.use(params);

  const [journalists, setJournalists] = useState<Journalist[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["newsroom", newsroom],
    queryFn: async () =>
      (await (
        await fetch(
          process.env.NEXT_PUBLIC_URL +
            "/api/pressreleases?newsroom=" +
            newsroom,
        )
      ).json()) as Pressrelease[],
    enabled: !!newsroom,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (pressreleases: Pressrelease[]) =>
      searchForRelevantJournalists(pressreleases),
    onSuccess: (data) => setJournalists(data),
  });

  const handleOnClick = async () => {
    if (!data) return;
    mutate(data);
  };

  if (error) console.log(error);

  if (isLoading || error) return <></>;

  if ((!data && !isLoading) || (!data?.length && !isLoading)) notFound();

  return (
    <div className="relative isolate h-full min-h-screen bg-gray-900">
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
          <Link href="/">
            <ArrowLeftCircleIcon className="h-6 w-6 text-white" />
          </Link>
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
            {newsroom[0].toUpperCase() + newsroom.slice(1)}
          </h1>
          <p className="mt-8 text-pretty text-lg font-medium text-gray-400 sm:text-xl/8">
            Open README.md for a detailed explaination on my throught process
            and methodology for this assignment.
          </p>
          <hr className="my-6 border-gray-700" />
          <h4 className="text-2xl font-semibold text-white">
            Recommended journalists
          </h4>
          {!journalists.length && (
            <button
              type="button"
              onClick={handleOnClick}
              className="mt-8 flex items-center gap-x-3 rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              Generate journalists
              {isPending && (
                <svg
                  className="h-5 w-5 text-gray-300 motion-safe:animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
            </button>
          )}
          <ul className="mt-8 flex flex-col gap-8">
            {journalists.map((item, index) => (
              <li
                key={index}
                className="col-span-1 divide-y divide-gray-700 rounded-lg bg-gray-800 shadow"
              >
                <div className="flex w-full items-center justify-between space-x-6 p-6">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="truncate text-sm font-medium text-white">
                        {item.email}
                      </h3>
                      <span className="inline-flex shrink-0 items-center rounded-full bg-green-700 px-1.5 py-0.5 text-xs font-medium text-green-50 ring-1 ring-inset ring-green-600/20">
                        {(item.relevance_score * 100).toFixed(0)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.motivation}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="-mt-px flex divide-x divide-gray-200">
                    <div className="flex w-0 flex-1">
                      <a
                        href={`mailto:${item.email}`}
                        className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-white"
                      >
                        <EnvelopeIcon
                          aria-hidden="true"
                          className="h-5 w-5 text-white"
                        />
                        Email
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
