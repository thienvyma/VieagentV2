"use client"

import { SlidingAuthForm } from "@/components/auth/sliding-auth-form"

export default function SignupPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <SlidingAuthForm defaultView="signup" />
        </div>
    )
}
