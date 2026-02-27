"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

export function TotalTicketsChart({ data }: { data: any[] }) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-bold text-gray-800">Statistik Tiket</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between h-[calc(100%-60px)] pt-0">
                {/* Legend Left Side */}
                <div className="space-y-4 flex-1">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                                <span className="text-gray-600 font-medium">{item.name}</span>
                            </div>
                            <span className="font-bold text-gray-700">
                                {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                            </span>
                        </div>
                    ))}
                </div>

                {/* Chart Right Side */}
                <div className="h-full w-full flex-1 min-h-[200px] relative min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <span className="text-2xl font-bold text-gray-800">{total}</span>
                            <p className="text-xs text-gray-400">Total</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
