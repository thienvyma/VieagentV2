"use client"

import { SlidingAuthForm } from "@/components/auth/sliding-auth-form"

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <SlidingAuthForm defaultView="login" />
        </div>
    )
}
