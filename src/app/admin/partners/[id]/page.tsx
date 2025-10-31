'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'next/navigation';

interface Partner {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
}

export default function PartnerDetailPage() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    if (id) {
      async function fetchPartner() {
        setLoading(true);
        try {
          const res = await fetch(`/api/partners/${id}`);
          if (!res.ok) throw new Error('Failed to fetch partner');
          const data = await res.json();
          setPartner(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
      fetchPartner();
    }
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!partner) {
    return <div>Partner not found</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={partner.imageUrl} alt={partner.name} />
              <AvatarFallback>{partner.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl">{partner.name}</CardTitle>
              <CardDescription>{partner.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            A list of products from this partner.
          </CardDescription>
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
              {partner.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
