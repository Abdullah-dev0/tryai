import { getConversations } from "@/app/actions/conversationActions";
import { Suspense } from "react";
import { SidebarSkeleton } from "../loading/sidebarSkeleton";
import { SidebarContent } from "./sidebarContent";
import { ErrorBoundary } from "../ui/error-boundary";
import { SidebarError } from "../errors/sidebarError";

export function Sidebar() {
	const conversations = getConversations();

	return (
		<div className="flex h-full w-64 shrink-0 flex-col border-r pt-4">
			<ErrorBoundary fallback={<SidebarError />}>
				<Suspense fallback={<SidebarSkeleton />}>
					<SidebarContent conversations={conversations} />
				</Suspense>
			</ErrorBoundary>
		</div>
	);
}
