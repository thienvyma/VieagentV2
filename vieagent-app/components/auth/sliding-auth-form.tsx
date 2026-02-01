"use client"

import { useState } from "react"

import { useTranslations } from "next-intl"
import { Button } from "@/components/core/ui/button"
import { Input } from "@/components/core/ui/input"
import { Label } from "@/components/core/ui/label"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "@/i18n/routing"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

interface SlidingAuthFormProps {
    defaultView?: "login" | "signup"
}

// Schemas
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2, "Name is required"),
})

export function SlidingAuthForm({ defaultView = "login" }: SlidingAuthFormProps) {
    const tAuth = useTranslations('Auth')
    const tLanding = useTranslations('Landing') // For overlay text
    const [isSignUp, setIsSignUp] = useState(defaultView === "signup")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Toggle function
    const toggleMode = () => setIsSignUp(!isSignUp)

    // Forms
    const loginForm = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
    })

    const signupForm = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
    })

    // Handlers
    const onLogin = async (data: z.infer<typeof loginSchema>) => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        })

        if (error) {
            toast.error(error.message)
            setIsLoading(false)
            return
        }

        toast.success(tAuth("successLogin"))
        router.refresh()
        router.push("/dashboard")
        setIsLoading(false) // redirection might happen first
    }

    const onSignup = async (data: z.infer<typeof signupSchema>) => {
        setIsLoading(true)
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    full_name: data.name,
                }
            }
        })

        if (error) {
            toast.error(error.message)
            setIsLoading(false)
            return
        }

        toast.success(tAuth("successSignup"))
        setIsLoading(false)
    }

    return (
        <div className="relative w-full max-w-[850px] min-h-[500px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden glass-panel border border-black/5 dark:border-white/20 flex flex-col md:flex-row">

            {/* --- MOBILE VIEW (Tabs) --- */}
            <div className="md:hidden w-full p-6 flex flex-col">
                <div className="flex w-full mb-6 bg-muted/50 rounded-lg p-1">
                    <button
                        onClick={() => setIsSignUp(false)}
                        className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all", !isSignUp ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" : "text-muted-foreground")}
                    >
                        {tAuth("loginButton")}
                    </button>
                    <button
                        onClick={() => setIsSignUp(true)}
                        className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all", isSignUp ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" : "text-muted-foreground")}
                    >
                        {tAuth("signupButton")}
                    </button>
                </div>

                {!isSignUp ? (
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="flex flex-col gap-4">
                        <h2 className="text-2xl font-bold text-center mb-2">{tAuth("loginTitle")}</h2>
                        <div className="space-y-2">
                            <Label>{tAuth("emailLabel")}</Label>
                            <Input {...loginForm.register("email")} placeholder="email@example.com" className="glass-input" />
                            {loginForm.formState.errors.email && <p className="text-xs text-red-500">{loginForm.formState.errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>{tAuth("passwordLabel")}</Label>
                            <Input type="password" {...loginForm.register("password")} placeholder="••••••••" className="glass-input" />
                            {loginForm.formState.errors.password && <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>}
                        </div>
                        <Button className="w-full mt-4 bg-gradient-to-r from-primary to-purple-600" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : tAuth("loginButton")}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={signupForm.handleSubmit(onSignup)} className="flex flex-col gap-4">
                        <h2 className="text-2xl font-bold text-center mb-2">{tAuth("signupTitle")}</h2>
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input {...signupForm.register("name")} placeholder="John Doe" className="glass-input" />
                            {signupForm.formState.errors.name && <p className="text-xs text-red-500">{signupForm.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>{tAuth("emailLabel")}</Label>
                            <Input {...signupForm.register("email")} placeholder="email@example.com" className="glass-input" />
                            {signupForm.formState.errors.email && <p className="text-xs text-red-500">{signupForm.formState.errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>{tAuth("passwordLabel")}</Label>
                            <Input type="password" {...signupForm.register("password")} placeholder="••••••••" className="glass-input" />
                            {signupForm.formState.errors.password && <p className="text-xs text-red-500">{signupForm.formState.errors.password.message}</p>}
                        </div>
                        <Button className="w-full mt-4 bg-gradient-to-r from-primary to-purple-600" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : tAuth("signupButton")}
                        </Button>
                    </form>
                )}
            </div>

            {/* --- DESKTOP VIEW (Sliding Overlay) --- */}

            {/* 1. SIGN IN FORM PANEL (Underneath left) */}
            <div className="hidden md:flex absolute top-0 left-0 h-full w-1/2 flex-col justify-center items-center p-8 z-10 transition-all duration-500 ease-in-out"
                style={{ transform: isSignUp ? 'translateX(100%)' : 'translateX(0)', opacity: isSignUp ? 0 : 1, pointerEvents: isSignUp ? 'none' : 'auto' }}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="w-full max-w-[300px] flex flex-col gap-4">
                    <h2 className="text-3xl font-bold text-center">{tAuth("loginTitle")}</h2>
                    <span className="text-xs text-center text-muted-foreground">{tAuth("loginDesc")}</span>

                    <div className="space-y-1">
                        <Input {...loginForm.register("email")} placeholder={tAuth("emailLabel")} className="glass-input bg-gray-50/50 dark:bg-black/20" />
                        {loginForm.formState.errors.email && <p className="text-xs text-red-500">{loginForm.formState.errors.email.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Input type="password" {...loginForm.register("password")} placeholder={tAuth("passwordLabel")} className="glass-input bg-gray-50/50 dark:bg-black/20" />
                        {loginForm.formState.errors.password && <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>}
                    </div>

                    <span className="text-xs text-right cursor-pointer hover:text-primary">{tAuth("forgotPassword")}</span>
                    <Button className="mt-2 bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/20" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : tAuth("loginButton")}
                    </Button>
                </form>
            </div>

            {/* 2. SIGN UP FORM PANEL (Underneath right) */}
            <div className="hidden md:flex absolute top-0 left-0 h-full w-1/2 flex-col justify-center items-center p-8 z-10 transition-all duration-500 ease-in-out"
                style={{ transform: isSignUp ? 'translateX(0)' : 'translateX(100%)', opacity: isSignUp ? 1 : 0, pointerEvents: isSignUp ? 'auto' : 'none', zIndex: 1 }}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="w-full max-w-[300px] flex flex-col gap-4">
                    <h2 className="text-3xl font-bold text-center">{tAuth("signupTitle")}</h2>
                    <span className="text-xs text-center text-muted-foreground">{tAuth("signupDesc")}</span>

                    <div className="space-y-1">
                        <Input {...signupForm.register("name")} placeholder="Full Name" className="glass-input bg-gray-50/50 dark:bg-black/20" />
                        {signupForm.formState.errors.name && <p className="text-xs text-red-500">{signupForm.formState.errors.name.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Input {...signupForm.register("email")} placeholder={tAuth("emailLabel")} className="glass-input bg-gray-50/50 dark:bg-black/20" />
                        {signupForm.formState.errors.email && <p className="text-xs text-red-500">{signupForm.formState.errors.email.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Input type="password" {...signupForm.register("password")} placeholder={tAuth("passwordLabel")} className="glass-input bg-gray-50/50 dark:bg-black/20" />
                        {signupForm.formState.errors.password && <p className="text-xs text-red-500">{signupForm.formState.errors.password.message}</p>}
                    </div>

                    <Button className="mt-2 bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/20" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : tAuth("signupButton")}
                    </Button>
                </form>
            </div>


            {/* 3. OVERLAY CONTAINER */}
            <div
                className="hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-500 ease-in-out z-50 rounded-l-[100px] rounded-r-none"
                style={{
                    transform: isSignUp ? 'translateX(-100%)' : 'translateX(0)',
                    borderRadius: isSignUp ? '0 100px 100px 0' : '100px 0 0 100px'
                }}
            >
                <div className="bg-gradient-to-tr from-primary to-purple-600 dark:from-violet-900 dark:to-purple-900 text-white relative -left-full h-full w-[200%] transform transition-transform duration-500 ease-in-out flex flex-row"
                    style={{ transform: isSignUp ? 'translateX(50%)' : 'translateX(0)' }}
                >
                    <div className="w-1/2 h-full flex flex-col items-center justify-center text-center px-10">
                        <h1 className="text-4xl font-bold mb-4">{tAuth("haveAccount")}</h1>
                        <p className="text-sm mb-8 opacity-90">{tLanding("ctaSubtitle")}</p>
                        <button
                            onClick={toggleMode}
                            className="px-10 py-3 rounded-full border border-white bg-transparent hover:bg-white/20 transition-all font-semibold uppercase tracking-wider text-xs"
                        >
                            {tAuth("loginButton")}
                        </button>
                    </div>

                    <div className="w-1/2 h-full flex flex-col items-center justify-center text-center px-10">
                        <h1 className="text-4xl font-bold mb-4">{tLanding("heroBadge")}</h1>
                        <p className="text-sm mb-8 opacity-90">{tLanding("featuresSubtitle")}</p>
                        <button
                            onClick={toggleMode}
                            className="px-10 py-3 rounded-full border border-white bg-transparent hover:bg-white/20 transition-all font-semibold uppercase tracking-wider text-xs"
                        >
                            {tAuth("signupButton")}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    )
}
