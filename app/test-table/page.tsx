"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function TestTablePage() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    setLoading(true);
    getToken()
      .then((token) => {
        if (!token) throw new Error("No Clerk token");
        return fetch("/api/test-table", {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isLoaded, getToken]);

  if (!isLoaded) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Supabase Test Table</h1>
        <div>Loading...</div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Test Table</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
} 