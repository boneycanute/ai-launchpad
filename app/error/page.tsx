"use client";

import { useSearchParams } from "next/navigation";
import { IconAlertCircle } from "@tabler/icons-react";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "An unknown error occurred";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex flex-col items-center max-w-md text-center space-y-4">
        <IconAlertCircle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">
          Agent Creation Failed
        </h1>
        <p className="text-gray-600">{error}</p>
        <a
          href="/create"
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-black-600 transition-colors"
        >
          Try Again
        </a>
      </div>
    </div>
  );
}
