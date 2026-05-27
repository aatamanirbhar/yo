import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-display font-bold mb-3">404</h1>
      <p className="text-gray-600 mb-6">
        We couldn&apos;t find that page.
      </p>
      <Link href="/" className="btn-primary">Back to home</Link>
    </div>
  );
}
