"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Monitor, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"

interface StatusItem {
  key: string
  label: string
  description: string
  status: "working" | "error" | "loading" | "empty"
  errorMessage?: string | undefined
}

type TableRow = { table_name: string };

export default function ServerChecksPage() {
  const [statuses, setStatuses] = useState<StatusItem[]>([
    { key: "realm", label: "Realm Map", description: "Tiles and map data are saved to Supabase.", status: "loading" },
    { key: "quests", label: "Quests", description: "Quest progress and completion are saved to Supabase (QuestCompletion table).", status: "loading" },
  ])
  const [tableList, setTableList] = useState<{ name: string, status: string }[]>([]);
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const runChecks = async () => {
    setRefreshing(true);
    // Get user
    const { data: userData } = await supabase.auth.getUser();
    setUser(userData?.user || null);

    // Check Realm Map
    const realmRes = await supabase.from("realm_grids").select("id").limit(1);
    setStatuses((prev) => prev.map(item => item.key === "realm"
      ? { ...item, status: realmRes.error ? "error" : (realmRes.data && realmRes.data.length === 0 ? "empty" : "working"), errorMessage: realmRes.error?.message }
      : item
    ));

    // Check Quests (QuestCompletion table)
    const questRes = await supabase.from("QuestCompletion").select("*");
    setStatuses((prev) => prev.map(item => item.key === "quests"
      ? { ...item, status: questRes.error ? "error" : (questRes.data && questRes.data.length === 0 ? "empty" : "working"), errorMessage: questRes.error?.message }
      : item
    ));

    // Fetch all table names from Supabase (using the information_schema)
    const tableRes = await supabase.rpc('list_tables');
    if (!tableRes.error && Array.isArray(tableRes.data)) {
      // For each table, try a select to check access
      const checks = await Promise.all(tableRes.data.map(async (row: TableRow) => {
        const res = await supabase.from(row.table_name).select("id").limit(1);
        return { name: row.table_name, status: res.error ? "error" : "working" };
      }));
      setTableList(checks);
    } else {
      setTableList([]);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  return (
    <main aria-label="server-checks-section" className="min-h-screen bg-black text-white flex flex-col items-center py-12">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Server Checks</h1>
        <div className="flex flex-col items-center gap-2">
          {user && (
            <div className="text-sm text-gray-400" aria-label="current-user-info">
              <span>Logged in as: <span className="text-amber-400">{user.email || user.id}</span></span>
            </div>
          )}
          <Button aria-label="refresh-server-checks" onClick={runChecks} disabled={refreshing} className="mt-2">
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        <ul aria-label="server-checks-list" className="space-y-4">
          {statuses.map((item) => (
            <li key={item.key}>
              <Card aria-label={`${item.label}-card`} className="flex flex-col md:flex-row items-center gap-4 p-6 bg-gradient-to-b from-gray-900 to-black border-amber-800/20">
                <CardHeader className="flex flex-row items-center gap-4 p-0">
                  <Monitor className="h-8 w-8 text-amber-500" aria-hidden="true" />
                  <CardTitle className="text-xl font-serif text-white">{item.label}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-2 p-0">
                  <div className="flex items-center gap-2">
                    {item.status === "working" && <CheckCircle className="h-5 w-5 text-green-500" aria-label="Working" />}
                    {item.status === "error" && <XCircle className="h-5 w-5 text-red-500" aria-label="Error" />}
                    {item.status === "loading" && <span className="h-5 w-5 animate-spin border-2 border-amber-500 rounded-full border-t-transparent" aria-label="Loading" />}
                    {item.status === "empty" && <span className="h-5 w-5 text-amber-400" aria-label="No Data">!</span>}
                    <Badge className={
                      item.status === "working" ? "bg-green-600" :
                      item.status === "error" ? "bg-red-600" :
                      item.status === "empty" ? "bg-amber-600" :
                      "bg-amber-500"
                    }>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-gray-300 text-sm mt-1">{item.description}</div>
                  {item.status === "error" && item.errorMessage && (
                    <div className="text-red-400 text-xs mt-1" aria-label="error-message">{item.errorMessage}</div>
                  )}
                  {item.status === "empty" && (
                    <div className="text-amber-400 text-xs mt-1" aria-label="no-data-warning">No data found in this table.</div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4 text-center">Database Tables</h2>
          <ul aria-label="database-tables-list" className="bg-gray-900 rounded-lg p-4 flex flex-wrap gap-2 justify-center">
            {tableList.length > 0 ? (
              tableList.map((table) => (
                <li key={table.name} className={`px-3 py-1 rounded text-sm ${table.status === "working" ? "bg-amber-800/20 text-amber-200" : "bg-red-800/40 text-red-200"}`} aria-label={`table-${table.name}`}>{table.name} {table.status === "error" && <XCircle className="inline h-4 w-4 ml-1 text-red-400" aria-label="Error" />}</li>
              ))
            ) : (
              <li className="text-gray-400">Loading table list...</li>
            )}
          </ul>
        </div>
      </div>
    </main>
  )
} 