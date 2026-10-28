import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const latency = dataPoint.latencyMs;
    const status = dataPoint.status || (dataPoint.isUp ? 'UP' : 'DOWN');
    const timeFormatted = dataPoint.timestamp
      ? new Date(dataPoint.timestamp).toLocaleString()
      : label;

    return (
      <div className="bg-panel border border-subtle p-2.5 rounded shadow-lg text-xs font-mono text-text-primary">
        <div className="text-text-secondary text-[11px] mb-1">{timeFormatted}</div>
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">Latency:</span>
          <span className="font-semibold text-amber-brand tabular-nums">
            {latency !== null && latency !== undefined ? `${latency} ms` : 'Failed / N/A'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-text-secondary">Status:</span>
          <span
            className={`font-semibold ${
              status === 'UP' ? 'text-status-up' : 'text-status-down font-bold'
            }`}
          >
            {status}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export default function LatencyAreaChart({ data = [], isLoading = false, height = 260 }) {
  if (isLoading) {
    return (
      <div
        className="w-full bg-panel border border-subtle rounded-md p-6 flex flex-col items-center justify-center animate-pulse"
        style={{ height }}
        aria-label="Loading latency chart"
      >
        <div className="w-1/3 h-4 bg-subtle/40 rounded mb-4"></div>
        <div className="w-full h-3/4 bg-subtle/20 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="w-full bg-panel border border-subtle rounded-md p-6 flex flex-col items-center justify-center text-center font-mono"
        style={{ height }}
      >
        <span className="text-xs text-text-secondary">No telemetry records in selected time range</span>
        <span className="text-[11px] text-text-secondary/70 mt-1">
          Background pinger checks will populate time-series metrics
        </span>
      </div>
    );
  }

  // Format data for Recharts
  const chartPoints = data.map((item) => {
    const dateObj = new Date(item.checkedAt || item.timestamp);
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      time: timeStr,
      timestamp: item.checkedAt || item.timestamp,
      latencyMs: item.latencyMs,
      status: item.status,
      isUp: item.status === 'UP',
    };
  });

  return (
    <div className="w-full bg-panel border border-subtle rounded-md p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-primary">
            Response Time Trend
          </h3>
          <p className="text-[11px] font-mono text-text-secondary">
            Continuous round-trip network latency in milliseconds
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-text-secondary">
            <span className="w-2.5 h-0.5 bg-amber-brand"></span>
            Latency
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-subtle/40" />
            <XAxis
              dataKey="time"
              stroke="currentColor"
              className="text-text-secondary text-[10px] font-mono"
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              stroke="currentColor"
              className="text-text-secondary text-[10px] font-mono"
              tickLine={false}
              tickMargin={4}
              unit="ms"
            />
            <Tooltip content={<CustomChartTooltip />} />
            <Area
              type="monotone"
              dataKey="latencyMs"
              stroke="#D97706"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#latencyGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
