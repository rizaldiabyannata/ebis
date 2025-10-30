"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { CreatePartnerForm } from "@/components/admin/create-partner-form";
import { EditPartnerForm } from "@/components/admin/edit-partner-form";
import { MoreHorizontal, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Partner {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);
  const router = useRouter();

  const handleDeletePartner = async () => {
    if (!deletingPartner) return;
    try {
      const res = await fetch(`/api/partners/${deletingPartner.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.error || `Failed to delete partner (${res.status})`
        );
      }
      toast.success("Partner deleted successfully");
      setDeletingPartner(null);
      fetchPartners();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete partner");
    }
  };

  const fetchPartners = useCallback(async () => {
    const res = await fetch("/api/partners");
    const data = await res.json();
    setPartners(data);
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Partners</CardTitle>
              <CardDescription>Manage your partners.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow
                      key={partner.id}
                      onClick={() =>
                        router.push(`/admin/partners/${partner.id}`)
                      }
                      className="cursor-pointer"
                    >
                      <TableCell>
                        {partner.imageUrl && (
                          <Image
                            src={partner.imageUrl}
                            alt={partner.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        )}
                      </TableCell>
                      <TableCell>{partner.name}</TableCell>
                      <TableCell>{partner.description}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onSelect={() => setEditingPartner(partner)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => setDeletingPartner(partner)}
                              className="text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Sheet open={createOpen} onOpenChange={setCreateOpen}>
                <SheetTrigger asChild>
                  <Button type="button" size="sm">
                    <PlusIcon className="mr-2 size-4" /> Add Partner
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Create Partner</SheetTitle>
                    <SheetDescription>
                      Fill the form below to add a new partner.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="p-4">
                    <CreatePartnerForm
                      onSuccess={() => {
                        setCreateOpen(false);
                        fetchPartners();
                      }}
                      onCancel={() => setCreateOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </CardFooter>
          </Card>
        </main>
      </div>
      <AlertDialog
        open={!!deletingPartner}
        onOpenChange={(open) => !open && setDeletingPartner(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              partner &quot;{deletingPartner?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePartner}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Sheet
        open={!!editingPartner}
        onOpenChange={(open) => !open && setEditingPartner(null)}
      >
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Partner</SheetTitle>
            <SheetDescription>
              Update the details for &quot;{editingPartner?.name}&quot;.
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            {editingPartner && (
              <EditPartnerForm
                initialData={editingPartner}
                onSuccess={() => {
                  setEditingPartner(null);
                  fetchPartners();
                }}
                onCancel={() => setEditingPartner(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
