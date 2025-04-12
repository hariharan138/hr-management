"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { getCookie } from "cookies-next";
import { format, differenceInMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  MapPin,
  AlertCircle,
  RefreshCw,
  User,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const OFFICE_LOCATION = {
  latitude: 12.9981709,
  longitude: 77.5999077,
};

const RADIUS_METERS = 1000;

// Haversine formula to calculate distance between coordinates in meters
function getDistanceFromOffice(lat: number, lon: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371e3; // Earth radius in meters
  const dLat = toRad(lat - OFFICE_LOCATION.latitude);
  const dLon = toRad(lon - OFFICE_LOCATION.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(OFFICE_LOCATION.latitude)) *
      Math.cos(toRad(lat)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function AttendancePage() {
  const [status, setStatus] = useState<"idle" | "checked-in" | "checked-out">("idle");
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState({ employeeId: "", employeeName: "" });
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [todayLog, setTodayLog] = useState<any | null>(null);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    late: 0,
    early: 0,
    total: 0,
  });

  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const currentTime = format(new Date(), "h:mm a");

  // Check if there's already a check-in record for today
  useEffect(() => {
    if (!attendanceLogs.length) return;
    const todayDate = format(new Date(), "yyyy-MM-dd");
    const todayRecord = attendanceLogs.find((log) => {
      const logDate = format(new Date(log.enteredTime), "yyyy-MM-dd");
      return logDate === todayDate;
    });

    if (todayRecord) {
      setTodayLog(todayRecord);
      setAttendanceId(todayRecord._id);
      setCheckInTime(format(new Date(todayRecord.enteredTime), "h:mm a"));

      if (todayRecord.outTime) {
        setStatus("checked-out");
        setCheckOutTime(format(new Date(todayRecord.outTime), "h:mm a"));
      } else {
        setStatus("checked-in");
      }
    }
  }, [attendanceLogs]);

  // Calculate attendance statistics whenever logs change
  useEffect(() => {
    if (!attendanceLogs.length) return;

    const stats = {
      present: 0,
      late: 0,
      early: 0,
      total: attendanceLogs.length,
    };

    attendanceLogs.forEach((log) => {
      const status = getAttendanceStatus(log);
      if (status === "Present") stats.present++;
      if (status === "Late Arrival") stats.late++;
      if (status === "Early Departure") stats.early++;
    });

    setAttendanceStats(stats);
  }, [attendanceLogs]);

  // Fetch employee data and attendance logs on mount
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const token = getCookie("token");
        if (!token) {
          console.error("No authentication token found");
          setIsLoadingUser(false);
          return;
        }

        const response = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { "x-auth-token": token as string },
        });

        const { name, _id } = response.data;
        // Generate employee ID if none available
        const generatedEmployeeId =
          _id ||
          `EMP${name.replace(/\s+/g, "").substring(0, 5).toUpperCase()}${Math.floor(Math.random() * 1000)}`;

        setEmployeeData({
          employeeId: generatedEmployeeId,
          employeeName: name,
        });
        console.log("✅ Employee data loaded:", name, generatedEmployeeId);
      } catch (error) {
        console.error("❌ Error fetching employee data:", error);
        setEmployeeData({ employeeId: "EMP001", employeeName: "John Doe" });
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchEmployeeData();
    fetchAttendanceLogs();
  }, []);

  // Function to fetch attendance logs from API
  const fetchAttendanceLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const token = getCookie("token");
      if (!token) {
        console.error("No authentication token found");
        return;
      }
      const response = await axios.get("http://localhost:5000/api/attendance", {
        headers: { "x-auth-token": token as string },
      });
      // Sort logs by entered time (newest first)
      const sortedLogs = response.data.sort(
        (a: any, b: any) => new Date(b.enteredTime).getTime() - new Date(a.enteredTime).getTime()
      );
      setAttendanceLogs(sortedLogs);
    } catch (error) {
      console.error("❌ Error fetching attendance logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Refresh data manually
  const refreshData = async () => {
    setRefreshing(true);
    await fetchAttendanceLogs();
    setRefreshing(false);
  };

  // Determine the attendance status based on log details
  const getAttendanceStatus = (record: any) => {
    if (!record.outTime) return "In Progress";

    const enteredTime = new Date(record.enteredTime);
    const outTime = new Date(record.outTime);
    const workHours = (outTime.getTime() - enteredTime.getTime()) / (1000 * 60 * 60);

    if (workHours < 8) return "Early Departure";
    if (enteredTime.getHours() > 9) return "Late Arrival";
    return "Present";
  };

  // Format work duration from a record
  const formatWorkHours = (record: any) => {
    if (!record.outTime) return "-";
    const totalMinutes = Math.round(
      (new Date(record.outTime).getTime() - new Date(record.enteredTime).getTime()) / (1000 * 60)
    );
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Returns status-based color classes for badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-700";
      case "Late Arrival":
        return "bg-amber-100 text-amber-700";
      case "Early Departure":
        return "bg-orange-100 text-orange-700";
      case "In Progress":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Check the user's current location relative to the office
  const checkLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    setLocationMessage("📡 Fetching location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceFromOffice(latitude, longitude);
        setCurrentLocation({ lat: latitude, lng: longitude });
        if (distance <= RADIUS_METERS) {
          setLocationMessage(`✅ You are within office range (${Math.round(distance)}m)`);
        } else {
          setLocationMessage(`❌ You are outside office range (${Math.round(distance)}m)`);
        }
      },
      (error) => {
        console.error("❌ Geolocation error:", error);
        setLocationMessage("❌ Location access denied. Please enable location services.");
      }
    );
  };

  // Handle check-in logic
  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    setIsLoading(true);
    setLocationMessage("📡 Fetching location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceFromOffice(latitude, longitude);
        setCurrentLocation({ lat: latitude, lng: longitude });

        if (distance <= RADIUS_METERS) {
          const token = getCookie("token");
          if (!token) {
            setLocationMessage("❌ Token missing. Please log in.");
            setIsLoading(false);
            return;
          }

          try {
            const res = await axios.post(
              "http://localhost:5000/api/attendance/clock-in",
              {
                employeeId: employeeData.employeeId,
                employeeName: employeeData.employeeName,
                enteredLocation: `${latitude},${longitude}`,
              },
              { headers: { "x-auth-token": token as string } }
            );

            const id = res.data.record?._id || res.data._id;
            setAttendanceId(id);
            setCheckInTime(format(new Date(), "h:mm a"));
            setStatus("checked-in");
            setLocationMessage(`✅ Successfully checked in from ${Math.round(distance)}m`);
            console.log("🟢 Clock-in response:", res.data);
            // Refresh attendance logs after check-in
            fetchAttendanceLogs();
          } catch (error) {
            console.error("❌ Clock-in error:", error);
            setLocationMessage("❌ Clock-in failed. Try again.");
          } finally {
            setIsLoading(false);
          }
        } else {
          setLocationMessage(`❌ Too far from office! (${Math.round(distance)}m)`);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("❌ Geolocation error:", error);
        alert("Please allow location access.");
        setLocationMessage(null);
        setIsLoading(false);
      }
    );
  };

  // Handle check-out logic
  const handleCheckOut = () => {
    if (!navigator.geolocation || !attendanceId) {
      alert("Can't check out: Missing location access or check-in record.");
      return;
    }

    setIsLoading(true);
    setLocationMessage("📡 Fetching your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceFromOffice(latitude, longitude);
        setCurrentLocation({ lat: latitude, lng: longitude });
        const token = getCookie("token");

        if (!token) {
          setLocationMessage("❌ Token missing. Please log in again.");
          setIsLoading(false);
          return;
        }

        try {
          const res = await axios.put(
            `http://localhost:5000/api/attendance/clock-out/${attendanceId}`,
            {
              outLocation: `${latitude},${longitude}`,
              farDistance: Math.round(distance),
            },
            { headers: { "x-auth-token": token as string } }
          );

          const checkoutTime = res.data.record?.outTime
            ? new Date(res.data.record.outTime)
            : new Date();
          setCheckOutTime(format(checkoutTime, "h:mm a"));
          setStatus("checked-out");
          setLocationMessage(`✅ Successfully checked out from ${Math.round(distance)}m`);
          console.log("🟢 Clock-out response:", res.data);
          // Refresh attendance logs after check-out
          fetchAttendanceLogs();
        } catch (error) {
          console.error("❌ Clock-out error:", error);
          setLocationMessage("❌ Failed to check out. Please try again.");
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("❌ Geolocation error:", error);
        alert("Please allow location access for checkout.");
        setLocationMessage(null);
        setIsLoading(false);
      }
    );
  };

  // Calculate work duration for today's record
  const calculateWorkDuration = () => {
    if (!todayLog) return null;
    const startTime = new Date(todayLog.enteredTime);
    const endTime = todayLog.outTime ? new Date(todayLog.outTime) : new Date();
    const durationMinutes = differenceInMinutes(endTime, startTime);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return { hours, minutes, durationMinutes };
  };

  const workDuration = calculateWorkDuration();

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Attendance Tracker</h2>
          <p className="text-muted-foreground">
            Mark your attendance and view your check-in/check-out history
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="today">Today's Attendance</TabsTrigger>
          <TabsTrigger value="history">Attendance History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Today's Attendance */}
        <TabsContent value="today">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today&apos;s Attendance
                </CardTitle>
                <CardDescription>{today}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  {isLoadingUser ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px] mx-auto" />
                      <Skeleton className="h-8 w-[150px] mx-auto" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <p className="font-medium">
                          {employeeData.employeeName} ({employeeData.employeeId})
                        </p>
                      </div>
                      <p className="text-2xl font-semibold">{currentTime}</p>
                    </>
                  )}

                  <div className="mt-6 mb-4">
                    {status === "idle" && (
                      <div className="flex flex-col items-center">
                        <Clock className="text-amber-500 h-16 w-16 mb-2" />
                        <p className="text-muted-foreground">Not checked in yet</p>
                      </div>
                    )}
                    {status === "checked-in" && (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="text-green-500 h-16 w-16 mb-2" />
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                          Checked in at {checkInTime}
                        </Badge>
                        {workDuration && (
                          <div className="mt-4 text-center">
                            <p className="text-sm text-muted-foreground mb-1">Working time</p>
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <p className="font-medium text-blue-600">
                                {workDuration.hours}h {workDuration.minutes}m
                              </p>
                            </div>
                            <div className="w-full mt-2">
                              <Progress
                                value={Math.min((workDuration.durationMinutes / 480) * 100, 100)}
                                className="h-2"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                {Math.min(Math.round((workDuration.durationMinutes / 480) * 100), 100)}% of 8h workday
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {status === "checked-out" && (
                      <div className="flex flex-col items-center">
                        <XCircle className="text-orange-500 h-16 w-16 mb-2" />
                        <div className="flex flex-col gap-2">
                          <Badge className="bg-green-100 text-green-700">
                            Checked in at {checkInTime}
                          </Badge>
                          <Badge className="bg-orange-100 text-orange-700">
                            Checked out at {checkOutTime}
                          </Badge>
                        </div>
                        {workDuration && (
                          <div className="mt-4 text-center">
                            <p className="text-sm text-muted-foreground mb-1">Total work time</p>
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <p className="font-medium text-blue-600">
                                {workDuration.hours}h {workDuration.minutes}m
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {locationMessage && (
                    <Alert className="mt-4">
                      <MapPin className="h-4 w-4" />
                      <AlertTitle>Location Status</AlertTitle>
                      <AlertDescription>{locationMessage}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
                <Button
                  onClick={handleCheckIn}
                  disabled={status !== "idle" || isLoading || isLoadingUser}
                  className="w-full sm:w-auto"
                >
                  {isLoading && status === "idle" ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check In
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCheckOut}
                  disabled={status !== "checked-in" || isLoading}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isLoading && status === "checked-in" ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Check Out
                    </>
                  )}
                </Button>
                <Button onClick={checkLocation} variant="secondary" className="w-full sm:w-auto">
                  <MapPin className="mr-2 h-4 w-4" />
                  Check Location
                </Button>
              </CardFooter>
            </Card>

            {/* Location Card */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
                <CardDescription>Your current location relative to office</CardDescription>
              </CardHeader>
              <CardContent>
                {currentLocation ? (
                  <div className="space-y-4">
                    <div className="aspect-video relative bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-slate-400" />
                        <p className="text-sm text-slate-500">
                          Map visualization would appear here
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">Your Location</p>
                        <p className="font-mono text-sm">
                          {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">Office Location</p>
                        <p className="font-mono text-sm">
                          {OFFICE_LOCATION.latitude.toFixed(6)}, {OFFICE_LOCATION.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Distance from Office</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-lg">
                          {getDistanceFromOffice(currentLocation.lat, currentLocation.lng).toFixed(0)}m
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            getDistanceFromOffice(currentLocation.lat, currentLocation.lng) <= RADIUS_METERS
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {getDistanceFromOffice(currentLocation.lat, currentLocation.lng) <= RADIUS_METERS
                            ? "Within Range"
                            : "Out of Range"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No location data available</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click "Check Location" to get your current location
                    </p>
                    <Button onClick={checkLocation} variant="outline" size="sm">
                      Check Location
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>Your attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : attendanceLogs.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No attendance records found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your attendance history will appear here once you start checking in
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                        <TableRow key={log._id}>
                          <TableCell className="font-medium">
                            {format(new Date(log.enteredTime), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {format(new Date(log.enteredTime), "hh:mm a")}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Full timestamp: {format(new Date(log.enteredTime), "PPpp")}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            {log.outTime ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    {format(new Date(log.outTime), "hh:mm a")}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Full timestamp: {format(new Date(log.outTime), "PPpp")}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                In Progress
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(getAttendanceStatus(log))}>
                              {getAttendanceStatus(log)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatWorkHours(log)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-slate-100">
                              {log.enteredLocation ? "Office" : "-"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Statistics</CardTitle>
              <CardDescription>Overview of your attendance patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{attendanceStats.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total attendance records</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Present Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {attendanceStats.total > 0
                        ? `${Math.round((attendanceStats.present / attendanceStats.total) * 100)}% of total days`
                        : "No data available"}
                    </p>
                    <Progress
                      value={attendanceStats.total > 0 ? (attendanceStats.present / attendanceStats.total) * 100 : 0}
                      className="h-2 mt-2"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{attendanceStats.late}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {attendanceStats.total > 0
                        ? `${Math.round((attendanceStats.late / attendanceStats.total) * 100)}% of total days`
                        : "No data available"}
                    </p>
                    <Progress
                      value={attendanceStats.total > 0 ? (attendanceStats.late / attendanceStats.total) * 100 : 0}
                      className="h-2 mt-2"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Early Departures</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{attendanceStats.early}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {attendanceStats.total > 0
                        ? `${Math.round((attendanceStats.early / attendanceStats.total) * 100)}% of total days`
                        : "No data available"}
                    </p>
                    <Progress
                      value={attendanceStats.total > 0 ? (attendanceStats.early / attendanceStats.total) * 100 : 0}
                      className="h-2 mt-2"
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Attendance Breakdown</h3>
                {attendanceStats.total > 0 ? (
                  <div className="relative h-[200px] w-full">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full max-w-md">
                        <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="bg-green-500 transition-all"
                            style={{ width: `${(attendanceStats.present / attendanceStats.total) * 100}%` }}
                          />
                          <div
                            className="bg-amber-500 transition-all"
                            style={{ width: `${(attendanceStats.late / attendanceStats.total) * 100}%` }}
                          />
                          <div
                            className="bg-orange-500 transition-all"
                            style={{ width: `${(attendanceStats.early / attendanceStats.total) * 100}%` }}
                          />
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <div className="h-2 w-2 rounded-full bg-green-500 mx-auto mb-1" />
                            <span className="text-muted-foreground">Present</span>
                            <span className="block font-medium">
                              {Math.round((attendanceStats.present / attendanceStats.total) * 100)}%
                            </span>
                          </div>
                          <div>
                            <div className="h-2 w-2 rounded-full bg-amber-500 mx-auto mb-1" />
                            <span className="text-muted-foreground">Late</span>
                            <span className="block font-medium">
                              {Math.round((attendanceStats.late / attendanceStats.total) * 100)}%
                            </span>
                          </div>
                          <div>
                            <div className="h-2 w-2 rounded-full bg-orange-500 mx-auto mb-1" />
                            <span className="text-muted-foreground">Early Out</span>
                            <span className="block font-medium">
                              {Math.round((attendanceStats.early / attendanceStats.total) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No attendance data available</p>
                    <p className="text-sm text-muted-foreground">
                      Statistics will appear once you have attendance records
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
