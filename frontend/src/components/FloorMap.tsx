import { useEffect, useState } from 'react';
import type { FloorMapData } from '../types';
import { api } from '../api/client';

// Individual-only floor map: renders a placeholder floor plan with a single highlighted
// seat. There is deliberately NO building-wide "everyone's seats" view anywhere in the app.
export default function FloorMap({
  floor,
  seat,
  building,
}: {
  floor: number;
  seat: string;
  building: string;
}) {
  const [data, setData] = useState<FloorMapData | null>(null);

  useEffect(() => {
    const floorId = `${building.replace(/\s+/g, '-').toLowerCase()}-${floor}`;
    api.getFloorMap(floorId, seat, building).then(setData).catch(() => setData(null));
  }, [floor, seat, building]);

  if (!data) return null;

  return (
    <div className="floor-map">
      <svg viewBox={`0 0 ${data.width} ${data.height}`} role="img" aria-label={`Floor ${floor} map, seat ${seat}`}>
        {/* Floor outline */}
        <rect
          x="20"
          y="20"
          width={data.width - 40}
          height={data.height - 40}
          rx="14"
          fill="#ffffff"
          stroke="#d6dbe3"
          strokeWidth="2"
        />
        {/* Decorative desk grid */}
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 8 }).map((__, col) => {
            const x = 80 + (col / 7) * (data.width - 160);
            const y = 80 + (row / 4) * (data.height - 160);
            return (
              <rect
                key={`${row}-${col}`}
                x={x - 16}
                y={y - 10}
                width="32"
                height="20"
                rx="4"
                fill="#eef1f6"
                stroke="#e0e4ea"
              />
            );
          }),
        )}
        {/* Highlighted seat */}
        {data.highlightedSeat && (
          <g className="seat-marker">
            <circle
              cx={data.highlightedSeat.x}
              cy={data.highlightedSeat.y}
              r="22"
              fill="rgba(15,108,189,0.18)"
            />
            <circle
              cx={data.highlightedSeat.x}
              cy={data.highlightedSeat.y}
              r="11"
              fill="#0f6cbd"
              stroke="#ffffff"
              strokeWidth="3"
            />
            <text
              x={data.highlightedSeat.x}
              y={data.highlightedSeat.y - 30}
              textAnchor="middle"
              fontSize="16"
              fontWeight="700"
              fill="#0a5499"
            >
              {data.highlightedSeat.seat}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
