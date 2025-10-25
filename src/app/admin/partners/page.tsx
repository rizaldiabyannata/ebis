'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { CreatePartnerForm } from '@/components/admin/create-partner-form';
import { PlusIcon } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  description: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchPartners = useCallback(async () => {
    const res = await fetch('/api/partners');
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
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>{partner.name}</TableCell>
                      <TableCell>{partner.description}</TableCell>
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
    </div>
  );
}
