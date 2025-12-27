import { signOutAction } from "@/app/actions/authActions";
import { getSession } from "@/lib/data/auth";
import { LogOut, User as UserIcon } from "lucide-react";
import Image from "next/image";

export async function SidebarUser() {
	const session = await getSession();

	return (
		<div className="border-t p-3">
			<div className="flex items-center gap-3 rounded-lg px-2 py-2 group">
				{session.user.image ? (
					<Image
						src={session.user.image}
						alt={session.user.name}
						width={32}
						height={32}
						className="h-8 w-8 rounded-full object-cover"
					/>
				) : (
					<div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
						<UserIcon className="h-4 w-4 text-white" />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium truncate">{session.user.name}</p>
					<p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
				</div>
				<form action={signOutAction}>
					<button type="submit" title="Sign out" className="cursor-pointer hover:opacity-80">
						<LogOut className="h-4 w-4" color="red" />
					</button>
				</form>
			</div>
		</div>
	);
}
