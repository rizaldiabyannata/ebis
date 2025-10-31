"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="w-full fixed top-0 left-0 z-50 backdrop-blur-lg bg-white/70 dark:bg-neutral-900/70 border-b border-neutral-200 dark:border-neutral-800 shadow-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="rounded-full bg-gradient-to-tr from-primary/60 to-secondary/60 p-2 shadow-md">
            <Image
              src="/globe.svg"
              alt="Logo"
              width={28}
              height={28}
              className="transition-transform group-hover:scale-110"
            />
          </span>
          <span className="font-bold text-xl text-primary tracking-tight drop-shadow-sm">
            HepiBite
          </span>
        </Link>
        {/* Desktop Menu */}
        <div className="hidden md:flex gap-2 items-center">
          <Link
            href="/product"
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Product
          </Link>
          <Link
            href="/chart"
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Chart
          </Link>
        </div>
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </Button>
        </div>
      </div>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-2 px-4 py-4 border-b bg-white/90 dark:bg-neutral-900/90 animate-in fade-in slide-in-from-top-2 rounded-b-2xl shadow-lg">
          <Link
            href="/product"
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Product
          </Link>
          <Link
            href="/chart"
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Chart
          </Link>
        </div>
      )}
    </nav>
  );
}
