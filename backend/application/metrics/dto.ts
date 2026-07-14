import type { Trend } from "@backend/domain/metrics/trend";

export interface TrafficPoint {
  date: string;
  visitors: number;
}

export interface TasksPoint {
  date: string;
  open: number;
}

export interface DashboardOverview {
  rangeDays: number;
  hasData: boolean;
  traffic: {
    current: number;
    total: number;
    trend: Trend;
    series: TrafficPoint[];
  };
  seoScore: {
    value: number;
    trend: Trend;
  };
  openTasks: {
    value: number;
    trend: Trend;
    series: TasksPoint[];
  };
  developerProgress: number;
  contentProgress: number;
}

export interface DashboardOverviewQuery {
  days?: number;
}
