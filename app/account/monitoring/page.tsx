'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseMonitor } from '@/lib/monitoring';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  userId?: string;
  error?: string;
}

interface SecurityEvent {
  type: string;
  details: string;
  timestamp: Date;
  userId?: string;
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    const fetchData = () => {
      setMetrics(supabaseMonitor.getMetrics());
      setEvents(supabaseMonitor.getSecurityEvents());
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    return `${ms.toFixed(2)}ms`;
  };

  return (
    <main className="container mx-auto p-4" aria-label="monitoring-dashboard">
      <h1 className="text-2xl font-bold mb-4">System Monitoring</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile tab selector */}
        <div className="mb-4 md:hidden">
          <label htmlFor="monitoring-tab-select" className="sr-only">Select monitoring tab</label>
          <select
            id="monitoring-tab-select"
            aria-label="Monitoring tab selector"
            className="w-full rounded-md border border-amber-800/20 bg-black text-white p-2"
            value={activeTab}
            onChange={e => setActiveTab(e.target.value)}
          >
            <option value="performance">Performance Metrics</option>
            <option value="security">Security Events</option>
          </select>
        </div>
        <TabsList className="grid w-full grid-cols-2 hidden md:grid" aria-label="monitoring-tabs">
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card className="p-4" aria-label="performance-metrics-card">
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            <ScrollArea className="h-[600px]" aria-label="performance-metrics-scroll-area">
              <div className="space-y-4">
                {metrics.map((metric, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg"
                    aria-label="performance-metric-item"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">Operation</p>
                        <p>{metric.operation}</p>
                      </div>
                      <div>
                        <p className="font-medium">Duration</p>
                        <p>{formatDuration(metric.duration)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Timestamp</p>
                        <p>{formatDate(metric.timestamp)}</p>
                      </div>
                      {metric.userId && (
                        <div>
                          <p className="font-medium">User ID</p>
                          <p>{metric.userId}</p>
                        </div>
                      )}
                      {metric.error && (
                        <div className="col-span-2">
                          <p className="font-medium text-red-500">Error</p>
                          <p className="text-red-500">{metric.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-4" aria-label="security-events-card">
            <h2 className="text-xl font-semibold mb-4">Security Events</h2>
            <ScrollArea className="h-[600px]" aria-label="security-events-scroll-area">
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg"
                    aria-label="security-event-item"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">Event Type</p>
                        <p>{event.type}</p>
                      </div>
                      <div>
                        <p className="font-medium">Timestamp</p>
                        <p>{formatDate(event.timestamp)}</p>
                      </div>
                      {event.userId && (
                        <div>
                          <p className="font-medium">User ID</p>
                          <p>{event.userId}</p>
                        </div>
                      )}
                      <div className="col-span-2">
                        <p className="font-medium">Details</p>
                        <p>{event.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
} 