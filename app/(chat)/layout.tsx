import { ApiKeyProvider } from "@/contexts/apiKeyContext";
import { AppHeader } from "@/components/chat/appHeader";
import { Sidebar } from "@/components/chat/sidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
	return (
		<ApiKeyProvider>
			<div className="flex h-screen w-full flex-col">
				<AppHeader />
				<div className="flex min-h-0 flex-1">
					<Sidebar />
					<div className="min-w-0 flex-1 overflow-hidden">{children}</div>
				</div>
			</div>
		</ApiKeyProvider>
	);
}
