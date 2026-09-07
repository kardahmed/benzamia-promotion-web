"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav, bookingCta } from "@/content/site";
import { Logo } from "./brand";
import { ArrowUpRight } from "./icons";

export function SiteHeader() {
  const pathname = usePathname();
  const overlay = pathname === "/";
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-40"
          : "sticky top-0 z-40 border-b border-hairline bg-paper/90 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="BENZAMIA Promotion — accueil">
          <Logo tone={overlay ? "white" : "color"} />
        </Link>

        <nav
          aria-label="Navigation principale"
          className={`hidden items-center gap-0.5 rounded-full px-2 py-1.5 text-sm font-medium lg:flex ${
            overlay
              ? "bg-paper/95 text-graphite shadow-lg shadow-black/5 backdrop-blur"
              : "text-graphite"
          }`}
        >
          {primaryNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 transition-colors hover:bg-ivory hover:text-ink ${
                  active ? "text-ink" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={bookingCta.href}
            className={`group hidden items-center gap-2 rounded-full py-2 pl-4 pr-2 text-sm font-medium sm:inline-flex ${
              overlay
                ? "bg-paper/95 text-ink shadow-lg shadow-black/5 backdrop-blur hover:bg-paper"
                : "bg-brand text-white hover:bg-brand-bright"
            }`}
          >
            {bookingCta.label}
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 ${
                overlay ? "bg-brand text-white" : "bg-white text-brand"
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>

          <button
            type="button"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`flex h-10 w-10 items-center justify-center rounded-full lg:hidden ${
              overlay ? "bg-paper/95 text-ink" : "border border-hairline text-ink"
            }`}
          >
            <span className="relative block h-3.5 w-4">
              <span
                className={`absolute left-0 h-0.5 w-full bg-current transition-transform ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-0.5 w-full bg-current transition-opacity ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 h-0.5 w-full bg-current transition-transform ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-hairline bg-paper lg:hidden">
          <nav
            aria-label="Navigation mobile"
            className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6"
          >
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="rounded-lg px-2 py-3 text-sm font-medium text-graphite hover:bg-ivory hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={bookingCta.href}
              onClick={close}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-medium text-white"
            >
              {bookingCta.label}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
