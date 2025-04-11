"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { getCookie } from "cookies-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, ChevronLeft, ChevronRight, Download, Filter } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { cn } from "@/lib/utils"

export default function LogsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [month, setMonth] = useState<Date>(new Date())
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([])
  const [filteredLogs, setFilteredLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 10
  const tableRef = useRef<HTMLTableElement>(null)

  useEffect(() => {
    fetchAttendanceLogs()
  }, [])

  // Apply filters whenever date, month, or status filter changes
  useEffect(() => {
    applyFilters()
  }, [attendanceLogs, date, statusFilter])

  const fetchAttendanceLogs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = getCookie("token")
      if (!token) {
        setError("No authentication token found")
        setIsLoading(false)
        return
      }

      const response = await axios.get("http://localhost:5000/api/attendance", {
        headers: { "x-auth-token": token as string }
      })

      console.log("✅ Attendance logs loaded:", response.data)
      setAttendanceLogs(response.data)
      setFilteredLogs(response.data)
    } catch (error) {
      console.error("❌ Error fetching attendance logs:", error)
      setError("Failed to load attendance data")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to apply filters based on date and status
  const applyFilters = () => {
    if (!attendanceLogs.length) return

    let filtered = [...attendanceLogs]

    // Filter by month if date is selected
    if (date) {
      const start = startOfMonth(date)
      const end = endOfMonth(date)
      
      filtered = filtered.filter(log => {
        const logDate = new Date(log.enteredTime)
        return isWithinInterval(logDate, { start, end })
      })
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(log => {
        const status = getAttendanceStatus(log).toLowerCase()
        return status === statusFilter
      })
    }

    setFilteredLogs(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Function to handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
  }

  // Function to handle date selection
  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    if (newDate) {
      setMonth(newDate)
    }
  }

  // Function to handle month change
  const handleMonthChange = (newMonth: Date) => {
    setMonth(newMonth)
  }

  // Function to determine attendance status
  const getAttendanceStatus = (record: any) => {
    if (!record.outTime) return "In Progress"
    
    const enteredTime = new Date(record.enteredTime)
    const outTime = new Date(record.outTime)
    
    const workHours = (outTime.getTime() - enteredTime.getTime()) / (1000 * 60 * 60)
    
    if (workHours < 8) return "Early Departure"
    if (enteredTime.getHours() > 9) return "Late Arrival"
    return "Present"
  }

  // Function to format work hours
  const formatWorkHours = (record: any) => {
    if (!record.outTime) return "-"
    
    const enteredTime = new Date(record.enteredTime)
    const outTime = new Date(record.outTime)
    
    const totalMinutes = Math.round((outTime.getTime() - enteredTime.getTime()) / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    return `${hours}h ${minutes}m`
  }

  // Function to handle pagination
  const handleNextPage = () => {
    if (currentPage < Math.ceil(filteredLogs.length / logsPerPage)) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Function to download attendance data as CSV
  const downloadAttendanceData = () => {
    if (!filteredLogs.length) return

    // Create CSV header
    const headers = ["Date", "Employee Name", "Check In", "Check Out", "Status", "Work Hours", "Location"]
    
    // Create CSV rows
    const rows = filteredLogs.map(log => [
      format(new Date(log.enteredTime), "dd/MM/yyyy"),
      log.employeeName || "N/A",
      format(new Date(log.enteredTime), "hh:mm a"),
      log.outTime ? format(new Date(log.outTime), "hh:mm a") : "-",
      getAttendanceStatus(log),
      formatWorkHours(log),
      log.enteredLocation ? "Office" : "-"
    ])
    
    // Combine header and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance_${format(month, "MMM_yyyy")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Get current logs for pagination
  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

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
              <Calendar 
                mode="single" 
                selected={date} 
                onSelect={handleDateSelect} 
                onMonthChange={handleMonthChange} 
                initialFocus 
              />
            </PopoverContent>
          </Popover>

          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="late arrival">Late Arrival</SelectItem>
              <SelectItem value="early departure">Early Departure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={applyFilters}>
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={downloadAttendanceData} disabled={filteredLogs.length === 0}>
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
          {isLoading ? (
            <p className="text-center py-4 text-muted-foreground">Loading attendance logs...</p>
          ) : error ? (
            <p className="text-center py-4 text-red-500">{error}</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No attendance records found</p>
          ) : (
            <Table ref={tableRef}>
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
                {currentLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{format(new Date(log.enteredTime), "dd MMM yyyy")}</TableCell>
                    <TableCell>{format(new Date(log.enteredTime), "hh:mm a")}</TableCell>
                    <TableCell>
                      {log.outTime ? format(new Date(log.outTime), "hh:mm a") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "bg-opacity-10",
                          getAttendanceStatus(log) === "Present"
                            ? "bg-green-100 text-green-700"
                            : getAttendanceStatus(log) === "Late Arrival"
                              ? "bg-amber-100 text-amber-700"
                              : getAttendanceStatus(log) === "Early Departure"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700",
                        )}
                      >
                        {getAttendanceStatus(log)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatWorkHours(log)}</TableCell>
                    <TableCell>
                      {log.enteredLocation ? "Office" : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredLogs.length > 0 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {indexOfFirstLog + 1}-{Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} records
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>
                <div className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>
            </div>
          )}
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
              <div className="text-2xl font-bold">
                {filteredLogs.filter(log => getAttendanceStatus(log) === "Present").length}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">In Progress</div>
              <div className="text-2xl font-bold">
                {filteredLogs.filter(log => getAttendanceStatus(log) === "In Progress").length}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Late Check-ins</div>
              <div className="text-2xl font-bold">
                {filteredLogs.filter(log => getAttendanceStatus(log) === "Late Arrival").length}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Early Departures</div>
              <div className="text-2xl font-bold">
                {filteredLogs.filter(log => getAttendanceStatus(log) === "Early Departure").length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
