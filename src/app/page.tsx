import { APP_DESCRIPTION, APP_NAME } from "@/config/constants";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{APP_NAME}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">{APP_DESCRIPTION}</p>
        <div className="pt-4 flex justify-center gap-4">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
            Phase 0: Engineering Foundations Ready
          </span>
        </div>
      </div>
    </main>
  );
}
