'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Agent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Package, TrendingUp, Download, Filter, Users, Eye } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns';

interface AttendanceWithCOD {
  id: string;
  agentId: string;
  agentName?: string;
  date: string;
  checkIn: any;
  checkOut?: any;
  totalHours?: number;
  totalCodCollected: number;
  codOrdersDelivered: number;
}

export function AdminCODDashboard() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceWithCOD[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [filteredRecords, setFilteredRecords] = useState<AttendanceWithCOD[]>([]);

  // Load agents
  useEffect(() => {
    if (!db) return;

    const agentsQuery = query(
      collection(db, 'agents'),
      where('status', '!=', 'deleted'),
      orderBy('first_name')
    );

    const unsubscribe = onSnapshot(agentsQuery, (snapshot) => {
      const agentsList = snapshot.docs.map(doc => ({
        ...doc.data(),
        agentId: doc.id
      })) as Agent[];
      setAgents(agentsList);
    });

    return () => unsubscribe();
  }, []);

  // Load attendance records
  useEffect(() => {
    if (!db) return;

    const attendanceQuery = query(
      collection(db, 'agentAttendance'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => {
        const data = doc.data();
        const agent = agents.find(a => a.agentId === data.agentId);
        return {
          id: doc.id,
          ...data,
          agentName: agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown Agent'
        };
      }) as AttendanceWithCOD[];

      setAttendanceRecords(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [agents]);

  // Filter records
  useEffect(() => {
    let filtered = attendanceRecords;

    // Filter by date range
    const startDate = startOfDay(new Date(dateRange.start));
    const endDate = endOfDay(new Date(dateRange.end));

    filtered = filtered.filter(record => {
      const recordDate = new Date(record.date);
      return isWithinInterval(recordDate, { start: startDate, end: endDate });
    });

    // Filter by agent
    if (selectedAgent !== 'all') {
      filtered = filtered.filter(record => record.agentId === selectedAgent);
    }

    setFilteredRecords(filtered);
  }, [attendanceRecords, dateRange, selectedAgent]);

  const totalCODAmount = filteredRecords.reduce((sum, record) => sum + (record.totalCodCollected || 0), 0);
  const totalOrders = filteredRecords.reduce((sum, record) => sum + (record.codOrdersDelivered || 0), 0);
  const activeAgents = new Set(filteredRecords.map(r => r.agentId)).size;

  const exportToCSV = () => {
    const csvData = [
      ['Date', 'Agent', 'COD Amount Collected', 'Orders Delivered', 'Check In', 'Check Out', 'Hours Worked'],
      ...filteredRecords.map(record => [
        record.date,
        record.agentName || 'Unknown',
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
    a.download = `admin-cod-report-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
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
        <h2 className="text-2xl font-bold mb-2">COD Collection Management</h2>
        <p className="text-muted-foreground">
          Monitor and manage cash-on-delivery collections across all delivery agents
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
            <div>
              <Label htmlFor="agent-select">Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent.agentId} value={agent.agentId}>
                      {agent.first_name} {agent.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportToCSV} variant="outline" className="shrink-0">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              COD orders delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {activeAgents}
            </div>
            <p className="text-xs text-muted-foreground">
              Agents with collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₹{totalOrders > 0 ? (totalCODAmount / totalOrders).toFixed(0) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per COD order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* COD Collection Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            COD Collection Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Data Found</h3>
              <p className="text-muted-foreground">
                No COD collection records found for the selected filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>COD Collected</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Avg per Order</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Hours</TableHead>
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
                          <div className="font-medium">{record.agentName}</div>
                          <div className="text-sm text-muted-foreground">ID: {record.agentId}</div>
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
                        <TableCell className="text-sm text-muted-foreground">
                          ₹{avgPerOrder.toFixed(0)}
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
