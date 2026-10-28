import React, { useState } from 'react';

export default function HeartbeatStrip({ heartbeats = [], totalTicks = 25 }) {
  const [activeTick, setActiveTick] = useState(null);

  // Pad heartbeats to exactly 25 ticks with chronological ordering
  const filledTicks = React.useMemo(() => {
    const list = Array.isArray(heartbeats) ? [...heartbeats] : [];
    if (list.length >= totalTicks) {
      return list.slice(list.length - totalTicks);
    }
    const emptyCount = totalTicks - list.length;
    const padding = Array.from({ length: emptyCount }, () => ({
      isEmpty: true,
    }));
    return [...padding, ...list];
  }, [heartbeats, totalTicks]);

  const getTickDimensions = (item) => {
    if (item.isEmpty) {
      return { height: '8px', colorClass: 'bg-subtle/50' };
    }
    if (item.status === 'DOWN') {
      return { height: '24px', colorClass: 'bg-status-down' };
    }
    if (item.latencyMs > 500) {
      return { height: '24px', colorClass: 'bg-status-up' };
    }
    if (item.latencyMs >= 150) {
      return { height: '18px', colorClass: 'bg-status-up' };
    }
    return { height: '12px', colorClass: 'bg-status-up' };
  };

  return (
    <div className="relative flex flex-col items-end">
      <div
        className="flex items-end gap-1 h-7 p-0.5"
        role="group"
        aria-label="25-Tick Recent Telemetry Strip"
      >
        {filledTicks.map((tick, index) => {
          const { height, colorClass } = getTickDimensions(tick);
          const isFocused = activeTick === index;

          return (
            <button
              key={index}
              type="button"
              disabled={tick.isEmpty}
              onMouseEnter={() => !tick.isEmpty && setActiveTick(index)}
              onMouseLeave={() => setActiveTick(null)}
              onFocus={() => !tick.isEmpty && setActiveTick(index)}
              onBlur={() => setActiveTick(null)}
              onClick={() => !tick.isEmpty && setActiveTick((prev) => (prev === index ? null : index))}
              aria-label={
                tick.isEmpty
                  ? 'No data available'
                  : `Check at ${new Date(tick.checkedAt).toLocaleTimeString()}: ${tick.status} ${
                      tick.latencyMs
                    }ms`
              }
              className={`w-1 rounded-sm transition-all focus:outline-none ${colorClass} ${
                isFocused ? 'ring-1 ring-amber-brand scale-y-110' : 'hover:opacity-80'
              }`}
              style={{ height }}
            />
          );
        })}
      </div>

      {activeTick !== null && filledTicks[activeTick] && !filledTicks[activeTick].isEmpty && (
        <div
          role="tooltip"
          className="absolute -top-8 right-0 bg-panel border border-subtle text-[11px] font-mono px-2 py-0.5 rounded shadow-sm text-text-primary z-20 whitespace-nowrap"
        >
          <span
            className={
              filledTicks[activeTick].status === 'UP' ? 'text-status-up font-semibold' : 'text-status-down font-semibold'
            }
          >
            {filledTicks[activeTick].status}
          </span>
          <span className="text-text-secondary mx-1">|</span>
          <span>{filledTicks[activeTick].latencyMs} ms</span>
          <span className="text-text-secondary mx-1">|</span>
          <span className="text-text-secondary">
            {new Date(filledTicks[activeTick].checkedAt).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}
