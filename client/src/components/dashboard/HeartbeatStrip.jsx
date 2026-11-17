import React, { useState } from 'react';

export default function HeartbeatStrip({ heartbeats = [], totalTicks = 25, align = 'end' }) {
  const [activeTick, setActiveTick] = useState(null);

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
      return {
        height: '10px',
        colorClass: 'bg-slate-300 dark:bg-slate-700',
        bgColor: 'var(--border-subtle, #DCE4EC)',
      };
    }
    if (item.status === 'DOWN') {
      return {
        height: '24px',
        colorClass: 'bg-red-500',
        bgColor: 'var(--status-down-dot, #EF4444)',
      };
    }
    if (item.latencyMs >= 300) {
      return {
        height: '22px',
        colorClass: 'bg-amber-500',
        bgColor: '#F59E0B',
      };
    }
    if (item.latencyMs >= 150) {
      return {
        height: '18px',
        colorClass: 'bg-blue-600',
        bgColor: 'var(--accent-primary, #2563EB)',
      };
    }
    return {
      height: '14px',
      colorClass: 'bg-emerald-500',
      bgColor: 'var(--status-up-dot, #22C55E)',
    };
  };

  return (
    <div className={`relative flex flex-col ${align === 'start' ? 'items-start' : 'items-end'}`}>
      <div
        className="flex items-end gap-[3px] h-7 py-0.5"
        role="group"
        aria-label="25-Tick Recent Telemetry Strip"
      >
        {filledTicks.map((tick, index) => {
          const { height, colorClass, bgColor } = getTickDimensions(tick);
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
              onClick={(e) => {
                e.stopPropagation();
                if (!tick.isEmpty) setActiveTick((prev) => (prev === index ? null : index));
              }}
              aria-label={
                tick.isEmpty
                  ? 'No data available'
                  : `Check at ${new Date(tick.checkedAt).toLocaleTimeString()}: ${tick.status} ${
                      tick.latencyMs
                    }ms`
              }
              className={`w-1 rounded-full transition-transform focus:outline-none ${colorClass} ${
                isFocused ? 'ring-2 ring-accent scale-y-110' : 'hover:opacity-80'
              }`}
              style={{ height, backgroundColor: bgColor }}
            />
          );
        })}
      </div>

      {activeTick !== null && filledTicks[activeTick] && !filledTicks[activeTick].isEmpty && (
        <div
          role="tooltip"
          className={`absolute -top-9 ${
            align === 'start' ? 'left-0' : 'right-0'
          } bg-panel border border-subtle text-[11px] font-mono px-2.5 py-1 rounded-xl shadow-soft text-text-primary z-20 whitespace-nowrap`}
        >
          <span
            className={
              filledTicks[activeTick].status === 'UP' ? 'text-status-up font-semibold' : 'text-status-down font-semibold'
            }
          >
            {filledTicks[activeTick].status}
          </span>
          <span className="text-text-secondary mx-1.5">·</span>
          <span>{filledTicks[activeTick].latencyMs} ms</span>
          <span className="text-text-secondary mx-1.5">·</span>
          <span className="text-text-secondary">
            {new Date(filledTicks[activeTick].checkedAt).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}
