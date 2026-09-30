import type { BurndownPoint } from "../../../domain/sprint";
import styles from "./BurndownChart.module.css";

interface BurndownChartProps {
  points: BurndownPoint[];
  totalPoints: number;
}

const WIDTH = 660;
const HEIGHT = 260;
const PADDING = { top: 20, right: 20, bottom: 36, left: 44 };

export function BurndownChart({ points, totalPoints }: BurndownChartProps) {
  if (points.length === 0) {
    return null;
  }

  const maxDay = Math.max(1, points.length - 1);
  const maxValue = Math.max(totalPoints, 1);

  const scaleX = (day: number) =>
    PADDING.left +
    (day / maxDay) * (WIDTH - PADDING.left - PADDING.right);
  const scaleY = (value: number) =>
    HEIGHT -
    PADDING.bottom -
    (value / maxValue) * (HEIGHT - PADDING.top - PADDING.bottom);

  const toPath = (key: "ideal" | "remaining") =>
    points
      .map((point, index) => {
        const x = scaleX(point.day);
        const y = scaleY(point[key]);
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  const gridValues = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Burndown chart of story points remaining per day"
      >
        {gridValues.map((ratio) => {
          const value = maxValue * ratio;
          const y = scaleY(value);
          return (
            <g key={ratio}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                className={styles.grid}
              />
              <text
                x={PADDING.left - 8}
                y={y + 4}
                className={styles.axisLabelY}
              >
                {Math.round(value)}
              </text>
            </g>
          );
        })}

        <path d={toPath("ideal")} className={styles.idealLine} />
        <path d={toPath("remaining")} className={styles.remainingLine} />

        {points.map((point) => (
          <circle
            key={point.day}
            cx={scaleX(point.day)}
            cy={scaleY(point.remaining)}
            r={3}
            className={styles.dot}
          />
        ))}

        {points.map((point) => (
          <text
            key={point.day}
            x={scaleX(point.day)}
            y={HEIGHT - PADDING.bottom + 18}
            className={styles.axisLabel}
          >
            D{point.day}
          </text>
        ))}

        <text x={PADDING.left} y={12} className={styles.axisLabel}>
          points remaining
        </text>
      </svg>
      <ul className={styles.legend}>
        <li>
          <span className={`${styles.swatch} ${styles.swatchRemaining}`} />
          Remaining
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.swatchIdeal}`} />
          Ideal
        </li>
      </ul>
    </div>
  );
}
