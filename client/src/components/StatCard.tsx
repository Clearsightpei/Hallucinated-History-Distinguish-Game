import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  titleClassName?: string;
  valueClassName?: string;
}

export default function StatCard({ title, value, description, titleClassName = "", valueClassName = "" }: StatCardProps) {
  return (
    <div className="p-4 rounded-lg">
      <p className={`text-sm font-medium !text-black ${titleClassName}`}>{title}</p>
      <p className={`mt-1 text-3xl font-semibold !text-black ${valueClassName}`}>{value}</p>
      {description && <p className="mt-1 text-xs">{description}</p>}
    </div>
  );
}
