import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  CheckSquare,
  LifeBuoy,
  Megaphone,
  Filter,
  FileText,
  Inbox,
  UsersRound,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "CRM",
    items: [
      { label: "Contacts", href: "/contacts", icon: Users },
      { label: "Companies", href: "/companies", icon: Building2 },
      { label: "Deals", href: "/deals", icon: Handshake },
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Campaigns", href: "/campaigns", icon: Megaphone },
      { label: "Segments", href: "/segments", icon: Filter },
      { label: "Forms", href: "/forms", icon: FileText },
      { label: "Outbox", href: "/outbox", icon: Inbox },
    ],
  },
  {
    title: "Service",
    items: [{ label: "Tickets", href: "/tickets", icon: LifeBuoy }],
  },
  {
    title: "Settings",
    items: [
      { label: "Team", href: "/team", icon: UsersRound, adminOnly: true },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
