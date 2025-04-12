"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { getCookie } from 'cookies-next' // Add this import
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Mail, MapPin, Phone } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    employeeId: "",
    department: "",
    position: "",
    joinDate: "",
    workLocation: "",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (typeof window !== 'undefined') {
          const token = await getCookie('token') // Add await here
          
          if (!token) {
            router.push("/login")
            return
          }

          const response = await axios.get("http://localhost:5000/api/auth/me", {
            headers: {
              'x-auth-token': token as string 
            },
          })
          setUserData(response.data)
          setLoading(false)
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push("/login")
        }
        setError(err.response?.data?.msg || "Failed to fetch user data")
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">Manage your personal information and settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder.svg?height=96&width=96" alt="User" />
                <AvatarFallback className="text-2xl">JD</AvatarFallback>
              </Avatar>
              <div className="space-y-1 text-center">
                
                <h3 className="text-xl font-semibold">{userData.name}</h3>
                <p className="text-sm text-muted-foreground">{userData.position}</p>
                
                
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userData.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userData.phone}</span>
                </div>
                

                <Input
                  id="first-name"
                  defaultValue={userData.name?.split(" ")[0]}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
                
                <Input
                  id="email"
                  type="email"
                  defaultValue={userData.email}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Employee ID: EMP001
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Full-time
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">john.doe@company.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">New York, USA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Joined: Jan 15, 2020</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Department</h4>
                <p className="text-sm text-muted-foreground">Human Resources</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Manager</h4>
                <p className="text-sm text-muted-foreground">Sarah Johnson</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Manage your personal details</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          defaultValue="John"
                          readOnly={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          defaultValue="Doe"
                          readOnly={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue="john.doe@company.com"
                          readOnly={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          defaultValue="+1 (555) 123-4567"
                          readOnly={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        defaultValue="123 Main St, New York, NY 10001, USA"
                        readOnly={!isEditing}
                        className={!isEditing ? "bg-muted" : ""}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input
                          id="dob"
                          type="date"
                          defaultValue="1985-06-15"
                          readOnly={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Input
                          id="gender"
                          defaultValue="Male"
                          readOnly={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marital-status">Marital Status</Label>
                        <Input
                          id="marital-status"
                          defaultValue="Married"
                          readOnly={!isEditing}
                          className={!isEditing ? "bg-muted" : ""}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                {isEditing && (
                  <CardFooter className="justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsEditing(false)}>Save Changes</Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="employment" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Employment Information</CardTitle>
                  <CardDescription>Your employment details and history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Employee ID</h4>
                        <p className="text-sm text-muted-foreground">EMP001</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Department</h4>
                        <p className="text-sm text-muted-foreground">Human Resources</p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Position</h4>
                        <p className="text-sm text-muted-foreground">HR Manager</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Employment Type</h4>
                        <p className="text-sm text-muted-foreground">Full-time</p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Join Date</h4>
                        <p className="text-sm text-muted-foreground">January 15, 2020</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Work Location</h4>
                        <p className="text-sm text-muted-foreground">New York Office</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Employment History</h4>
                      <div className="space-y-4">
                        <div className="rounded-lg border p-3">
                          <div className="flex justify-between">
                            <div>
                              <h5 className="font-medium">HR Manager</h5>
                              <p className="text-sm text-muted-foreground">Human Resources Department</p>
                            </div>
                            <p className="text-sm text-muted-foreground">Jan 2022 - Present</p>
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="flex justify-between">
                            <div>
                              <h5 className="font-medium">HR Specialist</h5>
                              <p className="text-sm text-muted-foreground">Human Resources Department</p>
                            </div>
                            <p className="text-sm text-muted-foreground">Jan 2020 - Dec 2021</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Change Password</h4>
                      <div className="grid gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input id="current-password" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input id="new-password" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input id="confirm-password" type="password" />
                        </div>
                        <Button className="w-full sm:w-auto">Update Password</Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Notification Preferences</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="email-notifications">Email Notifications</Label>
                          <input
                            type="checkbox"
                            id="email-notifications"
                            className="h-4 w-4 rounded border-gray-300"
                            defaultChecked
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sms-notifications">SMS Notifications</Label>
                          <input type="checkbox" id="sms-notifications" className="h-4 w-4 rounded border-gray-300" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="app-notifications">App Notifications</Label>
                          <input
                            type="checkbox"
                            id="app-notifications"
                            className="h-4 w-4 rounded border-gray-300"
                            defaultChecked
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button>Save Preferences</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
