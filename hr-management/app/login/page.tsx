"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, Loader2, LockKeyhole, Mail, User, XCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const Login: React.FC = () => {
  const [form, setForm] = useState({ email: "", password: "" })
  const [message, setMessage] = useState<{ type: "success" | "error" | null; text: string }>({
    type: null,
    text: "",
  })
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: null, text: "" })

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", form)
      // Store token in HTTP-only cookie instead of localStorage
      document.cookie = `token=${res.data.token}; path=/`
      setMessage({ type: "success", text: "Login successful. Welcome back!" })

      const profile = await axios.get("http://localhost:5000/api/auth/me", {
        headers: {
          "x-auth-token": res.data.token,
        },
      })

      setUser(profile.data)
      router.push("/dashboard/")
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.msg || "Login failed. Please check your credentials and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <Card className="border-gray-200 shadow-lg dark:border-gray-800">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-primary/10 p-3">
                <LockKeyhole className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LockKeyhole className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {message.type && (
                <Alert variant={message.type === "error" ? "destructive" : "default"} className="mt-4">
                  {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <AlertTitle>{message.type === "success" ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="/Signup" className="text-primary hover:underline">
                Sign up
              </a>
            </div>
          </CardContent>

          {user && (
            <>
              <Separator />
              <CardFooter className="flex flex-col space-y-4 pt-4">
                <div className="flex items-center space-x-4 w-full">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-semibold">Logged in as:</h4>
                    <div className="text-sm text-muted-foreground">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Login
