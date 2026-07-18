"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Edit,
  Loader2,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import AdminSidebar from "@/components/admin-sidebar";
import { cn } from "@/lib/utils";

type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
  createdAt: string;
};

type UsersResponse = {
  data: AdminUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const roleClasses: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  user: "bg-blue-100 text-blue-700",
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    id: "",
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "user" as "user" | "admin",
    vehicle_number: "",
    vehicle_type: "Car" as "Bike" | "Car" | "Truck",
  });

  const { data: apiUsers, isLoading, isFetching, isError } = useQuery<UsersResponse>({
    queryKey: ["admin-users", page, search],
    queryFn: async (): Promise<UsersResponse> => {
      const res = await fetch(`/api/v1/admin/users?page=${page}&limit=10&search=${encodeURIComponent(search)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json() as Promise<UsersResponse>;
    },
  });

  const users = apiUsers?.data ?? [];
  const meta = apiUsers?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 };

  function openCreate() {
    setEditingUser(null);
    setForm({ id: "", full_name: "", email: "", phone: "", password: "", role: "user", vehicle_number: "", vehicle_type: "Car" });
    setError("");
    setShowModal(true);
  }

  function openEdit(u: AdminUser) {
    setEditingUser(u);
    setForm({ id: u.id, full_name: u.full_name, email: u.email, phone: u.phone, password: "", role: u.role, vehicle_number: "", vehicle_type: "Car" });
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingUser(null);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      const isEdit = !!editingUser;
      const url = isEdit ? `/api/v1/admin/users/${form.id}` : "/api/v1/admin/users";
      const method = isEdit ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        vehicle_number: form.vehicle_number,
        vehicle_type: form.vehicle_type,
      };
      if (form.password) {
        body.password = form.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || (isEdit ? "Failed to update user" : "Failed to create user"));
      }

      closeModal();
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Failed to delete user");
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
            <CardDescription>Sign in with an admin account to view users.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/frontend/admin/login">
              <Button className="w-full">Go to Admin Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">Manage all registered users.</p>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View and manage users</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 w-full md:w-auto md:min-w-[240px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading || isFetching ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : isError ? (
              <div className="py-8 text-center text-destructive">Failed to load users. Please try again.</div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No users found</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left">ID</th>
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Email</th>
                        <th className="p-3 text-left">Phone</th>
                        <th className="p-3 text-center">Role</th>
                        <th className="p-3 text-left">Joined</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-mono text-xs text-muted-foreground">{u.id.slice(0, 8)}</td>
                          <td className="p-3 font-medium">{u.full_name}</td>
                          <td className="p-3">{u.email}</td>
                          <td className="p-3">{u.phone}</td>
                          <td className="p-3 text-center">
                            <Badge className={cn("capitalize", roleClasses[u.role])}>{u.role}</Badge>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">{formatDate(u.createdAt)}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(u)}
                                disabled={deletingId === u.id}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(u.id)}
                                disabled={deletingId === u.id}
                              >
                                {deletingId === u.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((meta.page - 1) * meta.limit) + 1}-{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (meta.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (meta.page <= 3) {
                        pageNum = i + 1;
                      } else if (meta.page >= meta.totalPages - 2) {
                        pageNum = meta.totalPages - 4 + i;
                      } else {
                        pageNum = meta.page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1 rounded text-sm ${pageNum === meta.page ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {meta.page > 1 && (
                      <button onClick={() => setPage(meta.page - 1)} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
                        Prev
                      </button>
                    )}
                    {meta.page < meta.totalPages && (
                      <button onClick={() => setPage(meta.page + 1)} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
                        Next
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{editingUser ? "Edit User" : "Create User"}</CardTitle>
                <CardDescription>{editingUser ? "Update user details." : "Add a new user to the platform."}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
                    <Input
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone <span className="text-destructive">*</span></label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Phone"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password {editingUser ? <span className="text-xs font-normal text-muted-foreground">(leave blank to keep current)</span> : <span className="text-destructive">*</span>}</label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={editingUser ? "New password (optional)" : "Password"}
                      required={!editingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vehicle Number <span className="text-destructive">*</span></label>
                    <Input
                      value={form.vehicle_number}
                      onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                      placeholder="e.g. BA 1 PA 1234"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vehicle Type</label>
                    <select
                      value={form.vehicle_type}
                      onChange={(e) => setForm({ ...form, vehicle_type: e.target.value as "Bike" | "Car" | "Truck" })}
                      className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Bike">Bike</option>
                      <option value="Car">Car</option>
                      <option value="Truck">Truck</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as "user" | "admin" })}
                      className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={closeModal} disabled={creating}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={creating}>
                      {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {editingUser ? "Saving…" : "Creating…"}</> : editingUser ? "Save Changes" : "Create User"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
