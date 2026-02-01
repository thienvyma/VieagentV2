"use client"

import { useState } from "react"
import { Link, useRouter } from "@/i18n/routing"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/core/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/core/ui/card"
import { Input } from "@/components/core/ui/input"
import { Label } from "@/components/core/ui/label"
import { createClient } from "@/utils/supabase/client"
import { useTranslations } from "next-intl"

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export default function SignupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()
    const t = useTranslations("Auth")

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
    })

    async function onSubmit(data: z.infer<typeof signupSchema>) {
        setIsLoading(true)

        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        })

        if (error) {
            toast.error(error.message)
            setIsLoading(false)
            return
        }

        toast.success(t("successSignup"))
        setIsLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">{t("signupTitle")}</CardTitle>
                    <CardDescription>
                        {t("signupDesc")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t("emailLabel")}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">{t("passwordLabel")}</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">{t("passwordLabel")} (Confirm)</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                required
                                {...register("confirmPassword")}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("signupButton")}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        {t("haveAccount")}{" "}
                        <Link href="/login" className="underline">
                            {t("loginButton")}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
