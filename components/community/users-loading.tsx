
export function UsersLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 h-48 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-gray-200"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
