import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export default function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="p-4 bg-primary-light rounded-lg">
      <p className="text-sm font-medium text-neutral-600">{title}</p>
      <p className="mt-1 text-3xl font-semibold text-primary">{value}</p>
      {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
    </div>
  );
}
