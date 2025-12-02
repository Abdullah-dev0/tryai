
import { getConversations } from "@/app/actions/actions";
import { SidebarContent } from "./sidebarContent";

export async function Sidebar() {
	const conversations = await getConversations();

	return <SidebarContent conversations={conversations} />;
}
