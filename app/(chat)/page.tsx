import { Sparkles, MessageSquarePlus, Zap, Shield } from "lucide-react";
import { getConversations } from "../actions/conversationActions";
import CreateConversationButton from "@/components/chat/createConversationButton";

export default async function HomePage() {
	const conversations = await getConversations();

	return (
		<div className="flex h-full w-full flex-col bg-background">
			{/* Header */}
			<header className="flex items-center justify-between border-b px-8 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20">
						<Sparkles className="h-5 w-5 text-primary-foreground" />
					</div>
					<h1 className="text-lg font-bold tracking-tight text-foreground">TryAI</h1>
				</div>
			</header>

			{/* Main Content Area */}
			<main className="flex-1 flex flex-col items-center justify-center px-6">
				<div className="relative w-full max-w-2xl text-center space-y-8">
					{/* Subtle background decoration */}
					<div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 blur-3xl rounded-full -z-10" />

					{/* Hero Icon */}
					<div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-muted border shadow-sm transition-transform hover:scale-105">
						<Sparkles className="h-10 w-10 text-primary" />
					</div>

					{/* Text Content */}
					<div className="space-y-4">
						<h2 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
							What will we build today?
						</h2>
						<p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
							Start a fresh conversation with your AI assistant or pick up where you left off from the sidebar.
						</p>
					</div>

					{/* Action Area */}
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
						<CreateConversationButton
							className="h-12 px-8 text-base shadow-lg shadow-primary/20"
							conversations={conversations}
						/>
					</div>

					{/* Feature Grid (Optional minimalist cues) */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t mt-12">
						{[
							{ icon: Zap, text: "Instant Answers" },
							{ icon: MessageSquarePlus, text: "Natural Chat" },
							{ icon: Shield, text: "Secure Storage" },
						].map((feature, i) => (
							<div
								key={i}
								className="flex items-center justify-center gap-2 text-muted-foreground/80 hover:text-foreground transition-colors">
								<feature.icon className="h-4 w-4 text-primary" />
								<span className="text-sm font-medium">{feature.text}</span>
							</div>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
