"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import Cart from "./Cart";

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/#products", label: "Products" },
    { href: "/#about", label: "About Us" },
    { href: "/shop/orders", label: "Daftar Pesanan" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/5 bg-white/30 dark:bg-black/30 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="HepiBite"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span className="text-xl font-bold tracking-tighter">
            <span className="text-amber-500">Hepi</span>
            <span className="text-stone-700 dark:text-stone-300">Bite</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-400">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div onClick={() => setIsCartOpen(!isCartOpen)}>
            <Cart isOpen={isCartOpen} />
          </div>

          <ModeToggle />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white/80 dark:bg-neutral-900/80 text-foreground shadow-sm"
            aria-label="Toggle menu"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/90 dark:bg-black/90 backdrop-blur-lg border-t border-black/5 dark:border-white/5">
          <nav className="container mx-auto flex flex-col p-4 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2 text-center text-stone-700 dark:text-stone-300 rounded-md hover:bg-stone-100 dark:hover:bg-neutral-800"
                onClick={toggleMenu}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-stone-200 dark:border-neutral-800 my-2"></div>
          </nav>
        </div>
      )}
    </header>
  );
}
