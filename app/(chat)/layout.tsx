import { Sidebar } from "@/components/chat/sidebar";
import { SidebarError } from "@/components/errors/sidebarError";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex h-screen w-full">
			<ErrorBoundary fallback={<SidebarError />}>
				<Sidebar />
			</ErrorBoundary>
			<div className="flex-1 overflow-hidden">{children}</div>
		</div>
	);
}
