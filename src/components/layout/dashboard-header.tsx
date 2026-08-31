import { SearchCommand } from "./search-command";
import { Sidebar } from "./sidebar";
import Link from "next/link";
import { Bell, Search, Settings, MessageSquare, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export function DashboardHeader() {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [openMessages, setOpenMessages] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [openSearch, setOpenSearch] = useState(false);
    const [openMobile, setOpenMobile] = useState(false);

    useEffect(() => {
        setOpenMobile(false);
    }, [pathname]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    const fetchRecentMessages = async () => {
        try {
            const res = await fetch("/api/messages");
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    useEffect(() => {
        if (session) {
            fetchNotifications();
            fetchRecentMessages();
            // Poll every 30 seconds
            const interval = setInterval(() => {
                fetchNotifications();
                fetchRecentMessages();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [session]);

    const handleNotificationClick = async (notification: any) => {
        // Mark as read
        try {
            await fetch("/api/notifications/mark-read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: notification.id }),
            });

            // Update local state
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
            setUnreadCount(prev => Math.max(0, prev - 1));
            window.dispatchEvent(new Event('ticket-stats-refresh'));
            setOpen(false);

            if (notification.link) {
                router.push(notification.link);
            }
        } catch (error) {
            console.error("Error clicking notification", error);
        }
    };

    const handleMessageClick = async (message: any) => {
        try {
            await fetch("/api/notifications/mark-read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: message.id }),
            });

            setMessages(prev => prev.filter(m => m.id !== message.id));
            window.dispatchEvent(new Event('ticket-stats-refresh'));
            setOpenMessages(false);

            if (message.link) {
                router.push(message.link);
            } else if (message.ticketId) {
                router.push(`/tickets/${message.ticketId}?tab=chat`);
            }
        } catch (error) {
            console.error("Error clicking message", error);
        }
    };

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications/mark-read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ all: true }),
            });
            setNotifications([]);
            setUnreadCount(0);
            window.dispatchEvent(new Event('ticket-stats-refresh'));
        } catch (error) {
            console.error("Error clearing notifications", error);
        }
    };

    return (
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md fixed top-0 left-0 right-0 md:left-72 z-50 transition-colors duration-300">
            <div className="flex items-center flex-1 max-w-2xl gap-2">
                {/* Mobile Sidebar */}
                <Sheet open={openMobile} onOpenChange={setOpenMobile}>
                    <SheetTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="md:hidden flex-shrink-0"
                        >
                            <Menu className="h-5 w-5" />
                            <span className="sr-only" translate="no">Toggle mobile menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r-0 w-full max-w-[80vw] sm:max-w-xs z-[100]">
                        <SheetTitle className="sr-only" translate="no">Navigasi Utama</SheetTitle>
                        <Sidebar />
                    </SheetContent>
                </Sheet>

                {/* Search Bar - Trigger */}
                <div
                    onClick={() => setOpenSearch(true)}
                    className="flex items-center w-9 h-9 sm:w-auto sm:h-auto sm:flex-1 justify-center sm:justify-start sm:max-w-xs md:max-w-md bg-muted/50 rounded-full sm:px-3 md:px-4 sm:py-2 border border-input focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-primary transition-all cursor-pointer group hover:bg-muted/80"
                >
                    <Search className="h-4 w-4 text-muted-foreground sm:mr-2 group-hover:text-primary transition-colors flex-shrink-0" />
                    <span className="hidden sm:inline-block text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1 truncate">Search...</span>
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 flex-shrink-0">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </div>
            </div>

            <SearchCommand open={openSearch} onOpenChange={setOpenSearch} />

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2 space-x-0">
                <div className="hidden sm:block">
                    <LanguageSwitcher />
                </div>
                <div className="hidden sm:block">
                    <ModeToggle />
                </div>

                <DropdownMenu open={openMessages} onOpenChange={setOpenMessages}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 dark:hover:text-green-400 relative transition-colors focus:ring-0">
                            <MessageSquare className="h-5 w-5" />
                            {messages.length > 0 && (
                                <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-green-500 rounded-full border border-background"></span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel className="font-semibold text-foreground">
                            Pesan Terakhir (Chat)
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="max-h-[300px] overflow-y-auto">
                            {messages.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    Belum ada pesan / chat masuk
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <DropdownMenuItem
                                        key={idx}
                                        className="cursor-pointer flex flex-col items-start p-3 focus:bg-muted"
                                        onClick={() => handleMessageClick(msg)}
                                    >
                                        <div className="flex justify-between w-full mb-1">
                                            <span className="font-medium text-sm text-foreground truncate mr-2">{msg.title}</span>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 w-full italic">"{msg.message}"</p>
                                    </DropdownMenuItem>
                                ))
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border border-background animate-pulse"></span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel className="flex justify-between items-center">
                            <span>Notifications</span>
                            {unreadCount > 0 && (
                                <span
                                    className="text-xs text-blue-600 cursor-pointer hover:underline font-normal"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        markAllRead();
                                    }}
                                >
                                    Mark all read
                                </span>
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No new notifications
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <DropdownMenuItem
                                        key={notification.id}
                                        className="cursor-pointer flex flex-col items-start p-3 focus:bg-muted"
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex justify-between w-full mb-1">
                                            <span className="font-medium text-sm text-foreground">{notification.title}</span>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                                    </DropdownMenuItem>
                                ))
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-8 w-[1px] bg-border mx-2"></div>

                {/* User Profile */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center space-x-3 hover:bg-transparent p-0">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-semibold text-foreground">
                                    {session?.user?.name || "User"}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                    {session?.user?.role?.replace("_", " ") || "Role"}
                                </p>
                            </div>
                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-border">
                                <AvatarImage src={session?.user?.image || `https://ui-avatars.com/api/?name=${session?.user?.name}&background=16a34a&color=fff`} />
                                <AvatarFallback>PB</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/profile" prefetch={true} className="cursor-pointer w-full">Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/preferences" prefetch={true} className="cursor-pointer w-full">Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => signOut()}>
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
