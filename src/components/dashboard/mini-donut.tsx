"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
    { name: "A", value: 30, color: "#a855f7" }, // Purple
    { name: "B", value: 40, color: "#f97316" }, // Orange
    { name: "C", value: 30, color: "#3b82f6" }, // Blue
];

export function MiniDonut() {
    return (
        <div className="h-12 w-12">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={15}
                        outerRadius={22}
                        dataKey="value"
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
