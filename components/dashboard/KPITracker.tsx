import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Progress } from '../ui/progress';
import type { KPI } from '../../types/dashboard';

interface KPITrackerProps {
  kpis: KPI[];
}

export function KPITracker({ kpis }: KPITrackerProps) {
  const getProgressPercentage = (value: number, target: number) => {
    return Math.min((value / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Performance Indicators</CardTitle>
        <CardDescription>Track your leadership metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {kpis.map((kpi) => {
          const percentage = getProgressPercentage(kpi.value, kpi.target);
          return (
            <div key={kpi.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{kpi.title}</h4>
                <span className="text-sm text-muted-foreground">
                  {kpi.value} / {kpi.target} {kpi.unit}
                </span>
              </div>
              <div className="space-y-1">
                <Progress
                  value={percentage}
                  className="h-3"
                  style={
                    {
                      '--progress-background': kpi.color,
                    } as React.CSSProperties
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="font-medium" style={{ color: kpi.color }}>
                    {percentage.toFixed(0)}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
