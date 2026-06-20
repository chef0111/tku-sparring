export interface HealthGradient {
  from: string;
  to: string;
}

export interface HealthKeyframes {
  widths: Array<string>;
  gradients: Array<string>;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ColorStop {
  threshold: number;
  from: RGB;
  to: RGB;
}

// Define color stops for smooth interpolation
export const colorStops: Array<ColorStop> = [
  {
    threshold: 100,
    from: { r: 50, g: 244, b: 219 }, // Cyan-green
    to: { r: 21, g: 233, b: 164 }, // Green
  },
  {
    threshold: 75,
    from: { r: 35, g: 224, b: 128 }, // Prominent Green
    to: { r: 34, g: 205, b: 100 }, // Darker green
  },
  {
    threshold: 50,
    from: { r: 253, g: 224, b: 71 }, // Light yellow
    to: { r: 250, g: 204, b: 21 }, // Yellow
  },
  {
    threshold: 25,
    from: { r: 251, g: 146, b: 60 }, // Light orange
    to: { r: 249, g: 115, b: 22 }, // Orange
  },
  {
    threshold: 0,
    from: { r: 239, g: 68, b: 68 }, // Light red
    to: { r: 220, g: 38, b: 38 }, // Red
  },
];

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

function lerpColor(color1: RGB, color2: RGB, factor: number): RGB {
  return {
    r: Math.round(lerp(color1.r, color2.r, factor)),
    g: Math.round(lerp(color1.g, color2.g, factor)),
    b: Math.round(lerp(color1.b, color2.b, factor)),
  };
}

function rgbToString(color: RGB): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/**
 * Compute health gradient colors based on health percentage
 * Uses smooth color interpolation between thresholds
 *
 * @param healthPct - Current health percentage (0-100)
 * @returns HealthGradient object with from and to colors
 */
export function computeHealthPct(healthPct: number): HealthGradient {
  const clampedHealth = Math.max(0, Math.min(100, healthPct));

  let lowerStop: ColorStop | null = null;
  let upperStop: ColorStop | null = null;

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (
      clampedHealth <= colorStops[i].threshold &&
      clampedHealth >= colorStops[i + 1].threshold
    ) {
      upperStop = colorStops[i];
      lowerStop = colorStops[i + 1];
      break;
    }
  }

  if (!upperStop || !lowerStop) {
    if (clampedHealth >= colorStops[0].threshold) {
      return {
        from: rgbToString(colorStops[0].from),
        to: rgbToString(colorStops[0].to),
      };
    }

    return {
      from: rgbToString(colorStops[colorStops.length - 1].from),
      to: rgbToString(colorStops[colorStops.length - 1].to),
    };
  }

  // Calculate interpolation factor (0.0 to 1.0)
  const range = upperStop.threshold - lowerStop.threshold;
  const position = clampedHealth - lowerStop.threshold;
  const factor = position / range;

  // Interpolate both gradient colors
  const interpolatedFrom = lerpColor(lowerStop.from, upperStop.from, factor);
  const interpolatedTo = lerpColor(lowerStop.to, upperStop.to, factor);

  return {
    from: rgbToString(interpolatedFrom),
    to: rgbToString(interpolatedTo),
  };
}

/**
 * Generate keyframe arrays for animating through color thresholds
 * This creates smooth step-by-step animation when health changes significantly
 *
 * @param fromPct - Starting health percentage (0-100)
 * @param toPct - Target health percentage (0-100)
 * @returns HealthKeyframes with arrays of widths and gradients for animation
 */
export function computeHealthKeyframes(
  fromPct: number,
  toPct: number
): HealthKeyframes {
  const clampedFrom = Math.max(0, Math.min(100, fromPct));
  const clampedTo = Math.max(0, Math.min(100, toPct));

  const thresholdsCrossed: Array<number> = [];

  const isDecreasing = clampedTo < clampedFrom;

  if (isDecreasing) {
    for (const stop of colorStops) {
      if (stop.threshold < clampedFrom && stop.threshold >= clampedTo) {
        thresholdsCrossed.push(stop.threshold);
      }
    }
  } else {
    for (let i = colorStops.length - 1; i >= 0; i--) {
      const stop = colorStops[i];
      if (stop.threshold > clampedFrom && stop.threshold <= clampedTo) {
        thresholdsCrossed.push(stop.threshold);
      }
    }
  }

  const widths: Array<string> = [`${clampedFrom}%`];
  const gradients: Array<string> = [buildGradientFromPct(clampedFrom)];

  // Add intermediate keyframes at each threshold
  for (const threshold of thresholdsCrossed) {
    widths.push(`${threshold}%`);
    gradients.push(buildGradientFromPct(threshold));
  }

  // Add final keyframe
  widths.push(`${clampedTo}%`);
  gradients.push(buildGradientFromPct(clampedTo));

  return { widths, gradients };
}

function buildGradientFromPct(healthPct: number): string {
  const gradient = computeHealthPct(healthPct);
  return `linear-gradient(180deg, ${gradient.from}, ${gradient.to})`;
}
