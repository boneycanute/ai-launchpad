"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";

export default function AgentsPage() {
  const dummyAgentUrl = "http://localhost:3000/<agent-id>";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
      <div className="text-center space-y-6 max-w-2xl mx-auto p-8">
        <div className="flex justify-center">
          <PartyPopper className="h-16 w-16" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">
          Congratulations! 🎉
        </h1>
        <p className="text-xl text-gray-600 mt-4">
          Your AI agent has been created successfully
        </p>
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-gray-500 mb-2">You can access your AI agent at:</p>
          <p className="text-[#39C3EF] font-mono break-all">{dummyAgentUrl}</p>
        </div>
        <div className="mt-8">
          <Button
            asChild
            className="bg-[#39C3EF] hover:bg-[#39C3EF]/90 text-white px-8 py-2 rounded-lg"
          >
            <Link href={dummyAgentUrl}>Go to Agent Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
