import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-black text-neon">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-white">Page Not Found</h2>
        <p className="mt-3 text-gray-400">
          This page doesn&apos;t exist in the arcade. Maybe it was a ghost level?
        </p>
        <div className="mt-8">
          <Link href="/" className="btn-primary">
            Back to Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
