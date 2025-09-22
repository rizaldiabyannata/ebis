"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN" | string;
}

export default function UsersPage() {
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [search, setSearch] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [newUser, setNewUser] = React.useState({
    name: "",
    email: "",
    role: "ADMIN",
    password: "",
  });
  const [confirmDelete, setConfirmDelete] = React.useState<{
    id: string;
    open: boolean;
  }>({ id: "", open: false });
  const [loading, setLoading] = React.useState(false);

  const loadUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admins", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to load users (${res.status})`);
      }
      const data: UserRow[] = await res.json();
      setUsers(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    if (newUser.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          password: newUser.password,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to create user (${res.status})`);
      }
      const created: UserRow = await res.json();
      setUsers((prev) => [...prev, created]);
      setNewUser({ name: "", email: "", role: "ADMIN", password: "" });
      toast.success("User created");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create user");
    }
  };

  const startEdit = (id: string) => setEditingId(id);
  const cancelEdit = () => setEditingId(null);

  const saveEditLocal = (id: string, partial: Partial<Omit<UserRow, "id">>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...partial } : u))
    );
  };

  const persistEdit = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return setEditingId(null);
    try {
      const { name, email, role } = user;
      const res = await fetch(`/api/admins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to update user (${res.status})`);
      }
      const updated: UserRow = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      toast.success("User updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update user");
      // Reload to revert local edits if failed
      loadUsers();
    } finally {
      setEditingId(null);
    }
  };

  const confirmDeleteUser = (id: string) =>
    setConfirmDelete({ id, open: true });
  const closeDialog = () => setConfirmDelete({ id: "", open: false });
  const deleteUser = async () => {
    try {
      const id = confirmDelete.id;
      const res = await fetch(`/api/admins/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to delete user (${res.status})`);
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete user");
    } finally {
      closeDialog();
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <div className="p-4">
          <PageHeader
            title="Users"
            description="Manage administrator accounts and roles."
            count={users.length}
            actions={
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="sm:w-64"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadUsers}
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            }
          />
        </div>
        <CardContent className="space-y-6">
          {/* Add User Form */}
          <div className="grid gap-2 sm:grid-cols-5">
            <Input
              placeholder="Name"
              value={newUser.name}
              onChange={(e) =>
                setNewUser((nu) => ({ ...nu, name: e.target.value }))
              }
            />
            <Input
              placeholder="Email"
              type="email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser((nu) => ({ ...nu, email: e.target.value }))
              }
            />
            <Input
              placeholder="Password"
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser((nu) => ({ ...nu, password: e.target.value }))
              }
            />
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={newUser.role}
              onChange={(e) =>
                setNewUser((nu) => ({ ...nu, role: e.target.value }))
              }
            >
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
            <Button type="button" onClick={handleAdd} className="w-full">
              Add User
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-2 font-medium">Name</th>
                  <th className="p-2 font-medium">Email</th>
                  <th className="p-2 font-medium">Role</th>
                  <th className="p-2 font-medium w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
                {filtered.map((u) => {
                  const isEditing = editingId === u.id;
                  return (
                    <tr key={u.id} className="border-t">
                      <td className="p-2 align-top">
                        {isEditing ? (
                          <Input
                            value={u.name}
                            onChange={(e) =>
                              saveEditLocal(u.id, { name: e.target.value })
                            }
                          />
                        ) : (
                          <span>{u.name}</span>
                        )}
                      </td>
                      <td className="p-2 align-top">
                        {isEditing ? (
                          <Input
                            value={u.email}
                            type="email"
                            onChange={(e) =>
                              saveEditLocal(u.id, { email: e.target.value })
                            }
                          />
                        ) : (
                          <span>{u.email}</span>
                        )}
                      </td>
                      <td className="p-2 align-top">
                        {isEditing ? (
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            value={u.role}
                            onChange={(e) =>
                              saveEditLocal(u.id, { role: e.target.value })
                            }
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        ) : (
                          <span className="uppercase tracking-wide text-xs font-medium px-2 py-1 rounded bg-accent text-accent-foreground">
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="p-2 align-top">
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => persistEdit(u.id)}
                              >
                                Done
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => startEdit(u.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmDeleteUser(u.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmDelete.open}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user will be removed from the
              list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
