import Link from "next/link";
import Image from "next/image";

import { getConversations } from "@/app/actions/conversationActions";
import { Suspense } from "react";
import { SidebarSkeleton } from "../loading/sidebarSkeleton";
import { SidebarContent } from "./sidebarContent";
import { SidebarUser } from "./sidebarUser";
import { ErrorBoundary } from "../ui/error-boundary";
import { SidebarError } from "../errors/sidebarError";

export async function Sidebar() {
	const conversations = getConversations();

	return (
		<div className="h-full w-64 flex-col bg-card md:flex border-r">
			{/* Header with Logo - Static, server rendered */}
			<div className="flex h-14 items-center py-9 px-4">
				<Link href="/">
					<Image src="/logo.png" alt="Mind Logo" width={50} height={50} />
				</Link>
			</div>
			<ErrorBoundary fallback={<SidebarError />}>
				<Suspense fallback={<SidebarSkeleton />}>
					<SidebarContent conversations={conversations} />
				</Suspense>
			</ErrorBoundary>
			{/* New Chat Button */}

			{/* User Profile - Streamed with session */}
			<Suspense fallback={<SidebarUserSkeleton />}>
				<SidebarUser />
			</Suspense>
		</div>
	);
}

function SidebarUserSkeleton() {
	return (
		<div className="border-t p-3">
			<div className="flex items-center gap-3 rounded-lg px-2 py-2">
				<div className="h-8 w-8 shrink-0 rounded-full bg-muted animate-pulse" />
				<div className="flex-1 min-w-0">
					<div className="h-5 w-24 rounded bg-muted animate-pulse" />
					<div className="h-4 w-32 rounded bg-muted animate-pulse mt-0.5" />
				</div>
				<div className="h-4 w-4 shrink-0 rounded bg-muted animate-pulse" />
			</div>
		</div>
	);
}
