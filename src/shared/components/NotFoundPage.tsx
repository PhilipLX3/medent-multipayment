import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-xl text-gray-600">ページが見つかりません</p>
        <div className="mt-6">
          <Link
            href="/"
            className="text-base font-medium text-primary-600 hover:text-primary-500"
          >
            ホームに戻る <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}