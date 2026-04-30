import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  detail?: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-slate-950/20">
      <p className="text-sm text-slate-400">{label}</p>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
      {detail ? <p className="mt-2 text-sm text-slate-400">{detail}</p> : null}
    </div>
  );
}
