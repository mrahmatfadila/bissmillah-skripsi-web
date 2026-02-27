"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";

interface TicketStatusChartProps {
    data: { name: string; value: number; color: string }[];
}

export function TicketStatusChart({ data }: TicketStatusChartProps) {
    // Safe default if data is empty
    const chartData = data?.length > 0 ? data : [
        { name: "Solved", value: 40, color: "#3b82f6" },
        { name: "Due", value: 40, color: "#10b981" },
        { name: "Hold", value: 20, color: "#8b5cf6" },
    ];

    return (
        <Card className="border-none shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Statistik Tiket</CardTitle>
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={0}
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    backgroundColor: 'var(--card-bg, #fff)', // Will need a css var or standard color
                                    color: '#333'
                                }}
                                itemStyle={{ color: '#333' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text (Mockup style) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <span className="text-2xl font-bold text-foreground">
                                {chartData.reduce((acc, curr) => acc + curr.value, 0)}
                            </span>
                            <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2 mt-2 px-4">
                    {chartData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs text-muted-foreground w-full">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                                <span className="uppercase">{item.name}</span>
                            </div>
                            <span className="font-medium text-foreground">{item.value}%</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
