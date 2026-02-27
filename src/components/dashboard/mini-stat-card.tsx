"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface MiniStatCardProps {
    title: string;
    value: string;
    trend: string;
    trendUp: boolean;
    data: { value: number }[];
    color: string;
}

export function MiniStatCard({ title, value, trend, trendUp, data, color }: MiniStatCardProps) {
    return (
        <Card className="border-none shadow-sm min-h-[140px] flex flex-col justify-between">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1",
                        trendUp ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    )}>
                        {trend} {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    </span>
                    <span className="text-xs text-muted-foreground">This Week ⌄</span>
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <h3 className="text-3xl font-bold text-foreground">{value}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{title}</p>
                    </div>
                    <div className="h-[40px] w-[80px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={color}
                                    strokeWidth={3}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
