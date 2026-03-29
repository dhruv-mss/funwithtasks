import { useState, useRef, useEffect } from 'react';
import { PRIORITY_WEIGHTS, PRIORITY_COLORS } from '../../utils/taskReducer';
import './SpinnerWheel.css';

const CX = 200;
const CY = 200;
const R = 175;
const LABEL_R = 115;
const SPIN_DURATION = 4000;

// Slice colors cycling palette
const SLICE_PALETTE = [
  '#7c6af7', '#06b6d4', '#10b981', '#f59e0b',
  '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6',
];

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

function computeSlices(tasks) {
  const totalWeight = tasks.reduce(
    (sum, t) => sum + PRIORITY_WEIGHTS[t.priority],
    0
  );
  const slices = [];
  let cumAngle = 0;
  tasks.forEach((task, i) => {
    const arc = (PRIORITY_WEIGHTS[task.priority] / totalWeight) * 360;
    slices.push({
      task,
      startAngle: cumAngle,
      endAngle: cumAngle + arc,
      arc,
      color: SLICE_PALETTE[i % SLICE_PALETTE.length],
    });
    cumAngle += arc;
  });
  return slices;
}

function truncate(text, max) {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

export default function SpinnerWheel({ tasks, onSpinComplete, activeTaskId }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [highlighted, setHighlighted] = useState(null);
  const rotationRef = useRef(0);
  const groupRef = useRef(null);

  const activeTasks = tasks.filter((t) => !t.blocked);

  // Reset highlight when tasks change
  useEffect(() => {
    setHighlighted(null);
  }, [tasks.length]);

  function handleSpin() {
    if (spinning || activeTasks.length === 0) return;

    setHighlighted(null);
    setSpinning(true);

    const extra = 1440 + Math.random() * 360;
    const newRotation = rotationRef.current + extra;
    rotationRef.current = newRotation;
    setRotation(newRotation);

    setTimeout(() => {
      // Determine winner from weighted slices
      const slices = computeSlices(activeTasks);
      const totalWeight = activeTasks.reduce(
        (s, t) => s + PRIORITY_WEIGHTS[t.priority],
        0
      );
      const normalizedAngle =
        ((360 - (newRotation % 360)) % 360 + 360) % 360;

      let cumulative = 0;
      let winner = activeTasks[activeTasks.length - 1];
      for (const slice of slices) {
        cumulative += slice.arc;
        if (normalizedAngle < cumulative) {
          winner = slice.task;
          break;
        }
      }

      setHighlighted(winner.id);
      setSpinning(false);
      onSpinComplete(winner);
    }, SPIN_DURATION + 50);
  }

  const slices = computeSlices(activeTasks);
  const isEmpty = activeTasks.length === 0;
  const isSingle = activeTasks.length === 1;

  return (
    <div className="spinner-wheel">
      <div className="spinner-wheel__pointer-wrap">
        <svg className="spinner-wheel__pointer-svg" viewBox="0 0 30 24" width="30" height="24">
          <polygon points="15,22 0,0 30,0" fill="#f1f0ff" />
        </svg>
      </div>

      <div
        className="spinner-wheel__svg-wrap"
        style={{ '--spin-duration': `${SPIN_DURATION}ms`, '--rotation': `${rotation}deg` }}
      >
        <svg viewBox="0 0 400 400" width="400" height="400" className="spinner-wheel__svg">
          <g
            ref={groupRef}
            className="spinner-wheel__group"
            style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? `transform ${SPIN_DURATION}ms cubic-bezier(0.17,0.67,0.12,0.99)` : 'none', transformOrigin: `${CX}px ${CY}px` }}
          >
            {isEmpty && (
              <circle cx={CX} cy={CY} r={R} fill="#1e1e35" />
            )}

            {isSingle && !isEmpty && (
              <>
                <circle
                  cx={CX} cy={CY} r={R}
                  fill={highlighted === activeTasks[0].id ? '#fff3' : SLICE_PALETTE[0]}
                  stroke={highlighted === activeTasks[0].id ? '#fff' : 'transparent'}
                  strokeWidth="3"
                />
              </>
            )}

            {!isSingle && slices.map((slice, i) => (
              <path
                key={slice.task.id}
                d={buildSlicePath(CX, CY, R, slice.startAngle, slice.endAngle)}
                fill={highlighted === slice.task.id ? '#fff' : slice.color}
                stroke="#12121e"
                strokeWidth="2"
                opacity={highlighted && highlighted !== slice.task.id ? 0.4 : 1}
                style={{ transition: 'opacity 0.3s, fill 0.3s' }}
              />
            ))}

            {/* Labels */}
            {slices.map((slice) => {
              if (slice.arc < 15) return null; // too thin to label
              const midAngle = slice.startAngle + slice.arc / 2;
              const labelPos = polarToXY(CX, CY, LABEL_R, midAngle);
              const rotate = midAngle - 90;
              return (
                <text
                  key={`label-${slice.task.id}`}
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={highlighted === slice.task.id ? '#12121e' : '#fff'}
                  fontSize={slice.arc > 40 ? 13 : 10}
                  fontWeight="600"
                  transform={`rotate(${rotate}, ${labelPos.x}, ${labelPos.y})`}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {truncate(slice.task.name, slice.arc > 60 ? 16 : 10)}
                </text>
              );
            })}

            {/* Single-task label */}
            {isSingle && !isEmpty && (
              <text
                x={CX} y={CY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize="14"
                fontWeight="600"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {truncate(activeTasks[0].name, 20)}
              </text>
            )}
          </g>

          {/* Center hub */}
          <circle cx={CX} cy={CY} r={22} fill="#12121e" />
          <circle cx={CX} cy={CY} r={14} fill="#7c6af7" />

          {/* Empty state text */}
          {isEmpty && (
            <text
              x={CX} y={CY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#44446a"
              fontSize="13"
            >
              Add tasks to spin
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
          {['High', 'Med', 'Low'].map((p) => {
            const count = activeTasks.filter((t) => t.priority === p).length;
            if (count === 0) return null;
            return (
              <span key={p} className="spinner-wheel__legend-item">
                <span
                  className="spinner-wheel__legend-dot"
                  style={{ background: PRIORITY_COLORS[p] }}
                />
                {p} ({count})
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
