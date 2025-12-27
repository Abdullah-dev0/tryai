import { SignInButtons } from "@/components/authButtons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Shield, MessageSquare } from "lucide-react";
import Image from "next/image";

export default function SignInPage() {
	return (
		<div className="min-h-screen w-full bg-background">
			<div className="flex min-h-screen">
				{/* Left side - Branding & Features */}
				<div className="hidden lg:flex lg:w-1/2 flex-col justify-center border-r px-12 xl:px-24">
					<div className="max-w-lg space-y-8">
						{/* Logo */}
						<div className="flex items-center gap-3 mb-12">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 overflow-hidden">
								<Image src="/logo.png" alt="Mind Logo" width={48} height={48} className="object-cover" />
							</div>
							<span className="text-2xl font-bold text-foreground">Mind</span>
						</div>

						{/* Hero text */}
						<div className="space-y-4">
							<h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-foreground">
								Experience the future of AI conversation
							</h1>
							<p className="text-lg text-muted-foreground leading-relaxed max-w-md">
								Unlock the power of intelligent dialogue. Create, explore, and build with your personal AI assistant.
							</p>
						</div>

						{/* Features */}
						<div className="space-y-4 pt-8">
							<FeatureItem
								icon={Zap}
								title="Lightning Fast"
								description="Get instant, accurate responses powered by cutting-edge AI"
							/>
							<FeatureItem
								icon={MessageSquare}
								title="Natural Dialogue"
								description="Converse naturally with context-aware understanding"
							/>
							<FeatureItem
								icon={Shield}
								title="Private & Secure"
								description="Your conversations are encrypted and never shared"
							/>
						</div>
					</div>
				</div>

				{/* Right side - Sign In Card */}
				<div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
					<div className="w-full max-w-md">
						{/* Mobile logo */}
						<div className="flex lg:hidden items-center justify-center gap-3 mb-8">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 overflow-hidden">
								<Image src="/logo.png" alt="Mind Logo" width={48} height={48} className="object-cover" />
							</div>
							<span className="text-2xl font-bold text-foreground">Mind</span>
						</div>

						{/* Sign in card */}
						<Card>
							<CardHeader className="space-y-1 pb-6">
								<CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
								<CardDescription className="text-center">Sign in to continue your AI journey</CardDescription>
							</CardHeader>

							<CardContent className="space-y-4">
								{/* Sign In Buttons - Client Component */}
								<SignInButtons />

								{/* Divider */}
								<div className="relative my-6">
									<div className="absolute inset-0 flex items-center">
										<div className="w-full border-t" />
									</div>
									<div className="relative flex justify-center text-xs uppercase">
										<span className="bg-card px-3 text-muted-foreground">Secure authentication</span>
									</div>
								</div>

								{/* Trust badges */}
								<div className="flex items-center justify-center gap-4 pt-2">
									<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
										<Shield className="h-3.5 w-3.5 text-primary" />
										<span>SSL Encrypted</span>
									</div>
									<div className="h-3 w-px bg-border" />
									<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
										<Zap className="h-3.5 w-3.5 text-primary" />
										<span>Instant Access</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Terms */}
						<p className="mt-6 text-center text-xs text-muted-foreground">
							By signing in, you agree to our{" "}
							<a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
								Terms of Service
							</a>{" "}
							and{" "}
							<a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
								Privacy Policy
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function FeatureItem({
	icon: Icon,
	title,
	description,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	description: string;
}) {
	return (
		<div className="group flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-muted">
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted border">
				<Icon className="h-5 w-5 text-primary" />
			</div>
			<div>
				<h3 className="font-semibold text-foreground">{title}</h3>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
		</div>
	);
}
