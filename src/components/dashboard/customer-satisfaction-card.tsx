"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, Minus, ArrowDown } from "lucide-react";

interface PriorityStatsCardProps {
    data: { name: string; value: number }[];
}

export function CustomerSatisfactionCard({ data }: PriorityStatsCardProps) {
    // Note: Kept component name 'CustomerSatisfactionCard' to avoid import errors in other files, 
    // but the UI now reflects 'Ticket Priority Stats'.

    const maxVal = Math.max(...data.map(d => d.value)) || 1;

    const getIcon = (name: string) => {
        switch (name) {
            case 'CRITICAL': return <AlertTriangle className="text-red-500" size={16} />;
            case 'HIGH': return <TrendingUp className="text-orange-500" size={16} />;
            case 'MEDIUM': return <Minus className="text-blue-500" size={16} />;
            case 'LOW': return <ArrowDown className="text-green-500" size={16} />;
            default: return <Minus size={16} />;
        }
    };

    const getColor = (name: string) => {
        switch (name) {
            case 'CRITICAL': return 'bg-red-500';
            case 'HIGH': return 'bg-orange-500';
            case 'MEDIUM': return 'bg-blue-500';
            case 'LOW': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">Prioritas Tiket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {data.map((item) => (
                    <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 font-medium text-foreground">
                                {getIcon(item.name)}
                                {item.name}
                            </div>
                            <span className="font-bold text-foreground">{item.value}</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${getColor(item.name)}`}
                                style={{ width: `${(item.value / maxVal) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
