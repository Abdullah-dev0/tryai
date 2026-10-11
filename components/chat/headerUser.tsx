import Image from "next/image";

import { getSession } from "@/lib/data/auth";
import { SidebarUserActions } from "./sidebarUserActions";

export async function HeaderUser() {
	const session = await getSession();

	return (
		<div className="flex items-center gap-1">
			<SidebarUserActions />
			{session.user.image ? (
				<Image
					src={session.user.image}
					alt={session.user.name}
					width={44}
					height={44}
					className="h-11 w-11 rounded-xl border object-cover"
				/>
			) : (
				<div
					title={session.user.name}
					className="flex h-11 w-11 items-center justify-center rounded-xl border bg-secondary font-display text-base font-bold">
					{session.user.name.charAt(0).toUpperCase()}
				</div>
			)}
		</div>
	);
}
