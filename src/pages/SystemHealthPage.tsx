import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Server, 
  Clock, 
  Cpu, 
  ShieldCheck, 
  RotateCw, 
  Zap, 
  Terminal,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function SystemHealthPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchHealth = () => {
    api.get('/system/health')
      .then((res) => {
        setData(res);
        setLastRefreshed(new Date());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Activity className="h-8 w-8 text-brand-600 animate-pulse" />
        <p className="text-slate-500 font-medium">Querying telemetry & node metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl" />
        
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Live Production Telemetry
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight">
            EduVision System Observability
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Node.js process internals, V8 memory distribution, correlation IDs, and request latency tracing.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Button 
            onClick={fetchHealth}
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold h-10 px-4 gap-2 text-xs"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Status */}
        <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                SLA 99.9%
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-slate-900">{data?.status || 'OPERATIONAL'}</div>
              <p className="text-xs text-slate-500 mt-0.5">Engine: Node {data?.nodeVersion}</p>
            </div>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                Process Uptime
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatUptime(data?.uptimeSeconds || 0)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Continuous execution</p>
            </div>
          </CardContent>
        </Card>

        {/* Memory RSS */}
        <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Cpu className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
                Memory (RSS)
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-slate-900 font-mono">
                {data?.memory?.rssMb} MB
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Heap Used: {data?.memory?.heapUsedMb} MB
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Latency */}
        <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Avg Latency
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-slate-900 font-mono">
                {data?.metrics?.avgLatencyMs} ms
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {data?.metrics?.status2xx} OK / {data?.metrics?.status4xx || 0} Warn
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Trace Logs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Recent HTTP Request Traces (X-Correlation-ID)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Auto-synced every 5s • Last: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>

        <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-sm bg-white">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 text-xs font-mono">
              <div className="p-3 bg-slate-50 font-bold text-slate-500 grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wider">
                <span className="col-span-2">Trace ID</span>
                <span className="col-span-2">Method</span>
                <span className="col-span-5">Endpoint Route</span>
                <span className="col-span-1 text-center">Status</span>
                <span className="col-span-2 text-right">Latency</span>
              </div>

              {data?.recentLogs?.map((log: any, idx: number) => {
                const is2xx = log.status >= 200 && log.status < 300;
                return (
                  <div key={idx} className="p-3 grid grid-cols-12 gap-2 items-center hover:bg-slate-50/80 transition-colors">
                    <span className="col-span-2 font-bold text-slate-500 truncate">
                      {log.id}
                    </span>
                    <span className="col-span-2">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                        log.method === 'GET' ? "bg-blue-50 text-blue-700" :
                        log.method === 'POST' ? "bg-emerald-50 text-emerald-700" :
                        log.method === 'PUT' ? "bg-amber-50 text-amber-700" :
                        "bg-rose-50 text-rose-700"
                      )}>
                        {log.method}
                      </span>
                    </span>
                    <span className="col-span-5 text-slate-800 font-medium truncate">
                      {log.url}
                    </span>
                    <span className="col-span-1 text-center">
                      <span className={cn(
                        "font-bold px-1.5 py-0.5 rounded text-[10px]",
                        is2xx ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      )}>
                        {log.status}
                      </span>
                    </span>
                    <span className="col-span-2 text-right font-bold text-slate-600">
                      {log.durationMs}ms
                    </span>
                  </div>
                );
              })}

              {(!data?.recentLogs || data.recentLogs.length === 0) && (
                <div className="p-8 text-center text-slate-400 italic">
                  Awaiting incoming traffic traces.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
