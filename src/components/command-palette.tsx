"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Users, Building2, Handshake, LayoutDashboard, Megaphone, LifeBuoy } from "lucide-react";

interface SearchResult {
  contacts: { id: string; label: string; sub: string }[];
  companies: { id: string; label: string; sub: string }[];
  deals: { id: string; label: string; sub: string }[];
}

const EMPTY: SearchResult = { contacts: [], companies: [], deals: [] };

const QUICK_LINKS = [
  { label: "Go to Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Go to Contacts", href: "/contacts", icon: Users },
  { label: "Go to Companies", href: "/companies", icon: Building2 },
  { label: "Go to Deals", href: "/deals", icon: Handshake },
  { label: "Go to Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Go to Tickets", href: "/tickets", icon: LifeBuoy },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>(EMPTY);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(EMPTY);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (res.ok) setResults(await res.json());
      } catch {
        /* aborted */
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search contacts, companies, deals…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {results.contacts.length > 0 && (
          <CommandGroup heading="Contacts">
            {results.contacts.map((c) => (
              <CommandItem key={c.id} value={`contact-${c.id}-${c.label}`} onSelect={() => go(`/contacts/${c.id}`)}>
                <Users className="text-muted-foreground" />
                <span>{c.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{c.sub}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.companies.length > 0 && (
          <CommandGroup heading="Companies">
            {results.companies.map((c) => (
              <CommandItem key={c.id} value={`company-${c.id}-${c.label}`} onSelect={() => go(`/companies/${c.id}`)}>
                <Building2 className="text-muted-foreground" />
                <span>{c.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{c.sub}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.deals.length > 0 && (
          <CommandGroup heading="Deals">
            {results.deals.map((d) => (
              <CommandItem key={d.id} value={`deal-${d.id}-${d.label}`} onSelect={() => go(`/deals/${d.id}`)}>
                <Handshake className="text-muted-foreground" />
                <span>{d.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{d.sub}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Navigation">
          {QUICK_LINKS.map((link) => (
            <CommandItem key={link.href} value={link.label} onSelect={() => go(link.href)}>
              <link.icon className="text-muted-foreground" />
              <span>{link.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
