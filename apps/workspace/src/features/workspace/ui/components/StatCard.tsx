import type { LucideIcon } from "lucide-react";
import { toneClasses, type Tone } from "../colorTokens";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: Tone;
};

export function StatCard({ label, value, icon: Icon, tone }: StatCardProps) {
  const toneStyle = toneClasses[tone];

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-lg ${toneStyle.softBg} flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 ${toneStyle.text}`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-zinc-900 mb-1">{value}</div>
      <div className="text-sm text-zinc-600">{label}</div>
    </div>
  );
}
