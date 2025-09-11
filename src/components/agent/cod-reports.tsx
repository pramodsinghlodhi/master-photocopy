'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Agent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Package, TrendingUp, Download, Filter } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns';

export interface CODCollection {
  id: string;
  agentId: string;
  orderId: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  collectedAt: any; // Firestore timestamp
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface AttendanceWithCOD {
  id: string;
  agentId: string;
  date: string;
  checkIn: any;
  checkOut?: any;
  totalHours?: number;
  codCollections: CODCollection[];
  totalCodCollected: number;
  codOrdersDelivered: number;
}

interface CODReportsProps {
  agent: Agent;
}

export function CODReports({ agent }: CODReportsProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceWithCOD[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [filteredRecords, setFilteredRecords] = useState<AttendanceWithCOD[]>([]);

  useEffect(() => {
    if (!db || !agent.agentId) return;

    const q = query(
      collection(db, 'agentAttendance'),
      where('agentId', '==', agent.agentId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceWithCOD[];

      setAttendanceRecords(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [agent.agentId]);

  useEffect(() => {
    // Filter records based on date range
    const startDate = startOfDay(new Date(dateRange.start));
    const endDate = endOfDay(new Date(dateRange.end));

    const filtered = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return isWithinInterval(recordDate, { start: startDate, end: endDate });
    });

    setFilteredRecords(filtered);
  }, [attendanceRecords, dateRange]);

  const totalCODAmount = filteredRecords.reduce((sum, record) => sum + (record.totalCodCollected || 0), 0);
  const totalOrders = filteredRecords.reduce((sum, record) => sum + (record.codOrdersDelivered || 0), 0);
  const averagePerDay = filteredRecords.length > 0 ? totalCODAmount / filteredRecords.length : 0;

  const exportToCSV = () => {
    const csvData = [
      ['Date', 'COD Amount Collected', 'Orders Delivered', 'Check In', 'Check Out', 'Hours Worked'],
      ...filteredRecords.map(record => [
        record.date,
        record.totalCodCollected || 0,
        record.codOrdersDelivered || 0,
        record.checkIn?.toDate?.()?.toLocaleTimeString() || 'N/A',
        record.checkOut?.toDate?.()?.toLocaleTimeString() || 'N/A',
        record.totalHours?.toFixed(2) || 'N/A'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cod-report-${agent.agentId}-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">COD Collection Reports</h2>
        <p className="text-muted-foreground">
          Track your cash-on-delivery collections and performance metrics
        </p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
            <Button onClick={exportToCSV} variant="outline" className="shrink-0">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total COD Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalCODAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Over {filteredRecords.length} working days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Delivered</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              COD orders completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ₹{averagePerDay.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Daily average collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily COD Collection Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Data Found</h3>
              <p className="text-muted-foreground">
                No attendance records found for the selected date range.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>COD Collected</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Avg per Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const avgPerOrder = record.codOrdersDelivered > 0 
                      ? record.totalCodCollected / record.codOrdersDelivered 
                      : 0;

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-semibold">
                            ₹{(record.totalCodCollected || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {record.codOrdersDelivered || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.checkIn?.toDate?.()?.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.checkOut?.toDate?.()?.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) || 'Active'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.totalHours?.toFixed(1) || 'N/A'}h
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          ₹{avgPerOrder.toFixed(0)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
