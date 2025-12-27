"server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * Data Access Layer for authentication.
 * These functions provide read-only access to session data.
 * Use server actions in app/actions/authActions.ts for mutations.
 */

/**
 * Get the current session in a server component.
 * Returns null if no session exists.
 * This function is cached per request to avoid duplicate API calls.
 */
export const getSession = cache(async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/signin");
	}

	return session;
});
