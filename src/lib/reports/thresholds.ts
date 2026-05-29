export const WATER_THRESHOLDS = {
  phMin: 7.2,
  phMax: 7.8,
  freeChlorineMin: 0.4,
  pressureMax: 2.0,
  daysWithoutVisitWarning: 7,
  daysWithoutVisitCritical: 14,
} as const;

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertType =
  | "PH_OUT_OF_RANGE"
  | "CHLORINE_LOW"
  | "PRESSURE_HIGH"
  | "PRESSURE_SECONDARY_HIGH"
  | "WATER_CLARITY"
  | "NO_VISIT";

export type VisitAlert = {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
};
