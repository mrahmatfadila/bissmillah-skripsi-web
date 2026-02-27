import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Clock, Ticket } from "lucide-react";

interface WelcomeCardProps {
    user: {
        name?: string | null;
        role?: string | null;
        image?: string | null;
    };
    stats: {
        assigned: number;
        resolved: number;
    };
}

export function CongratulationsCard({ user, stats }: WelcomeCardProps) {
    return (
        <Card className="bg-gray-900 text-white border-none overflow-hidden relative h-full">
            <CardContent className="p-6 flex justify-between items-center relative z-10 h-full">
                <div>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-green-400 mb-1">Selamat Datang, {user.name?.split(' ')[0]}!</h3>
                        <p className="text-xs text-gray-400">{user.role?.replace(/_/g, " ")}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-white/20">
                            <AvatarImage src={user.image || ""} />
                            <AvatarFallback>{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex gap-6">
                            <div>
                                <p className="text-xl font-bold">{stats.assigned} <span className="text-sm font-normal text-gray-400">Aktif</span></p>
                                <p className="text-xs text-gray-500">Tiket Ditugaskan</p>
                            </div>
                            <div>
                                <p className="text-xl font-bold">{stats.resolved} <span className="text-sm font-normal text-gray-400">Selesai</span></p>
                                <p className="text-xs text-gray-500">Tiket Diselesaikan</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decoration */}
                <div className="hidden md:block opacity-10 absolute right-4 bottom-4">
                    <Ticket className="w-24 h-24" />
                </div>
            </CardContent>

            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        </Card>
    );
}
