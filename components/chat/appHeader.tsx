import Link from "next/link";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { HeaderUser } from "./headerUser";
import { SectionTabs, SectionTabsView } from "./sectionTabs";

export function AppHeader() {
	return (
		<header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
			<Link href="/" className="flex min-h-11 items-center gap-2.5">
				<svg aria-hidden="true" width="30" height="30" viewBox="0 0 30 30">
					<rect width="30" height="30" rx="9" className="fill-primary" />
					<path
						d="M8 21V10l7 7 7-7v11"
						fill="none"
						className="stroke-primary-foreground"
						strokeWidth="2.6"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
				<span className="font-display text-[22px] font-bold tracking-tight">mind</span>
			</Link>
			<Suspense fallback={<SectionTabsView />}>
				<SectionTabs />
			</Suspense>
			<Suspense fallback={<Skeleton className="h-11 w-28 rounded-xl" />}>
				<HeaderUser />
			</Suspense>
		</header>
	);
}
