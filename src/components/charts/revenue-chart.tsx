"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatIDR } from "@/lib/format";

export function RevenueChart({ data }: { data: { date: string; value: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(333 71% 51%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(333 71% 51%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="date" fontSize={12} tickFormatter={(v) => v.slice(5)} />
          <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`} />
          <Tooltip formatter={(v: any) => formatIDR(Number(v))} />
          <Area type="monotone" dataKey="value" stroke="hsl(333 71% 51%)" fill="url(#rev)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
