'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Agent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  PlayCircle, 
  PauseCircle, 
  StopCircle, 
  Coffee, 
  MapPin,
  Calendar,
  TrendingUp,
  Timer
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AttendanceRecord {
  id?: string;
  agentId: string;
  date: string;
  checkIn?: any; // Firebase Timestamp or Date
  checkOut?: any; // Firebase Timestamp or Date
  breaks: {
    startTime: any; // Firebase Timestamp or Date
    endTime?: any; // Firebase Timestamp or Date
    reason: string;
    duration?: number;
  }[];
  totalHours?: number;
  status: 'checked-in' | 'on-break' | 'checked-out';
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  codCollections: {
    orderId: string;
    amount: number;
    collectedAt: any; // Firebase Timestamp or Date
    customerName: string;
  }[];
  totalCodCollected?: number;
  codOrdersDelivered?: number;
  createdAt: any; // Firebase Timestamp or Date
  updatedAt: any; // Firebase Timestamp or Date
}

interface AgentAttendanceProps {
  agent: Agent;
}

export function AgentAttendance({ agent }: AgentAttendanceProps) {
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [breakReason, setBreakReason] = useState('');
  const [breakDialogOpen, setBreakDialogOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!db || !agent?.agentId) return;

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCurrentLocation(position),
        (error) => console.warn('Location access denied:', error)
      );
    }

    // Subscribe to today's attendance record
    const todayQuery = query(
      collection(db, 'attendance'),
      where('agentId', '==', agent.agentId),
      where('date', '==', today)
    );

    const unsubscribeToday = onSnapshot(todayQuery, (snapshot) => {
      if (!snapshot.empty) {
        const record = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AttendanceRecord;
        setCurrentRecord(record);
      }
      setLoading(false);
    });

    // Subscribe to attendance history (last 7 days)
    const historyQuery = query(
      collection(db, 'attendance'),
      where('agentId', '==', agent.agentId),
      orderBy('date', 'desc')
    );

    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      setAttendanceHistory(records);
    });

    return () => {
      unsubscribeToday();
      unsubscribeHistory();
    };
  }, [agent?.agentId, today]);

  const getLocationData = async () => {
    if (!currentLocation) return null;

    return {
      lat: currentLocation.coords.latitude,
      lng: currentLocation.coords.longitude,
      address: 'Location captured' // In a real app, you'd use reverse geocoding
    };
  };

  const checkIn = async () => {
    try {
      if (!db) return;

      const locationData = await getLocationData();
      const checkInTime = new Date();

      const attendanceData: Omit<AttendanceRecord, 'id'> = {
        agentId: agent.agentId,
        date: today,
        checkIn: checkInTime,
        breaks: [],
        status: 'checked-in',
        location: locationData || undefined,
        codCollections: [],
        totalCodCollected: 0,
        codOrdersDelivered: 0,
        createdAt: checkInTime,
        updatedAt: checkInTime
      };

      await addDoc(collection(db, 'attendance'), attendanceData);

      toast({
        title: "Checked In",
        description: `Check-in recorded at ${checkInTime.toLocaleTimeString()}`
      });
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Error",
        description: "Failed to record check-in",
        variant: "destructive"
      });
    }
  };

  const checkOut = async () => {
    try {
      if (!db || !currentRecord) return;

      const checkOutTime = new Date();
      let checkInTime: Date;
      if (currentRecord.checkIn?.toDate && typeof currentRecord.checkIn.toDate === 'function') {
        checkInTime = currentRecord.checkIn.toDate();
      } else {
        checkInTime = new Date(currentRecord.checkIn!);
      }
      const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      await updateDoc(doc(db, 'attendance', currentRecord.id!), {
        checkOut: checkOutTime,
        status: 'checked-out',
        totalHours: Math.round(totalHours * 100) / 100,
        updatedAt: checkOutTime
      });

      toast({
        title: "Checked Out",
        description: `Work session completed. Total hours: ${Math.round(totalHours * 100) / 100}`
      });
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: "Error",
        description: "Failed to record check-out",
        variant: "destructive"
      });
    }
  };

  const startBreak = async () => {
    try {
      if (!db || !currentRecord || !breakReason) return;

      const breakStart = new Date();
      const updatedBreaks = [
        ...currentRecord.breaks,
        {
          startTime: breakStart,
          reason: breakReason
        }
      ];

      await updateDoc(doc(db, 'attendance', currentRecord.id!), {
        breaks: updatedBreaks,
        status: 'on-break',
        updatedAt: breakStart
      });

      setBreakReason('');
      setBreakDialogOpen(false);

      toast({
        title: "Break Started",
        description: `Break started at ${breakStart.toLocaleTimeString()}`
      });
    } catch (error) {
      console.error('Error starting break:', error);
      toast({
        title: "Error",
        description: "Failed to start break",
        variant: "destructive"
      });
    }
  };

  const endBreak = async () => {
    try {
      if (!db || !currentRecord) return;

      const breakEnd = new Date();
      const updatedBreaks = [...currentRecord.breaks];
      const lastBreak = updatedBreaks[updatedBreaks.length - 1];
      
      if (lastBreak && !lastBreak.endTime) {
        let breakStart: Date;
        if (lastBreak.startTime?.toDate && typeof lastBreak.startTime.toDate === 'function') {
          breakStart = lastBreak.startTime.toDate();
        } else {
          breakStart = new Date(lastBreak.startTime);
        }
        const duration = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60); // minutes
        
        lastBreak.endTime = breakEnd;
        lastBreak.duration = Math.round(duration);
      }

      await updateDoc(doc(db, 'attendance', currentRecord.id!), {
        breaks: updatedBreaks,
        status: 'checked-in',
        updatedAt: breakEnd
      });

      toast({
        title: "Break Ended",
        description: `Break ended at ${breakEnd.toLocaleTimeString()}`
      });
    } catch (error) {
      console.error('Error ending break:', error);
      toast({
        title: "Error",
        description: "Failed to end break",
        variant: "destructive"
      });
    }
  };

  const formatTime = (date: any) => {
    if (!date) return 'N/A';
    let d: Date;
    if (date.toDate && typeof date.toDate === 'function') {
      d = date.toDate();
    } else {
      d = new Date(date);
    }
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getTotalBreakTime = (breaks: any[]) => {
    return breaks.reduce((total, breakItem) => {
      return total + (breakItem.duration || 0);
    }, 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked-in':
        return <Badge className="bg-green-100 text-green-800">On Duty</Badge>;
      case 'on-break':
        return <Badge className="bg-yellow-100 text-yellow-800">On Break</Badge>;
      case 'checked-out':
        return <Badge className="bg-gray-100 text-gray-800">Off Duty</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Attendance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {currentRecord ? getStatusBadge(currentRecord.status) : 
                    <Badge variant="outline">Not Checked In</Badge>
                  }
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {currentRecord?.checkIn ? 'Checked in at' : 'Today'}
                </p>
                <p className="font-medium">
                  {currentRecord?.checkIn ? formatTime(currentRecord.checkIn) : new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!currentRecord ? (
                <Button onClick={checkIn} className="flex-1">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Check In
                </Button>
              ) : currentRecord.status === 'checked-in' ? (
                <>
                  <Dialog open={breakDialogOpen} onOpenChange={setBreakDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Coffee className="h-4 w-4 mr-2" />
                        Take Break
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Start Break</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="breakReason">Reason for break</Label>
                          <Textarea
                            id="breakReason"
                            value={breakReason}
                            onChange={(e) => setBreakReason(e.target.value)}
                            placeholder="e.g., Lunch, Rest, Personal"
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setBreakDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={startBreak} disabled={!breakReason.trim()}>
                            Start Break
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={checkOut} variant="destructive" className="flex-1">
                    <StopCircle className="h-4 w-4 mr-2" />
                    Check Out
                  </Button>
                </>
              ) : currentRecord.status === 'on-break' ? (
                <Button onClick={endBreak} className="w-full">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  End Break
                </Button>
              ) : (
                <div className="w-full text-center py-2 text-muted-foreground">
                  Work session completed for today
                </div>
              )}
            </div>

            {/* Today's Summary */}
            {currentRecord && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Hours Worked</p>
                  <p className="font-medium">
                    {currentRecord.totalHours ? 
                      `${currentRecord.totalHours}h` : 
                      currentRecord.checkIn ? 
                        (() => {
                          let checkInTime: Date;
                          if (currentRecord.checkIn?.toDate && typeof currentRecord.checkIn.toDate === 'function') {
                            checkInTime = currentRecord.checkIn.toDate();
                          } else {
                            checkInTime = new Date(currentRecord.checkIn);
                          }
                          return `${Math.round(((new Date().getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100}h`;
                        })() :
                        '0h'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Break Time</p>
                  <p className="font-medium">{getTotalBreakTime(currentRecord.breaks)}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">COD Collected</p>
                  <p className="font-medium text-green-600">₹{currentRecord.totalCodCollected || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">COD Orders</p>
                  <p className="font-medium">{currentRecord.codOrdersDelivered || 0}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Breaks</TableHead>
                    <TableHead>COD Collected</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceHistory.slice(0, 10).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {formatDate(record.date)}
                      </TableCell>
                      <TableCell>{formatTime(record.checkIn)}</TableCell>
                      <TableCell>{formatTime(record.checkOut)}</TableCell>
                      <TableCell>
                        {record.totalHours ? `${record.totalHours}h` : 
                         record.checkIn && !record.checkOut ? 'In Progress' : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {record.breaks.length > 0 ? 
                          `${record.breaks.length} (${getTotalBreakTime(record.breaks)}m)` : 
                          'None'
                        }
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">
                          ₹{record.totalCodCollected || 0}
                        </span>
                        {record.codOrdersDelivered ? (
                          <div className="text-xs text-muted-foreground">
                            {record.codOrdersDelivered} orders
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
