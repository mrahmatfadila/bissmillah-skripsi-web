"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function TicketPrioritylist() {
    const data = [
        { label: "High", value: 80, color: "bg-blue-600" },
        { label: "Medium", value: 40, color: "bg-blue-600" },
        { label: "Low", value: 20, color: "bg-blue-600" },
    ];

    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader>
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Ticket Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {data.map((item) => (
                    <div key={item.label} className="flex items-center text-sm">
                        <div className="w-20 font-medium text-muted-foreground">{item.label}</div>
                        <div className="flex-1 mx-2">
                            <Progress value={item.value} className="h-2" indicatorColor={item.color} />
                        </div>
                        <div className="w-10 text-right font-bold text-foreground">{item.value}%</div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
