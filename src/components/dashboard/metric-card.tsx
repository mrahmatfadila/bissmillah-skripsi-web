import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, MoreVertical } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon?: React.ReactNode;
    description?: string;
    className?: string;
}

export function MetricCard({ title, value, trend, trendUp, icon, description, className }: MetricCardProps) {
    return (
        <Card className={cn("shadow-sm border-none bg-white dark:bg-gray-900", className)}>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
                    </div>
                    {icon && (
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            {icon}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    {trend && (
                        <div className={cn("flex items-center text-sm font-medium", trendUp ? "text-green-600" : "text-red-600")}>
                            {trendUp ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                            {trend}
                            <span className="text-gray-400 ml-2 font-normal">vs last month</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
