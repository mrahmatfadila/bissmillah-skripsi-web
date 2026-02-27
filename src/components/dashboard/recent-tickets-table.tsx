import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { MoreVertical, Filter, Calendar } from "lucide-react";

const recentTickets = [
    {
        id: "23HH56DG",
        summary: "Cant login my account",
        assignee: { name: "Zaire Mango", role: "Manager", img: "https://i.pravatar.cc/150?u=1" },
        reporter: "Kadin",
        status: "IN PROGRESS",
        created: "4/07/23",
        updated: "7/07/23",
    },
    {
        id: "UYE32G77",
        summary: "I cant set password",
        assignee: { name: "Craig George", role: "Support", img: "https://i.pravatar.cc/150?u=2" },
        reporter: "Jakob",
        status: "SOLVED",
        created: "2/06/23",
        updated: "5/07/23",
    },
    {
        id: "UYE32G75",
        summary: "Scanner not working",
        assignee: { name: "Martin Donin", role: "Designer", img: "https://i.pravatar.cc/150?u=3" },
        reporter: "Abram",
        status: "DECLINED",
        created: "12/06/23",
        updated: "2/07/23",
    },
];

const statusStyles: Record<string, string> = {
    "IN PROGRESS": "bg-orange-100 text-orange-600 hover:bg-orange-100",
    "SOLVED": "bg-green-100 text-green-600 hover:bg-green-100",
    "DECLINED": "bg-red-100 text-red-600 hover:bg-red-100",
    "OPEN": "bg-blue-100 text-blue-600 hover:bg-blue-100",
};

export function RecentTicketsTable() {
    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-gray-500 uppercase text-sm font-medium">Issue</CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs text-gray-500 font-normal">
                        <Filter className="w-3 h-3 mr-2" /> Filter
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs text-gray-500 font-normal">
                        <Calendar className="w-3 h-3 mr-2" /> Date Range
                    </Button>
                    <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
                        View All
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50 border-none rounded-lg">
                            <TableHead className="w-[100px]">Id Number</TableHead>
                            <TableHead>Summary</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Reporter</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentTickets.map((ticket) => (
                            <TableRow key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                <TableCell className="font-medium text-gray-500">{ticket.id}</TableCell>
                                <TableCell className="font-medium text-gray-800">{ticket.summary}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={ticket.assignee.img || `https://ui-avatars.com/api/?name=${ticket.assignee.name}&background=random`} />
                                            <AvatarFallback>{ticket.assignee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-700">{ticket.assignee.name}</span>
                                            <span className="text-[10px] text-gray-400">{ticket.assignee.role}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="flex items-center gap-2 text-gray-600">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${ticket.reporter}&background=random`} />
                                        <AvatarFallback>{ticket.reporter.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    {ticket.reporter}
                                </TableCell>
                                <TableCell>
                                    <Badge className={`rounded-md font-semibold ${statusStyles[ticket.status] || "bg-gray-100 text-gray-600"}`}>
                                        {ticket.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-gray-500">{ticket.created}</TableCell>
                                <TableCell className="text-gray-500">{ticket.updated}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
