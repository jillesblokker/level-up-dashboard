"use client";
import { useEffect, useState } from "react";

export default function TestTablePage() {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/test-table")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Test Table</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      <pre className="bg-gray-100 p-4 rounded mt-4">{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
} 