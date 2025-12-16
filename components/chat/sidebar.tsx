import Link from "next/link";
import { User } from "lucide-react";

import { getConversations } from "@/app/actions/actions";
import { SidebarContent } from "./sidebarContent";
import { Suspense } from "react";
import { SidebarSkeleton } from "../loading/sidebarSkeleton";

export async function Sidebar() {
	const conversations = getConversations();

	return (
		<div className="hidden w-64 flex-col bg-card md:flex">
			{/* Header with Logo - Static, server rendered */}
			<div className="flex h-14 items-center px-4">
				<Link href="/" className="text-lg font-bold hover:opacity-80 transition-opacity">
					TryAI
				</Link>
			</div>

			<Suspense fallback={<SidebarSkeleton />}>
				<SidebarContent conversations={conversations} />
			</Suspense>

			{/* User Profile - Static, server rendered */}
			<div className="border-t p-3">
				<div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors cursor-pointer">
					<div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
						<User className="h-4 w-4 text-white" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium truncate">User</p>
						<p className="text-xs text-muted-foreground">Free</p>
					</div>
				</div>
			</div>
		</div>
	);
}
