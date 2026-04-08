import { Card } from '@/components/ui/card';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <Card className="rounded-lg border bg-transparent p-4">
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground size-4" />
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
}
