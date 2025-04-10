"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, ChevronLeft, ChevronRight, Download, Filter } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Sample attendance log data
const attendanceLogs = [
  {
    id: 1,
    date: "2023-04-08",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    status: "Present",
    workHours: "8h 30m",
    location: "Office",
  },
  {
    id: 2,
    date: "2023-04-07",
    checkIn: "08:55 AM",
    checkOut: "05:45 PM",
    status: "Present",
    workHours: "8h 50m",
    location: "Office",
  },
  {
    id: 3,
    date: "2023-04-06",
    checkIn: "09:10 AM",
    checkOut: "05:30 PM",
    status: "Present",
    workHours: "8h 20m",
    location: "Office",
  },
  {
    id: 4,
    date: "2023-04-05",
    checkIn: "09:15 AM",
    checkOut: "04:45 PM",
    status: "Early Departure",
    workHours: "7h 30m",
    location: "Office",
  },
  { id: 5, date: "2023-04-04", checkIn: "-", checkOut: "-", status: "Absent", workHours: "-", location: "-" },
  {
    id: 6,
    date: "2023-04-03",
    checkIn: "09:05 AM",
    checkOut: "05:35 PM",
    status: "Present",
    workHours: "8h 30m",
    location: "Office",
  },
  {
    id: 7,
    date: "2023-04-02",
    checkIn: "08:50 AM",
    checkOut: "05:40 PM",
    status: "Present",
    workHours: "8h 50m",
    location: "Office",
  },
  {
    id: 8,
    date: "2023-04-01",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    status: "Present",
    workHours: "8h 30m",
    location: "Office",
  },
]

export default function LogsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [month, setMonth] = useState<Date>(new Date())

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Attendance Logs</h2>
        <p className="text-muted-foreground">View and manage your attendance history</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left md:w-auto">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "MMMM yyyy") : <span>Pick a month</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} onMonthChange={setMonth} initialFocus />
            </PopoverContent>
          </Popover>

          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="early">Early Departure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Your attendance records for {format(month, "MMMM yyyy")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.date), "dd MMM yyyy")}</TableCell>
                  <TableCell>{log.checkIn}</TableCell>
                  <TableCell>{log.checkOut}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "bg-opacity-10",
                        log.status === "Present"
                          ? "bg-green-100 text-green-700"
                          : log.status === "Absent"
                            ? "bg-red-100 text-red-700"
                            : log.status === "Late"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-orange-100 text-orange-700",
                      )}
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.workHours}</TableCell>
                  <TableCell>{log.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button variant="outline" size="sm">
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
          <CardDescription>Your attendance summary for {format(month, "MMMM yyyy")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Present Days</div>
              <div className="text-2xl font-bold">18</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Absent Days</div>
              <div className="text-2xl font-bold">1</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Late Check-ins</div>
              <div className="text-2xl font-bold">2</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Early Departures</div>
              <div className="text-2xl font-bold">1</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
