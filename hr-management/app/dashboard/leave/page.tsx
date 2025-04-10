"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Sample leave data
const leaveRequests = [
  {
    id: 1,
    type: "Vacation",
    startDate: "2023-04-15",
    endDate: "2023-04-18",
    days: 4,
    status: "Approved",
    reason: "Family vacation",
  },
  {
    id: 2,
    type: "Sick Leave",
    startDate: "2023-03-10",
    endDate: "2023-03-11",
    days: 2,
    status: "Approved",
    reason: "Fever",
  },
  {
    id: 3,
    type: "Personal Leave",
    startDate: "2023-05-05",
    endDate: "2023-05-05",
    days: 1,
    status: "Pending",
    reason: "Personal work",
  },
  {
    id: 4,
    type: "Work From Home",
    startDate: "2023-04-20",
    endDate: "2023-04-20",
    days: 1,
    status: "Pending",
    reason: "Internet installation",
  },
]

export default function LeavePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Leave Management</h2>
        <p className="text-muted-foreground">Request and manage your leaves</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:w-[400px]">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="all">All Leaves</TabsTrigger>
          </TabsList>

          <div className="mt-4 flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Request Leave
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Request Leave</DialogTitle>
                  <DialogDescription>Fill in the details to submit your leave request.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="leave-type">Leave Type</Label>
                    <Select>
                      <SelectTrigger id="leave-type">
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vacation">Vacation</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="personal">Personal Leave</SelectItem>
                        <SelectItem value="wfh">Work From Home</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Date Range</Label>
                    <div className="flex flex-col gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? (
                              dateRange.to ? (
                                <>
                                  {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(dateRange.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>

                      <div className="text-sm text-muted-foreground">
                        {dateRange.from && dateRange.to && (
                          <span>
                            {Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) +
                              1}{" "}
                            days selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Provide a reason for your leave request"
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsDialogOpen(false)}>Submit Request</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="pending" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Pending Leave Requests</CardTitle>
                <CardDescription>Leave requests awaiting approval</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests
                      .filter((request) => request.status === "Pending")
                      .map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.type}</TableCell>
                          <TableCell>
                            {format(new Date(request.startDate), "MMM dd")}
                            {request.startDate !== request.endDate &&
                              ` - ${format(new Date(request.endDate), "MMM dd")}`}
                          </TableCell>
                          <TableCell>{request.days}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-amber-100 bg-opacity-10 text-amber-700">
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{request.reason}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Cancel
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Leave Requests</CardTitle>
                <CardDescription>Your approved leave requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests
                      .filter((request) => request.status === "Approved")
                      .map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.type}</TableCell>
                          <TableCell>
                            {format(new Date(request.startDate), "MMM dd")}
                            {request.startDate !== request.endDate &&
                              ` - ${format(new Date(request.endDate), "MMM dd")}`}
                          </TableCell>
                          <TableCell>{request.days}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100 bg-opacity-10 text-green-700">
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{request.reason}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Leave Requests</CardTitle>
                <CardDescription>Your complete leave history</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.type}</TableCell>
                        <TableCell>
                          {format(new Date(request.startDate), "MMM dd")}
                          {request.startDate !== request.endDate && ` - ${format(new Date(request.endDate), "MMM dd")}`}
                        </TableCell>
                        <TableCell>{request.days}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "bg-opacity-10",
                              request.status === "Approved"
                                ? "bg-green-100 text-green-700"
                                : request.status === "Rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700",
                            )}
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{request.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Balance</CardTitle>
          <CardDescription>Your available leave balance for the current year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Vacation</div>
              <div className="text-2xl font-bold">
                12 <span className="text-sm text-muted-foreground">/ 20</span>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Sick Leave</div>
              <div className="text-2xl font-bold">
                8 <span className="text-sm text-muted-foreground">/ 10</span>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Personal Leave</div>
              <div className="text-2xl font-bold">
                3 <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Work From Home</div>
              <div className="text-2xl font-bold">
                4 <span className="text-sm text-muted-foreground">/ 12</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
