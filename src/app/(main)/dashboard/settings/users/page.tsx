"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
    id: string;
    nik: string;
    name: string;
    email: string | null;
    role: string;
    department: string | null;
    location: string | null;
    image: string | null;
    createdAt: string;
    updatedAt: string;
}

const ROLES = [
    { value: "IT_SUPPORT", label: "IT Support" },
    { value: "SUPERVISOR_SHOP", label: "Supervisor Shop" },
];

const DEPARTMENTS = [
    "IT Support",
    "Shop Operasional",
];

const LOCATIONS = [
    "Terminal 2",
    "Terminal 3",
    "Terminal 2 & 3",
];

export default function UserManagementPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        nik: "",
        name: "",
        email: "",
        password: "",
        role: "",
        department: "",
        location: "Terminal 2",
    });
    const [submitting, setSubmitting] = useState(false);

    // Check authorization
    useEffect(() => {
        if (session && session.user.role !== 'IT_SUPPORT') {
            router.push('/dashboard');
        }
    }, [session, router]);

    // Fetch users
    useEffect(() => {
        fetchUsers();
    }, []);

    // Filter users based on search
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredUsers(users);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredUsers(
                users.filter(
                    (user) =>
                        user.nik.toLowerCase().includes(query) ||
                        user.name.toLowerCase().includes(query) ||
                        user.email?.toLowerCase().includes(query) ||
                        user.role.toLowerCase().includes(query) ||
                        user.department?.toLowerCase().includes(query)
                )
            );
        }
    }, [searchQuery, users]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
                setFilteredUsers(data);
            } else {
                console.error(`Fetch users failed with status: ${response.status} ${response.statusText}`);
                try {
                    const text = await response.text();
                    console.error("Response body:", text);
                    try {
                        const errorData = JSON.parse(text);
                        toast.error(errorData.error || `Error ${response.status}: Failed to load users`);
                    } catch {
                        toast.error(`Error ${response.status}: ${response.statusText}`);
                    }
                } catch (e) {
                    console.error("Could not read response body", e);
                }

                if (response.status === 401 || response.status === 403) {
                    // specific handling
                }
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.nik || !formData.name || !formData.password || !formData.role) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch('/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success('User created successfully');
                setIsCreateDialogOpen(false);
                resetForm();
                fetchUsers();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to create user');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            toast.error('Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedUser || !formData.nik || !formData.name || !formData.role) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success('User updated successfully');
                setIsEditDialogOpen(false);
                resetForm();
                fetchUsers();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error('Failed to update user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;

        try {
            setSubmitting(true);
            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('User deleted successfully');
                setIsDeleteDialogOpen(false);
                setSelectedUser(null);
                fetchUsers();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setFormData({
            nik: user.nik,
            name: user.name,
            email: user.email || "",
            password: "", // Don't populate password
            role: user.role,
            department: user.department || "",
            location: user.location || "Terminal 2",
        });
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (user: User) => {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            nik: "",
            name: "",
            email: "",
            password: "",
            role: "",
            department: "",
            location: "Terminal 2",
        });
        setSelectedUser(null);
    };



    if (!session || session.user.role !== 'IT_SUPPORT') {
        return null;
    }

    return (
        <div className="min-h-screen bg-background/50">
            {/* Header */}
            <div className="bg-card border-b border-border px-4 md:px-6 py-4 sticky top-0 z-20 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between max-w-7xl mx-auto gap-4 sm:gap-0">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground">User Management</h1>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            Manage system users and their permissions
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            resetForm();
                            setIsCreateDialogOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                    >
                        <UserPlus className="w-4 h-4 mr-2 flex-shrink-0" />
                        Add User
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="Search by NIK, name, email, role, or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No users found matching your search.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {ROLES.map((roleDef) => {
                            const roleUsers = filteredUsers.filter(user => user.role === roleDef.value);

                            if (roleUsers.length === 0) return null;

                            return (
                                <Card key={roleDef.value} className="overflow-hidden border-t-4 border-t-primary/20">
                                    <CardHeader className="bg-background/50 pb-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                                {roleDef.label}
                                                <Badge variant="secondary" className="ml-2 font-normal">
                                                    {roleUsers.length} Users
                                                </Badge>
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="w-[150px] pl-6">NIK</TableHead>
                                                        <TableHead className="w-[200px]">Name</TableHead>
                                                        <TableHead className="w-[250px]">Email</TableHead>
                                                        <TableHead>Department</TableHead>
                                                        <TableHead>Location</TableHead>
                                                        <TableHead className="text-right pr-6">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {roleUsers.map((user) => (
                                                        <TableRow key={user.id} className="hover:bg-background/50">
                                                            <TableCell className="font-mono text-sm pl-6 font-medium text-foreground/80">
                                                                {user.nik}
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-8 w-8 bg-muted border border-border">
                                                                        <AvatarImage src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} />
                                                                        <AvatarFallback className="text-muted-foreground text-xs font-bold">
                                                                            {user.name?.substring(0, 2).toUpperCase()}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span>{user.name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">
                                                                {user.email || "-"}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {user.department || "-"}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {user.location || "-"}
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6">
                                                                <div className="flex justify-end gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0"
                                                                        onClick={() => openEditDialog(user)}
                                                                    >
                                                                        <Edit className="w-4 h-4 text-muted-foreground" />
                                                                    </Button>
                                                                    {session.user.role === 'IT_SUPPORT' && user.id !== session.user.id && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 hover:bg-red-50 dark:bg-red-900/20 hover:text-red-600"
                                                                            onClick={() => openDeleteDialog(user)}
                                                                        >
                                                                            <Trash2 className="w-4 h-4 text-red-400" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create User Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                            Add a new user to the system. All fields marked with * are required.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-nik">NIK *</Label>
                            <Input
                                id="create-nik"
                                value={formData.nik}
                                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                                placeholder="Ex: 8124070002"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-name">Name *</Label>
                            <Input
                                id="create-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Full name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-email">Email</Label>
                            <Input
                                id="create-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-password">Password *</Label>
                            <Input
                                id="create-password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Enter password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-role">Role *</Label>
                            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-department">Department</Label>
                            <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENTS.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-location">Location</Label>
                            <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LOCATIONS.map((loc) => (
                                        <SelectItem key={loc} value={loc}>
                                            {loc}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information. Leave password empty to keep current password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-nik">NIK *</Label>
                            <Input
                                id="edit-nik"
                                value={formData.nik}
                                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-password">Password (leave empty to keep current)</Label>
                            <Input
                                id="edit-password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Enter new password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role *</Label>
                            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-department">Department</Label>
                            <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENTS.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-location">Location</Label>
                            <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LOCATIONS.map((loc) => (
                                        <SelectItem key={loc} value={loc}>
                                            {loc}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Update User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
