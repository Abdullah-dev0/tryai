import { ApiKeyProvider } from "@/contexts/apiKeyContext";
import { Sidebar } from "@/components/chat/sidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
	return (
		<ApiKeyProvider>
			<div className="flex h-screen w-full">
				<Sidebar />
				<div className="flex-1 overflow-hidden">{children}</div>
			</div>
		</ApiKeyProvider>
	);
}
