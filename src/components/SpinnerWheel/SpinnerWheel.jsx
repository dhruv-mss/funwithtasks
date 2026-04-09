import { useState, useRef, useEffect } from 'react';
import './SpinnerWheel.css';

const CX = 200;
const CY = 200;
const R = 175;
const LABEL_R = 112;
const SPIN_DURATION = 4000;

const TASK_PALETTE = [
  '#7c6af7', '#06b6d4', '#10b981', '#ec4899',
  '#3b82f6', '#8b5cf6', '#14b8a6', '#f97316',
];
const GOAL_COLOR = '#f59e0b';
const FOLLOWUP_COLOR = '#14b8a6';

function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildSlicePath(cx, cy, r, startAngle, endAngle) {
  const start = polarToXY(cx, cy, r, startAngle);
  const end = polarToXY(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
    'Z',
  ].join(' ');
}

function computeSlices(spinItems) {
  const totalWeight = spinItems.reduce((sum, item) => sum + item.weight, 0);
  const slices = [];
  let cumAngle = 0;
  let taskColorIdx = 0;
  spinItems.forEach((item) => {
    const arc = (item.weight / totalWeight) * 360;
    let color;
    if (item.type === 'goal') color = GOAL_COLOR;
    else if (item.type === 'followup') color = FOLLOWUP_COLOR;
    else { color = TASK_PALETTE[taskColorIdx++ % TASK_PALETTE.length]; }

    slices.push({ item, startAngle: cumAngle, endAngle: cumAngle + arc, arc, color });
    cumAngle += arc;
  });
  return slices;
}

function truncate(text, max) {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

// spinItems: [{ id, name, type: 'task'|'goal'|'followup', weight }]
export default function SpinnerWheel({ spinItems = [], onSpinComplete }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [highlighted, setHighlighted] = useState(null);
  const rotationRef = useRef(0);

  useEffect(() => { setHighlighted(null); }, [spinItems.length]);

  function handleSpin() {
    if (spinning || spinItems.length === 0) return;
    setHighlighted(null);
    setSpinning(true);

    const extra = 1440 + Math.random() * 360;
    const newRotation = rotationRef.current + extra;
    rotationRef.current = newRotation;
    setRotation(newRotation);

    setTimeout(() => {
      const slices = computeSlices(spinItems);
      const normalizedAngle = ((360 - (newRotation % 360)) % 360 + 360) % 360;
      let cumulative = 0;
      let winner = spinItems[spinItems.length - 1];
      for (const slice of slices) {
        cumulative += slice.arc;
        if (normalizedAngle < cumulative) { winner = slice.item; break; }
      }
      setHighlighted(winner.id);
      setSpinning(false);
      onSpinComplete(winner);
    }, SPIN_DURATION + 50);
  }

  const slices = computeSlices(spinItems);
  const isEmpty = spinItems.length === 0;
  const isSingle = spinItems.length === 1;

  return (
    <div className="spinner-wheel">
      <div className="spinner-wheel__pointer-wrap">
        <svg viewBox="0 0 30 24" width="30" height="24">
          <polygon points="15,22 0,0 30,0" fill="#4a35c8" />
        </svg>
      </div>

      <div className="spinner-wheel__svg-wrap">
        <svg viewBox="0 0 400 400" width="360" height="360" className="spinner-wheel__svg">
          <g
            className="spinner-wheel__group"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? `transform ${SPIN_DURATION}ms cubic-bezier(0.17,0.67,0.12,0.99)` : 'none',
              transformOrigin: `${CX}px ${CY}px`,
            }}
          >
            {isEmpty && <circle cx={CX} cy={CY} r={R} fill="#ede9ff" />}

            {isSingle && !isEmpty && (
              <circle
                cx={CX} cy={CY} r={R}
                fill={highlighted === spinItems[0].id ? '#fff3' : slices[0]?.color}
              />
            )}

            {!isSingle && slices.map((slice) => (
              <path
                key={slice.item.id}
                d={buildSlicePath(CX, CY, R, slice.startAngle, slice.endAngle)}
                fill={highlighted === slice.item.id ? '#fff' : slice.color}
                stroke="#12121e"
                strokeWidth="2"
                opacity={highlighted && highlighted !== slice.item.id ? 0.35 : 1}
                style={{ transition: 'opacity 0.3s, fill 0.3s' }}
              />
            ))}

            {slices.map((slice) => {
              if (slice.arc < 12) return null;
              const midAngle = slice.startAngle + slice.arc / 2;
              const lp = polarToXY(CX, CY, LABEL_R, midAngle);
              return (
                <g key={`lbl-${slice.item.id}`}>
                  {slice.item.type !== 'task' && (
                    <text
                      x={lp.x} y={lp.y - 9}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={highlighted === slice.item.id ? '#12121e' : '#fff'}
                      fontSize="9" fontWeight="700"
                      transform={`rotate(${midAngle - 90}, ${lp.x}, ${lp.y - 9})`}
                      style={{ pointerEvents: 'none', userSelect: 'none', textTransform: 'uppercase', letterSpacing: 1 }}
                    >
                      {slice.item.type === 'goal' ? '★ GOAL' : '↩ FOLLOW-UP'}
                    </text>
                  )}
                  <text
                    x={lp.x} y={slice.item.type !== 'task' ? lp.y + 5 : lp.y}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={highlighted === slice.item.id ? '#12121e' : '#fff'}
                    fontSize={slice.arc > 40 ? 12 : 9}
                    fontWeight="600"
                    transform={`rotate(${midAngle - 90}, ${lp.x}, ${slice.item.type !== 'task' ? lp.y + 5 : lp.y})`}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {truncate(slice.item.name, slice.arc > 60 ? 14 : 9)}
                  </text>
                </g>
              );
            })}

            {isSingle && !isEmpty && (
              <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
                fill="#fff" fontSize="13" fontWeight="600"
                style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {truncate(spinItems[0].name, 18)}
              </text>
            )}
          </g>

          <circle cx={CX} cy={CY} r={22} fill="#f4f2ff" />
          <circle cx={CX} cy={CY} r={14} fill="#7c6af7" />

          {isEmpty && (
            <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
              fill="#c0bcd8" fontSize="13">
              No items to spin
            </text>
          )}
        </svg>
      </div>

      <button
        className={`spinner-wheel__btn ${spinning ? 'spinner-wheel__btn--spinning' : ''}`}
        onClick={handleSpin}
        disabled={spinning || isEmpty}
      >
        {spinning ? 'Spinning…' : 'SPIN'}
      </button>

      {!isEmpty && (
        <div className="spinner-wheel__legend">
          {[
            { type: 'goal', color: GOAL_COLOR, label: 'Goals' },
            { type: 'followup', color: FOLLOWUP_COLOR, label: 'Follow-up' },
            { type: 'task', color: TASK_PALETTE[0], label: 'Tasks' },
          ].map(({ type, color, label }) => {
            const c = spinItems.filter((i) => i.type === type).length;
            if (!c) return null;
            return (
              <span key={type} className="spinner-wheel__legend-item">
                <span className="spinner-wheel__legend-dot" style={{ background: color }} />
                {label} ({c})
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
