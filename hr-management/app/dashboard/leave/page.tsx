"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { cookies } from "next/headers"

interface LeaveRequest {
  _id: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  status: string
  reason: string
  employeeId?: string
  employeeName?: string
}

export default function LeavePage() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [formData, setFormData] = useState({ leaveType: "", reason: "" })
  const [dateRange, setDateRange] = useState<{ from?: Date, to?: Date }>({})
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Get token from cookies when component mounts
    const getToken = () => {
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      // Decode the token if it's URI encoded
      const decodedToken = cookieToken ? decodeURIComponent(cookieToken) : null;
      setToken(decodedToken);
      
      // For debugging
      console.log("Token retrieved:", decodedToken ? "Token exists" : "No token found");
    };
    
    getToken();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/leave/", {
        headers: {
          "x-auth-token": token as string,
        }
      })
      
      if (!res.ok) {
        throw new Error('Failed to fetch leaves')
      }
      
      const data = await res.json()
      setLeaveRequests(data)
    } catch (error) {
      toast({ 
        title: "Failed to load leaves", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchLeaves()
    }
  }, [token])

  const handleSubmit = async () => {
    try {
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      if (!dateRange.from || !dateRange.to) {
        toast({
          title: "Date range required",
          description: "Please select both start and end dates",
          variant: "destructive"
        });
        return;
      }
      
      if (!formData.leaveType) {
        toast({
          title: "Leave type required",
          description: "Please select a leave type",
          variant: "destructive"
        });
        return;
      }
      
      const startDate = dateRange.from;
      const endDate = dateRange.to;
      
      // Calculate number of days (excluding weekends)
      let days = 0;
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          days++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const response = await fetch('http://localhost:5000/api/leave/', {
        method: 'POST',
        headers: {
          'x-auth-token': token as string,
          'Content-Type': 'application/json' // Add content-type header
        },
        body: JSON.stringify({
          leaveType: formData.leaveType,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          days,
          reason: formData.reason,
          // Add these required fields from your Leave model
          employeeId: 'YOUR_EMPLOYEE_ID', // Required field
          employeeName: 'YOUR_NAME' // Required field
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit leave request');
      }
      
      // Success handling
      toast({ 
        title: "Leave request submitted",
        description: "Your leave request has been submitted successfully"
      });
      
      // Reset form and close dialog
      setFormData({ leaveType: "", reason: "" });
      setDateRange({});
      setIsDialogOpen(false);
      
      // Refresh leave requests
      fetchLeaves();
    } catch (error) {
      toast({ 
        title: "Failed to submit request", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  }

  const cancelLeave = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/leave/${id}`, { 
        method: "DELETE",
        headers: {
          "x-auth-token": token as string
        }
      })
      
      if (res.ok) {
        toast({ title: "Leave cancelled" })
        setLeaveRequests(leaveRequests.filter((l) => l._id !== id))
      } else {
        const errorData = await res.json()
        toast({ 
          title: "Failed to cancel", 
          description: errorData.message || "Unknown error",
          variant: "destructive" 
        })
      }
    } catch (error) {
      toast({ 
        title: "Error cancelling", 
        description: error instanceof Error ? error.message : "Network error",
        variant: "destructive" 
      })
    }
  }

  if (loading) return <div className="p-6 text-center">Loading...</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Leave Requests</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Request Leave</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
              <DialogDescription>Fill in details to request leave.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Leave Type</Label>
                <Select value={formData.leaveType} onValueChange={(v) => setFormData({ ...formData, leaveType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vacation">Vacation</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                    <SelectItem value="Work From Home">Work From Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from
                        ? dateRange.to
                          ? `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd")}`
                          : format(dateRange.from, "LLL dd")
                        : "Pick a date range"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      mode="range"
                      numberOfMonths={2}
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to
                      }}
                      onSelect={(range) => {
                        if (range) {
                          setDateRange({
                            from: range.from,
                            to: range.to
                          });
                        } else {
                          setDateRange({});
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Reason</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Why do you need this leave?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <LeaveTable data={leaveRequests.filter(l => l.status === "Pending")} onCancel={cancelLeave} />
        </TabsContent>

        <TabsContent value="approved">
          <LeaveTable data={leaveRequests.filter(l => l.status === "Approved")} />
        </TabsContent>

        <TabsContent value="all">
          <LeaveTable data={leaveRequests} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LeaveTable({ data, onCancel }: { data: LeaveRequest[], onCancel?: (id: string) => void }) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Leave Requests</CardTitle>
        <CardDescription>Details of leave applications</CardDescription>
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
              {onCancel && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((req) => (
              <TableRow key={req._id}>
                <TableCell>{req.leaveType}</TableCell>
                <TableCell>
                  {format(new Date(req.startDate), "MMM dd")} - {format(new Date(req.endDate), "MMM dd")}
                </TableCell>
                <TableCell>{req.days}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      req.status === "Approved"
                        ? "text-green-700 bg-green-100 bg-opacity-10"
                        : req.status === "Rejected"
                          ? "text-red-700 bg-red-100 bg-opacity-10"
                          : "text-amber-700 bg-amber-100 bg-opacity-10"
                    }
                  >
                    {req.status}
                  </Badge>
                </TableCell>
                <TableCell>{req.reason}</TableCell>
                {onCancel && (
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => onCancel(req._id)}>
                      Cancel
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

