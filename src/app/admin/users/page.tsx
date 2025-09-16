"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  role: string;
}

const seedUsers: UserRow[] = [
  { id: "u1", name: "Alice", email: "alice@example.com", role: "admin" },
  { id: "u2", name: "Bob", email: "bob@example.com", role: "editor" },
  { id: "u3", name: "Charlie", email: "charlie@example.com", role: "viewer" },
];

export default function UsersPage() {
  const [users, setUsers] = React.useState<UserRow[]>(seedUsers);
  const [search, setSearch] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [newUser, setNewUser] = React.useState({
    name: "",
    email: "",
    role: "viewer",
  });
  const [confirmDelete, setConfirmDelete] = React.useState<{
    id: string;
    open: boolean;
  }>({ id: "", open: false });

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    setUsers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
      },
    ]);
    setNewUser({ name: "", email: "", role: "viewer" });
  };

  const startEdit = (id: string) => setEditingId(id);
  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id: string, partial: Partial<Omit<UserRow, "id">>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...partial } : u))
    );
  };

  const confirmDeleteUser = (id: string) =>
    setConfirmDelete({ id, open: true });
  const closeDialog = () => setConfirmDelete({ id: "", open: false });
  const deleteUser = () => {
    setUsers((prev) => prev.filter((u) => u.id !== confirmDelete.id));
    closeDialog();
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>Users</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add User Form */}
          <div className="grid gap-2 sm:grid-cols-4">
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
              placeholder="Role (admin/editor/viewer)"
              value={newUser.role}
              onChange={(e) =>
                setNewUser((nu) => ({ ...nu, role: e.target.value }))
              }
            />
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
                              saveEdit(u.id, { name: e.target.value })
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
                              saveEdit(u.id, { email: e.target.value })
                            }
                          />
                        ) : (
                          <span>{u.email}</span>
                        )}
                      </td>
                      <td className="p-2 align-top">
                        {isEditing ? (
                          <Input
                            value={u.role}
                            onChange={(e) =>
                              saveEdit(u.id, { role: e.target.value })
                            }
                          />
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
                                onClick={() => setEditingId(null)}
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
