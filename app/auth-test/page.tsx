"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authenticatedFetch } from "@/lib/auth-helpers";

export default function AuthTestPage() {
  const { getToken, isLoaded } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result2, setResult2] = useState<any>(null);
  const [loading2, setLoading2] = useState(false);

  const runAuthTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Get Clerk token
      const token = await getToken();
      
      if (!token) {
        setResult({ error: "No Clerk token available" });
        return;
      }

      console.log("Making auth test request with token:", token.slice(0, 20) + "...");

      // Call the auth-quick-test endpoint with proper authentication
      const response = await fetch("/api/auth-quick-test", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setResult(data);

    } catch (error) {
      setResult({ 
        error: "Request failed", 
        details: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setLoading(false);
    }
  };

  const runAuthTestWithHelper = async () => {
    setLoading2(true);
    setResult2(null);
    
    try {
      console.log("Making auth test request with authenticatedFetch helper...");

      // Use the authenticatedFetch helper
      const response = await authenticatedFetch("/api/auth-quick-test", {}, "Auth Test");

      if (!response) {
        setResult2({ error: "authenticatedFetch returned null (likely auth error)" });
        return;
      }

      const data = await response.json();
      setResult2(data);

    } catch (error) {
      setResult2({ 
        error: "Request failed", 
        details: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setLoading2(false);
    }
  };

  if (!isLoaded) {
    return <div>Loading Clerk...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
          <CardDescription>
            Test the authentication flow with proper headers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runAuthTest} disabled={loading}>
              {loading ? "Testing..." : "Run Direct Auth Test"}
            </Button>
            <Button onClick={runAuthTestWithHelper} disabled={loading2} variant="outline">
              {loading2 ? "Testing..." : "Run Helper Auth Test"}
            </Button>
          </div>
          
          {result && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Direct Test Result:</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          {result2 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Helper Test Result:</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(result2, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 