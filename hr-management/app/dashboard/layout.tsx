"use client"

import type React from "react"

import { useState, useEffect } from "react" // Added useEffect
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Calendar, ClipboardList, Clock, LogOut, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMobile } from "@/hooks/use-mobile"
import axios from "axios" // Added axios
import { getCookie } from 'cookies-next' // Added cookies-next
import { useRouter } from "next/navigation" // Add this import
import { deleteCookie } from 'cookies-next' // Add this import

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Attendance",
    href: "/dashboard/attendance",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    title: "Logs",
    href: "/dashboard/logs",
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    title: "Leave",
    href: "/dashboard/leave",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: <User className="h-5 w-5" />,
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter() // Add router
  const isMobile = useMobile()
  const [open, setOpen] = useState(false)
  const [userData, setUserData] = useState({ name: "User", position: "" }) // Added userData state
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (typeof window !== 'undefined') {
          const token = getCookie('token')
          
          if (token) {
            const response = await axios.get("http://localhost:5000/api/auth/me", {
              headers: {
                'x-auth-token': token as string
              },
            })
            setUserData(response.data)
          }
        }
      } catch (err) {
        console.error("Failed to fetch user data", err)
      }
    }

    fetchUserData()
  }, [])

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "U"
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // Add logout handler function
  const handleLogout = () => {
    deleteCookie('token')
    router.push('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold" onClick={() => setOpen(false)}>
                <ClipboardList className="h-6 w-6" />
                <span>HR Management</span>
              </Link>
              <div className="grid gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent",
                      pathname === item.href ? "bg-accent" : "transparent",
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ClipboardList className="h-6 w-6" />
          <span className="hidden md:inline-block">HR Management</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Avatar>
            <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
            <AvatarFallback>{getInitials(userData.name)}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <div className="text-sm font-medium">{userData.name || "User"}</div>
            <div className="text-xs text-muted-foreground">{userData.position || "Employee"}</div>
          </div>
          <Button variant="ghost" size="icon" className="ml-2" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r md:block">
          <nav className="grid gap-2 p-4 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent",
                  pathname === item.href ? "bg-accent" : "transparent",
                )}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
