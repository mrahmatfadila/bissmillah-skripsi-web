import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCheck } from "lucide-react";

interface AgentLeader {
    name: string | null;
    email: string | null;
    image?: string | null; // Added image field
    count: number;
}

export function AgentsLeadership({ agents }: { agents: AgentLeader[] }) {
    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">Agen Teraktif (30 Hari)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {agents.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">Belum ada data agen.</div>
                ) : (
                    agents.map((agent, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-xs text-muted-foreground w-4 font-mono">{i + 1}.</div>
                                <Avatar className="h-8 w-8 bg-muted">
                                    <AvatarImage src={agent.image || `https://ui-avatars.com/api/?name=${agent.name}&background=random`} />
                                    <AvatarFallback>{agent.name?.substring(0, 2).toUpperCase() || "ID"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{agent.name || "Unknown"}</p>
                                    <p className="text-[10px] text-muted-foreground truncate w-24">{agent.email}</p>
                                </div>
                            </div>
                            <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                {agent.count}
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
