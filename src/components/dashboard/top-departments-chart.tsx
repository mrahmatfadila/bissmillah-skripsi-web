"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import Link from "next/link";

export function TopDepartmentsChart({ data }: { data: any[] }) {
    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">Tiket per Departemen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-row items-center justify-between h-[calc(100%-60px)]">
                {/* Chart */}
                <div className="h-[180px] w-[180px] relative shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="30%"
                            outerRadius="100%"
                            barSize={10}
                            data={data}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <RadialBar
                                background
                                dataKey="value"
                                cornerRadius={10}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </RadialBar>
                        </RadialBarChart>
                    </ResponsiveContainer>
                    {/* Center Circle Decor */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-14 h-14 rounded-full border-[3px] border-gray-100 flex items-center justify-center text-gray-300">
                            <Building2 size={24} />
                        </div>
                    </div>
                </div>

                {/* Custom Legend */}
                <div className="space-y-3 pl-4 flex-1 overflow-y-auto max-h-[220px]">
                    {data.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Tidak ada data departemen.</p>
                    ) : (
                        data.map((item, i) => (
                            <Link
                                key={i}
                                href={`/tickets/all?search=${encodeURIComponent(item.name)}`}
                                className="block"
                            >
                                <div className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-md transition-colors cursor-pointer">
                                    <div className="p-1.5 rounded-lg text-white shrink-0" style={{ backgroundColor: item.fill }}>
                                        <Building2 size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate" title={item.name}>{item.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{item.value} Tiket</p>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
