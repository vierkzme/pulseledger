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
      <div className="bg-panel border border-subtle p-3 rounded-2xl shadow-soft text-xs font-mono text-text-primary">
        <div className="text-text-secondary text-[11px] mb-1">{timeFormatted}</div>
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">Latency:</span>
          <span className="font-semibold text-accent tabular-nums">
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

export default function LatencyAreaChart({
  data = [],
  isLoading = false,
  height = 240,
  title = 'Response Time Trend',
  subtitle = 'Continuous round-trip network latency in milliseconds',
}) {
  if (isLoading) {
    return (
      <div
        className="w-full bg-card border border-subtle/60 rounded-[20px] p-6 flex flex-col items-center justify-center animate-pulse"
        style={{ height }}
        aria-label="Loading latency chart"
      >
        <div className="w-1/3 h-4 bg-subtle rounded-full mb-4"></div>
        <div className="w-full h-3/4 bg-subtle/60 rounded-2xl"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="w-full bg-card border border-subtle/60 rounded-[20px] p-6 flex flex-col items-center justify-center text-center"
        style={{ height }}
      >
        <span className="text-xs font-medium text-text-primary">No telemetry records in selected time range</span>
        <span className="text-xs text-text-secondary mt-1">
          Background pinger checks will populate time-series metrics
        </span>
      </div>
    );
  }

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
    <div className="w-full bg-card border border-subtle/60 rounded-[20px] p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <p className="text-xs text-text-secondary">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-panel border border-subtle/70 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-accent" aria-hidden="true"></span>
          <span className="text-text-secondary">Latency (ms)</span>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-subtle" />
            <XAxis
              dataKey="time"
              stroke="currentColor"
              className="text-text-secondary text-[10px] font-mono"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              stroke="currentColor"
              className="text-text-secondary text-[10px] font-mono"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              unit="ms"
            />
            <Tooltip content={<CustomChartTooltip />} />
            <Area
              type="monotone"
              dataKey="latencyMs"
              stroke="#2563EB"
              strokeWidth={2.25}
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
