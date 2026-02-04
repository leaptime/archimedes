import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border flex-col justify-between p-10">
                <div>
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-foreground">The Last Software</span>
                            <span className="text-xs text-muted-foreground">SaaS Composition</span>
                        </div>
                    </Link>
                </div>

                <div className="space-y-6">
                    <blockquote className="space-y-2">
                        <p className="text-lg text-foreground/80">
                            "This platform has transformed how we manage our SaaS stack. 
                            The modular approach saves us countless hours every week."
                        </p>
                        <footer className="text-sm text-muted-foreground">
                            <cite className="not-italic font-medium text-foreground">Sofia Chen</cite>
                            <span className="mx-2">—</span>
                            <span>CTO at TechFlow</span>
                        </footer>
                    </blockquote>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <Link to="#" className="hover:text-foreground transition-colors">Terms</Link>
                    <Link to="#" className="hover:text-foreground transition-colors">Privacy</Link>
                    <Link to="#" className="hover:text-foreground transition-colors">Contact</Link>
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-background">
                <div className="mx-auto w-full max-w-sm">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-semibold text-foreground">The Last Software</span>
                        </Link>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
                        {subtitle && (
                            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
                        )}
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
