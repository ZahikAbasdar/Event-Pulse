import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-6xl font-bold text-maroon-500">404</h1>
      <p className="mt-3 text-gray-500 dark:text-gray-400">Page not found.</p>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </div>
  );
}

export function Unauthorized() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-4xl font-bold text-maroon-500">Access denied</h1>
      <p className="mt-3 text-gray-500 dark:text-gray-400">You don't have permission to view this page.</p>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </div>
  );
}
