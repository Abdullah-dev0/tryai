"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
	{ href: "/", label: "Chat" },
	{ href: "/compare", label: "Compare" },
	{ href: "/usage", label: "Usage" },
];

export function SectionTabs() {
	const pathname = usePathname();
	const activeHref = TABS.find((tab) => tab.href !== "/" && pathname.startsWith(tab.href))?.href ?? "/";

	return <SectionTabsView activeHref={activeHref} />;
}

export function SectionTabsView({ activeHref }: { activeHref?: string }) {
	return (
		<nav aria-label="Sections" className="flex gap-1 rounded-full border bg-card p-1">
			{TABS.map((tab) => {
				const isActive = tab.href === activeHref;
				return (
					<Link
						key={tab.href}
						href={tab.href}
						aria-current={isActive ? "page" : undefined}
						className={cn(
							"flex h-9 items-center rounded-full px-[18px] text-sm transition-colors",
							isActive
								? "bg-primary font-semibold text-primary-foreground"
								: "font-medium text-foreground hover:bg-accent",
						)}>
						{tab.label}
					</Link>
				);
			})}
		</nav>
	);
}
