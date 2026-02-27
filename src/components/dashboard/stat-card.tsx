import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    subValue?: string;
    gradient: string;
    icon?: React.ReactNode;
}

export function StatCard({ title, value, subValue, gradient, icon }: StatCardProps) {
    return (
        <Card className={cn("border-none text-white", gradient)}>
            <CardContent className="p-6 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-sm font-medium opacity-90">{title}</h3>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2 opacity-80 text-xs">
                            This Week <ChevronDown className="w-3 h-3" />
                        </div>
                        <h2 className="text-2xl font-bold">{value}</h2>
                        {subValue && <p className="text-xs opacity-70 mt-1">{subValue}</p>}
                    </div>
                </div>

                {/* Background Icon/Shape */}
                {icon && <div className="absolute -bottom-4 -left-4 opacity-10 scale-150">{icon}</div>}
            </CardContent>
        </Card>
    );
}
