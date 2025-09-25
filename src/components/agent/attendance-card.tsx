'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, AlertCircle, CheckCircle2, Coffee } from 'lucide-react';
import { Agent } from '@/lib/types';
import { AgentStatus, AgentAttendanceRecord } from '@/types/order-management';
import { formatTime, safeToDate } from '@/lib/utils';

interface AttendanceCardProps {
  agentId: string;
  agent: Agent;
}

export function AttendanceCard({ agentId, agent }: AttendanceCardProps) {
  const [attendance, setAttendance] = useState<AgentAttendanceRecord | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('not-checked-in');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrentStatus();
  }, [agentId]);

  const fetchCurrentStatus = async () => {
    try {
      const response = await fetch(`/api/agent/attendance?action=current-status&agentId=${agentId}`);
      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance);
        setCurrentStatus(data.currentStatus);
      }
    } catch (error) {
      console.error('Failed to fetch attendance status:', error);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      // Get location if possible
      let location = null;
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: 'Current Location'
        };
      }

      const response = await fetch('/api/agent/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-in',
          agentId,
          location
        })
      });

      if (response.ok) {
        fetchCurrentStatus();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to check in');
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      alert('Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agent/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-out',
          agentId
        })
      });

      if (response.ok) {
        fetchCurrentStatus();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to check out');
      }
    } catch (error) {
      console.error('Check-out failed:', error);
      alert('Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setLoading(true);
    try {
      const reason = prompt('Break reason (optional):') || 'Break';
      const response = await fetch('/api/agent/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-break',
          agentId,
          reason
        })
      });

      if (response.ok) {
        fetchCurrentStatus();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start break');
      }
    } catch (error) {
      console.error('Start break failed:', error);
      alert('Failed to start break');
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agent/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end-break',
          agentId
        })
      });

      if (response.ok) {
        fetchCurrentStatus();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to end break');
      }
    } catch (error) {
      console.error('End break failed:', error);
      alert('Failed to end break');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'working':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Working</Badge>;
      case 'on-break':
        return <Badge variant="secondary"><Coffee className="w-3 h-3 mr-1" />On Break</Badge>;
      case 'checked-out':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Checked Out</Badge>;
      default:
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Not Checked In</Badge>;
    }
  };

  const getCurrentBreak = () => {
    if (!attendance?.breaks) return null;
    return attendance.breaks.find(b => !b.endTime);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Attendance
            </CardTitle>
            <CardDescription>
              Today's attendance status and time tracking
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Times */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Check In</div>
            <div className="text-lg font-semibold">
              {formatTime(safeToDate(attendance?.checkInTime))}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Check Out</div>
            <div className="text-lg font-semibold">
              {formatTime(safeToDate(attendance?.checkOutTime))}
            </div>
          </div>
        </div>

        {/* Current Break Info */}
        {currentStatus === 'on-break' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-yellow-800">On Break</div>
                <div className="text-sm text-yellow-600">
                  Started: {formatTime(safeToDate(getCurrentBreak()?.startTime))}
                </div>
              </div>
              <Coffee className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        )}

        {/* Working Hours */}
        {attendance?.totalWorkingHours && (
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600">Hours Worked Today</div>
            <div className="text-2xl font-bold text-blue-800">
              {attendance.totalWorkingHours.toFixed(1)}h
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {currentStatus === 'not-checked-in' && (
            <Button 
              onClick={handleCheckIn} 
              disabled={loading}
              className="col-span-2"
            >
              {loading ? 'Checking In...' : 'Check In'}
            </Button>
          )}
          
          {currentStatus === 'working' && (
            <>
              <Button 
                onClick={handleStartBreak} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Starting...' : 'Start Break'}
              </Button>
              <Button 
                onClick={handleCheckOut} 
                disabled={loading}
                variant="destructive"
              >
                {loading ? 'Checking Out...' : 'Check Out'}
              </Button>
            </>
          )}
          
          {currentStatus === 'on-break' && (
            <>
              <Button 
                onClick={handleEndBreak} 
                disabled={loading}
                variant="default"
              >
                {loading ? 'Ending...' : 'End Break'}
              </Button>
              <Button 
                onClick={handleCheckOut} 
                disabled={loading}
                variant="destructive"
              >
                {loading ? 'Checking Out...' : 'Check Out'}
              </Button>
            </>
          )}
          
          {currentStatus === 'checked-out' && (
            <Button 
              onClick={handleCheckIn} 
              disabled={loading}
              className="col-span-2"
            >
              {loading ? 'Checking In...' : 'Check In (New Day)'}
            </Button>
          )}
        </div>

        {/* Break History */}
        {attendance?.breaks && attendance.breaks.length > 0 && (
          <div className="pt-4 border-t">
            <div className="text-sm font-medium mb-2">Today's Breaks</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {attendance.breaks.map((breakRecord, index) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                  <div className="font-medium">{breakRecord.reason}</div>
                  <div className="text-gray-600">
                    {formatTime(safeToDate(breakRecord.startTime))} - {
                      breakRecord.endTime 
                        ? formatTime(safeToDate(breakRecord.endTime))
                        : 'Ongoing'
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}