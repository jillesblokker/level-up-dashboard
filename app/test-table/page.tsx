"use client";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignIn, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  BarChart3,
  TrendingUp
} from "lucide-react";

export default function TestTablePage() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testAction, setTestAction] = useState<string>("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

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

  const executeTestAction = async () => {
    if (!testAction) return;
    
    setTestLoading(true);
    setTestResult(null);
    
    try {
      const token = await getToken();
      if (!token) throw new Error("No Clerk token");

      let endpoint = "";
      let method = "GET";
      
      switch (testAction) {
        case "refresh-kingdom-stats":
          endpoint = "/api/kingdom-stats?tab=quests&period=month";
          break;
        case "refresh-kingdom-gains":
          endpoint = "/api/kingdom-stats?tab=gold&period=month";
          break;
        case "force-refresh-all":
          endpoint = "/api/force-refresh-kingdom-stats";
          method = "POST";
          break;
        case "test-quest-completion":
          endpoint = "/api/quests";
          break;
        case "test-challenge-completion":
          endpoint = "/api/challenges";
          break;
        case "test-milestone-completion":
          endpoint = "/api/milestones";
          break;
        default:
          throw new Error("Unknown test action");
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      setTestResult({
        success: response.ok,
        status: response.status,
        data: result,
        endpoint,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Supabase Test Table</h1>
        <div>Loading Clerk...</div>
      </main>
    );
  }

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="w-8 h-8 text-amber-500" />
        <h1 className="text-3xl font-bold">Database Testing & Debugging</h1>
      </div>

      <SignedIn>
        {/* Testing Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Testing Actions
            </CardTitle>
            <CardDescription>
              Select an action to test database connections and force data refreshes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={testAction} onValueChange={setTestAction}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="Select a test action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="refresh-kingdom-stats">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Refresh Kingdom Stats from Supabase
                    </div>
                  </SelectItem>
                  <SelectItem value="refresh-kingdom-gains">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Refresh Kingdom Gains from Supabase
                    </div>
                  </SelectItem>
                  <SelectItem value="force-refresh-all">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Force Refresh ALL Kingdom Data
                    </div>
                  </SelectItem>
                  <SelectItem value="test-quest-completion">
                    Test Quest Completion Table
                  </SelectItem>
                  <SelectItem value="test-challenge-completion">
                    Test Challenge Completion Table
                  </SelectItem>
                  <SelectItem value="test-milestone-completion">
                    Test Milestone Completion Table
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={executeTestAction}
                disabled={!testAction || testLoading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {testLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Execute Test
              </Button>
            </div>

            {/* Test Results */}
            {testResult && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-semibold">
                    {testResult.success ? "Test Successful" : "Test Failed"}
                  </span>
                  <Badge variant={testResult.success ? "default" : "destructive"}>
                    {testResult.status || "Error"}
                  </Badge>
                </div>
                
                <Alert>
                  <AlertDescription className="font-mono text-sm">
                    <div className="mb-2">
                      <strong>Endpoint:</strong> {testResult.endpoint || "N/A"}
                    </div>
                    <div className="mb-2">
                      <strong>Timestamp:</strong> {testResult.timestamp}
                    </div>
                    <div className="mb-2">
                      <strong>Response:</strong>
                    </div>
                    <pre className="bg-gray-900 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                      {JSON.stringify(testResult.data || testResult.error, null, 2)}
                    </pre>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Original Data Display */}
        <Card>
          <CardHeader>
            <CardTitle>Supabase Test Table Data</CardTitle>
            <CardDescription>
              Raw data from the test-table API endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <div>Loading...</div>}
            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Error: {error}</AlertDescription>
              </Alert>
            )}
            {data.length > 0 && (
              <pre className="bg-gray-900 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </SignedIn>
      
      <SignedOut>
        <SignIn />
      </SignedOut>
    </main>
  );
} 