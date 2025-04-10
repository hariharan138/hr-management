"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CheckCircle, Clock, MapPin, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"

const OFFICE_LOCATION = {
  latitude: 12.9981709  ,   // Replace with your actual office latitude
  longitude: 77.5999077 ,  // Replace with your actual office longitude
}
const RADIUS_METERS = 100 // radius in meters

function getDistanceFromOffice(lat: number, lon: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180
  const R = 6371e3 // Earth radius in meters

  const dLat = toRad(lat - OFFICE_LOCATION.latitude)
  const dLon = toRad(lon - OFFICE_LOCATION.longitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(OFFICE_LOCATION.latitude)) *
      Math.cos(toRad(lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export default function AttendancePage() {
  const [status, setStatus] = useState<"idle" | "checked-in" | "checked-out">("idle")
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)

  const today = format(new Date(), "EEEE, MMMM d, yyyy")
  const currentTime = format(new Date(), "h:mm a")

  const handleCheckIn = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude
          const userLng = position.coords.longitude
          const distance = getDistanceFromOffice(userLat, userLng)

          if (distance <= RADIUS_METERS) {
            setStatus("checked-in")
            setCheckInTime(format(new Date(), "h:mm a"))
            setLocationMessage(`✅ You are within ${Math.round(distance)} meters from the office.`)
          } else {
            setLocationMessage(`❌ You are outside the office area! (${Math.round(distance)} meters away)`)
          }
        },
        (error) => {
          alert("Location access is required to check in.")
          console.error(error)
        }
      )
    } else {
      alert("Geolocation is not supported by your browser.")
    }
  }

  const handleCheckOut = () => {
    setStatus("checked-out")
    setCheckOutTime(format(new Date(), "h:mm a"))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
        <p className="text-muted-foreground">Mark your attendance and view your check-in/check-out history</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Today&apos;s Attendance</CardTitle>
            <CardDescription>{today}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              {status === "idle" && (
                <div className="flex flex-col items-center gap-2 py-6">
                  <Clock className="h-16 w-16 text-muted-foreground" />
                  <p className="text-xl font-semibold">{currentTime}</p>
                  <p className="text-muted-foreground">You haven&apos;t checked in yet</p>
                </div>
              )}

              {status === "checked-in" && (
                <div className="flex flex-col items-center gap-2 py-6">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <p className="text-xl font-semibold">{currentTime}</p>
                  <p className="text-green-500 font-medium">You&apos;re checked in</p>
                  <Badge variant="outline" className="mt-2">
                    <Clock className="mr-1 h-3 w-3" />
                    Checked in at {checkInTime}
                  </Badge>
                </div>
              )}

              {status === "checked-out" && (
                <div className="flex flex-col items-center gap-2 py-6">
                  <XCircle className="h-16 w-16 text-orange-500" />
                  <p className="text-xl font-semibold">{currentTime}</p>
                  <p className="text-orange-500 font-medium">You&apos;ve checked out</p>
                  <div className="flex flex-col gap-2 mt-2">
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      Checked in at {checkInTime}
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      Checked out at {checkOutTime}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <MapPin className="inline-block mr-1 h-4 w-4" />
              Office Location (within {RADIUS_METERS}m)
            </div>

            {locationMessage && (
              <div className="text-center font-medium text-sm mt-2 text-blue-600">{locationMessage}</div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleCheckIn} disabled={status !== "idle"} className="w-full mr-2">
              Check In
            </Button>
            <Button onClick={handleCheckOut} disabled={status !== "checked-in"} variant="outline" className="w-full">
              Check Out
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>This Week&apos;s Summary</CardTitle>
            <CardDescription>Your attendance for the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, i) => (
                <div key={day}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          i < 3 ? "bg-green-500" : i === 3 ? "bg-orange-500" : "bg-gray-300"
                        }`}
                      />
                      <span>{day}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {i < 3 ? "09:00 AM - 05:30 PM" : i === 3 ? "09:15 AM - 04:45 PM" : "Absent"}
                    </div>
                  </div>
                  {i < 4 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Rules</CardTitle>
          <CardDescription>Company attendance policy</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Working hours are from 9:00 AM to 5:30 PM, Monday to Friday.</li>
            <li>Employees must check in and check out daily using the attendance system.</li>
            <li>A grace period of 15 minutes is allowed for check-in.</li>
            <li>Early departure requires prior approval from the manager.</li>
            <li>Working remotely requires prior approval and proper check-in/check-out.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
