import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export default function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="p-4 bg-[#0b1e3f] rounded-lg text-black">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      {description && <p className="mt-1 text-xs">{description}</p>}
    </div>
  );
}
