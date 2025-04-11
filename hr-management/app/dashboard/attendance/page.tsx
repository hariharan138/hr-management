"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { getCookie } from "cookies-next";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const OFFICE_LOCATION = {
  latitude: 12.9981709,
  longitude: 77.5999077
};

const RADIUS_METERS = 1000;

function getDistanceFromOffice(lat: number, lon: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371e3;
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
  // Add state for attendance logs
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const currentTime = format(new Date(), "h:mm a");

  // Fetch employee data on component mount
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
          headers: { "x-auth-token": token as string }
        });

        const { name, _id } = response.data;
        // Generate employee ID from name if not available
        const generatedEmployeeId = _id || `EMP${name.replace(/\s+/g, "").substring(0, 5).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
        
        setEmployeeData({
          employeeId: generatedEmployeeId,
          employeeName: name
        });
        
        console.log("✅ Employee data loaded:", name, generatedEmployeeId);
      } catch (error) {
        console.error("❌ Error fetching employee data:", error);
        // Fallback to default values if API call fails
        setEmployeeData({ employeeId: "EMP001", employeeName: "John Doe" });
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchEmployeeData();
    fetchAttendanceLogs();
  }, []);

  // Function to fetch attendance logs
  const fetchAttendanceLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const token = getCookie("token");
      if (!token) {
        console.error("No authentication token found");
        setIsLoadingLogs(false);
        return;
      }

      const response = await axios.get("http://localhost:5000/api/attendance", {
        headers: { "x-auth-token": token as string }
      });

      console.log("✅ Attendance logs loaded:", response.data);
      // The API returns an array, so we need to use it directly
      setAttendanceLogs(response.data);
    } catch (error) {
      console.error("❌ Error fetching attendance logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Function to determine attendance status
  const getAttendanceStatus = (record: any) => {
    if (!record.outTime) return "In Progress";
    
    const enteredTime = new Date(record.enteredTime);
    const outTime = new Date(record.outTime);
    
    // Example logic - you can customize based on your requirements
    const workHours = (outTime.getTime() - enteredTime.getTime()) / (1000 * 60 * 60);
    
    if (workHours < 8) return "Early Departure";
    if (enteredTime.getHours() > 9) return "Late Arrival";
    return "Present";
  };

  // Function to format work hours
  const formatWorkHours = (record: any) => {
    if (!record.outTime) return "-";
    
    const enteredTime = new Date(record.enteredTime);
    const outTime = new Date(record.outTime);
    
    const totalMinutes = Math.round((outTime.getTime() - enteredTime.getTime()) / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    setIsLoading(true);
    setLocationMessage("📡 Fetching location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const distance = getDistanceFromOffice(lat, lng);

        console.log("✅ Location for check-in:", lat, lng, "Distance:", distance);

        if (distance <= RADIUS_METERS) {
          const token = await getCookie("token");
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
                enteredLocation: `${lat},${lng}`
              },
              {
                headers: { "x-auth-token": token as string }
              }
            );

            const id = res.data.record?._id || res.data._id;
            setAttendanceId(id);
            setCheckInTime(format(new Date(), "h:mm a"));
            setStatus("checked-in");
            setLocationMessage(`✅ Checked in from ${Math.round(distance)}m`);
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

  const handleCheckOut = () => {
    if (!navigator.geolocation || !attendanceId) {
      alert("Can't check out: Missing location access or check-in record.");
      return;
    }

    setIsLoading(true);
    setLocationMessage("📡 Fetching your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          console.log("✅ Attempting clock-out", { attendanceId });
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const distance = getDistanceFromOffice(lat, lng);
          const token = await getCookie("token");

          if (!token) {
            setLocationMessage("❌ Token missing. Please log in again.");
            setIsLoading(false);
            return;
          }

          const res = await axios.put(
            `http://localhost:5000/api/attendance/clock-out/${attendanceId}`,
            {
              outLocation: `${lat},${lng}`,
              farDistance: Math.round(distance)
            },
            {
              headers: { "x-auth-token": token as string }
            }
          );

          const checkoutTimeFromAPI = res.data.record?.outTime
            ? new Date(res.data.record.outTime)
            : new Date();

          setCheckOutTime(format(checkoutTimeFromAPI, "h:mm a"));
          setStatus("checked-out");
          setLocationMessage(`✅ Checked out from ${Math.round(distance)}m`);
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

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold">Attendance</h2>
      <p className="text-muted-foreground">
        Mark your attendance and view your check-in/check-out history
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Today&apos;s Attendance</CardTitle>
            <CardDescription>{today}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              {isLoadingUser ? (
                <p className="text-muted-foreground">Loading employee data...</p>
              ) : (
                <p className="font-medium mb-2">
                  {employeeData.employeeName} ({employeeData.employeeId})
                </p>
              )}
              <p className="text-xl font-semibold">{currentTime}</p>
              {status === "idle" && <p className="text-muted-foreground">Not checked in yet</p>}
              {status === "checked-in" && (
                <div>
                  <CheckCircle className="text-green-500 mx-auto h-12 w-12" />
                  <Badge>Checked in at {checkInTime}</Badge>
                </div>
              )}
              {status === "checked-out" && (
                <div>
                  <XCircle className="text-orange-500 mx-auto h-12 w-12" />
                  <Badge>Checked out at {checkOutTime}</Badge>
                </div>
              )}
              {locationMessage && (
                <p className="text-blue-600 mt-2 text-sm">{locationMessage}</p>
              )}
              {attendanceId && (
                <p className="text-muted-foreground text-xs mt-2">
                  Attendance ID: {attendanceId}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={handleCheckIn} 
              disabled={status !== "idle" || isLoading || isLoadingUser}
            >
              {isLoading && status === "idle" ? "Processing..." : "Check In"}
            </Button>
            <Button
              onClick={handleCheckOut}
              disabled={status !== "checked-in" || isLoading}
              variant="outline"
            >
              {isLoading && status === "checked-in" ? "Processing..." : "Check Out"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Attendance Logs Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Your attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <p className="text-center text-muted-foreground">Loading attendance logs...</p>
          ) : attendanceLogs.length === 0 ? (
            <p className="text-center text-muted-foreground">No attendance records found</p>
          ) : (
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
                    <TableCell>{format(new Date(log.enteredTime), "dd MMM yyyy")}</TableCell>
                    <TableCell>{format(new Date(log.enteredTime), "hh:mm a")}</TableCell>
                    <TableCell>
                      {log.outTime ? format(new Date(log.outTime), "hh:mm a") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`bg-opacity-10 ${
                          getAttendanceStatus(log) === "Present"
                            ? "bg-green-100 text-green-700"
                            : getAttendanceStatus(log) === "Late Arrival"
                              ? "bg-amber-100 text-amber-700"
                              : getAttendanceStatus(log) === "Early Departure"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                        }`}
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
        </CardContent>
      </Card>
    </div>
  );
}
