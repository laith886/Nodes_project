import Link from "next/link";
import EstimationBot from "../components/EstimationBot";

export default function EstimationPage() {
  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black">
      <nav className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <Link
          href="/"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          &larr; Back to Canvas
        </Link>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Assignment 2 ? Software Estimation
        </span>
      </nav>

      <main className="flex-1 min-h-0 max-w-3xl w-full mx-auto">
        <EstimationBot />
      </main>
    </div>
  );
}
