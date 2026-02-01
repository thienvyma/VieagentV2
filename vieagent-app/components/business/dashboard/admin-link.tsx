"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
// ... imports

// Update Sidebar to show "Admin Portal" Link *IF* user is admin.
// BUT, this is a server component usually.
// Let's assume for now we put it in the dashboard layout if we can check role.
// Better: Add a "Admin" button in the Sidebar that only shows if we have the claim.
// For now, I'll rely on the user manually navigating or add a explicit link in the dashboard sidebar if they are admin.
