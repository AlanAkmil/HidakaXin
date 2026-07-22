export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="skeleton h-12 rounded-full" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
