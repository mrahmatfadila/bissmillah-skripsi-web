"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle, Clock, AlertCircle, User } from "lucide-react";
import Link from "next/link";
import { useSystemSettings } from "@/components/settings-provider";

interface Activity {
    id: string;
    type: 'comment' | 'status_change' | 'assignment';
    ticketId: string;
    ticketNumber: string;
    ticketTitle: string;
    content: string;
    author: {
        name: string | null;
        image: string | null;
    };
    createdAt: string;
}

export default function ActivityPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');
    const { formatDate: globalFormatDate } = useSystemSettings();

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await fetch('/api/activity');
                if (response.ok) {
                    const data = await response.json();
                    setActivities(data);
                }
            } catch (error) {
                console.error("Error fetching activities:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, []);

    const filteredActivities = activities.filter(activity => {
        if (filter === 'ALL') return true;
        return activity.type === filter;
    });

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'comment':
                return <MessageSquare className="w-5 h-5 text-blue-500" />;
            case 'status_change':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'assignment':
                return <User className="w-5 h-5 text-purple-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'comment':
                return 'border-l-blue-500';
            case 'status_change':
                return 'border-l-green-500';
            case 'assignment':
                return 'border-l-purple-500';
            default:
                return 'border-l-gray-500';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit yang lalu`;
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays < 7) return `${diffDays} hari yang lalu`;

        return globalFormatDate(date);
    };

    return (
        <div className="bg-gray-50 min-h-screen p-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Activity Log
                    </h1>
                    <p className="text-gray-500 mt-1">Riwayat aktivitas terbaru di sistem</p>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-4 mb-6">
                    <span className="text-sm font-medium text-gray-700">Filter:</span>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="ALL">Semua Aktivitas</option>
                        <option value="comment">Komentar</option>
                        <option value="status_change">Perubahan Status</option>
                        <option value="assignment">Penugasan</option>
                    </select>
                    <span className="text-sm text-gray-600 ml-auto">
                        {filteredActivities.length} aktivitas
                    </span>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center text-gray-400">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>Tidak ada aktivitas ditemukan</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredActivities.map((activity) => (
                            <Link key={activity.id} href={`/tickets/${activity.ticketId}`}>
                                <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 ${getActivityColor(activity.type)} cursor-pointer`}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                {getActivityIcon(activity.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={activity.author.image || `https://ui-avatars.com/api/?name=${activity.author.name}&background=random`} />
                                                        <AvatarFallback className="text-xs">
                                                            {activity.author.name?.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {activity.author.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatDate(activity.createdAt)}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {activity.ticketNumber}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 font-medium mb-1">
                                                    {activity.ticketTitle}
                                                </p>
                                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                                    {activity.content}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
