import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';
import { AgentAttendanceRecord } from '@/types/order-management';

// Helper function to safely convert Firestore timestamp to Date
function safeToDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  
  try {
    // If it's a Firestore Timestamp, it has a toDate method
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // If it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    // If it's a string or number, try to convert
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch (error: any) {
    console.warn('Failed to convert timestamp:', timestamp, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const action = searchParams.get('action');

    switch (action) {
      case 'attendance-record': {
        if (!agentId || !date) {
          return NextResponse.json({ 
            error: 'Agent ID and date required' 
          }, { status: 400 });
        }

        const attendanceDoc = await db.collection('agent_attendance')
          .doc(`${agentId}_${date}`)
          .get();

        if (!attendanceDoc.exists) {
          return NextResponse.json({
            success: true,
            attendance: null
          });
        }

        const attendanceData = attendanceDoc.data();
        const attendance = {
          id: attendanceDoc.id,
          agentId: attendanceData?.agentId || agentId,
          date: attendanceData?.date || new Date().toISOString().split('T')[0],
          checkInTime: safeToDate(attendanceData?.checkInTime),
          checkOutTime: safeToDate(attendanceData?.checkOutTime),
          breaks: attendanceData?.breaks?.map((b: any) => ({
            ...b,
            startTime: safeToDate(b.startTime),
            endTime: safeToDate(b.endTime),
          })) || [],
          totalWorkingHours: attendanceData?.totalWorkingHours,
          status: attendanceData?.status || 'absent',
          location: attendanceData?.location
        } as AgentAttendanceRecord;

        return NextResponse.json({
          success: true,
          attendance
        });
      }

      case 'attendance-summary': {
        if (!agentId) {
          return NextResponse.json({ 
            error: 'Agent ID required' 
          }, { status: 400 });
        }

        const startDate = searchParams.get('startDate') || 
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = searchParams.get('endDate') || 
          new Date().toISOString().split('T')[0];

        const attendanceSnapshot = await db.collection('agent_attendance')
          .where('agentId', '==', agentId)
          .where('date', '>=', new Date(startDate))
          .where('date', '<=', new Date(endDate + 'T23:59:59'))
          .get();

        const records: AgentAttendanceRecord[] = attendanceSnapshot.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            agentId: data.agentId || agentId,
            date: data.date || doc.id.split('_')[1], // Extract date from document ID if needed
            checkInTime: safeToDate(data.checkInTime) || undefined,
            checkOutTime: safeToDate(data.checkOutTime) || undefined,
            breaks: data.breaks?.map((b: any) => ({
              ...b,
              startTime: safeToDate(b.startTime),
              endTime: safeToDate(b.endTime),
            })) || [],
            totalWorkingHours: data.totalWorkingHours,
            status: data.status || 'absent',
            location: data.location
          };
        });

        // Calculate summary statistics
        const totalDays = records.length;
        const workingDays = records.filter(r => r.status === 'checked-in' || r.status === 'checked-out').length;
        const totalHours = records.reduce((sum, record) => {
          if (record.totalWorkingHours) {
            return sum + record.totalWorkingHours;
          }
          return sum;
        }, 0);

        const avgHoursPerDay = workingDays > 0 ? totalHours / workingDays : 0;
        const totalBreakTime = records.reduce((sum, record) => {
          return sum + record.breaks.reduce((breakSum, breakRecord) => {
            if (breakRecord.duration) {
              return breakSum + (breakRecord.duration / 60); // convert minutes to hours
            }
            return breakSum;
          }, 0);
        }, 0);

        return NextResponse.json({
          success: true,
          records,
          summary: {
            totalDays,
            workingDays,
            absentDays: totalDays - workingDays,
            totalHours: Math.round(totalHours * 100) / 100,
            avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
            totalBreakTime: Math.round(totalBreakTime * 100) / 100,
            attendanceRate: totalDays > 0 ? Math.round((workingDays / totalDays) * 100) : 0
          }
        });
      }

      case 'current-status': {
        if (!agentId) {
          return NextResponse.json({ 
            error: 'Agent ID required' 
          }, { status: 400 });
        }

        const today = new Date().toISOString().split('T')[0];
        const attendanceDoc = await db.collection('agent_attendance')
          .doc(`${agentId}_${today}`)
          .get();

        const attendanceData = attendanceDoc.data();
        const attendance = attendanceDoc.exists && attendanceData ? {
          id: attendanceDoc.id,
          agentId: attendanceData.agentId || agentId,
          date: attendanceData.date || today,
          checkInTime: safeToDate(attendanceData.checkInTime),
          checkOutTime: safeToDate(attendanceData.checkOutTime),
          breaks: attendanceData.breaks?.map((b: any) => ({
            ...b,
            startTime: safeToDate(b.startTime),
            endTime: safeToDate(b.endTime),
          })) || [],
          totalWorkingHours: attendanceData.totalWorkingHours,
          status: attendanceData.status || 'absent',
          location: attendanceData.location
        } as AgentAttendanceRecord : null;

        // Determine current status
        let currentStatus = 'not-checked-in';
        if (attendance) {
          if (attendance.checkOutTime) {
            currentStatus = 'checked-out';
          } else if (attendance.breaks?.some(b => !b.endTime)) {
            currentStatus = 'on-break';
          } else if (attendance.checkInTime) {
            currentStatus = 'working';
          }
        }

        return NextResponse.json({
          success: true,
          attendance,
          currentStatus
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Attendance API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const body = await request.json();
    const { action, agentId } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const attendanceRef = db.collection('agent_attendance').doc(`${agentId}_${today}`);
    const attendanceDoc = await attendanceRef.get();

    switch (action) {
      case 'check-in': {
        const { location } = body;

        if (attendanceDoc.exists) {
          const existingData = attendanceDoc.data();
          if (existingData?.checkInTime && !existingData?.checkOutTime) {
            return NextResponse.json({ 
              error: 'Agent is already checked in' 
            }, { status: 400 });
          }
        }

        const checkInTime = new Date();
        const attendanceData: Partial<AgentAttendanceRecord> = {
          agentId,
          date: today,
          checkInTime,
          status: 'checked-in',
          breaks: [],
          location: location ? {
            checkIn: location
          } : undefined
        };

        await attendanceRef.set(attendanceData);

        // Update agent status
        await db.collection('agent_status').doc(agentId).update({
          checkedIn: true,
          lastCheckIn: checkInTime,
          location: location || null,
          lastUpdated: new Date()
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Checked in successfully',
          checkInTime
        });
      }

      case 'check-out': {
        if (!attendanceDoc.exists) {
          return NextResponse.json({ 
            error: 'No attendance record found for today' 
          }, { status: 404 });
        }

        const existingData = attendanceDoc.data() as AgentAttendanceRecord;
        if (!existingData.checkInTime) {
          return NextResponse.json({ 
            error: 'Agent has not checked in yet' 
          }, { status: 400 });
        }

        if (existingData.checkOutTime) {
          return NextResponse.json({ 
            error: 'Agent is already checked out' 
          }, { status: 400 });
        }

        // Close any open break
        const breaks = existingData.breaks || [];
        if (breaks.length > 0 && !breaks[breaks.length - 1].endTime) {
          breaks[breaks.length - 1].endTime = new Date();
        }

        const checkOutTime = new Date();
        const checkInTime = safeToDate(existingData.checkInTime);
        
        if (!checkInTime) {
          return NextResponse.json({ 
            error: 'Invalid check-in time' 
          }, { status: 400 });
        }
        
        // Calculate total hours worked
        const totalBreakTime = breaks.reduce((total, breakRecord) => {
          const startTime = safeToDate(breakRecord.startTime);
          const endTime = safeToDate(breakRecord.endTime);
          if (startTime && endTime) {
            return total + ((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
          }
          return total;
        }, 0);

        const totalTime = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        const hoursWorked = Math.max(0, totalTime - totalBreakTime);

        await attendanceRef.update({
          checkOutTime,
          breaks,
          hoursWorked: Math.round(hoursWorked * 100) / 100,
          totalBreakTime: Math.round(totalBreakTime * 100) / 100,
          lastUpdated: new Date()
        });

        // Update agent status
        await db.collection('agent_status').doc(agentId).update({
          checkedIn: false,
          lastCheckOut: checkOutTime,
          lastUpdated: new Date()
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Checked out successfully',
          checkOutTime,
          hoursWorked: Math.round(hoursWorked * 100) / 100
        });
      }

      case 'start-break': {
        if (!attendanceDoc.exists) {
          return NextResponse.json({ 
            error: 'No attendance record found for today' 
          }, { status: 404 });
        }

        const existingData = attendanceDoc.data() as AgentAttendanceRecord;
        if (!existingData.checkInTime || existingData.checkOutTime) {
          return NextResponse.json({ 
            error: 'Agent must be checked in to start a break' 
          }, { status: 400 });
        }

        const breaks = existingData.breaks || [];
        if (breaks.length > 0 && !breaks[breaks.length - 1].endTime) {
          return NextResponse.json({ 
            error: 'Agent is already on a break' 
          }, { status: 400 });
        }

        const { reason = 'Break' } = body;
        breaks.push({
          startTime: new Date(),
          reason
        });

        await attendanceRef.update({ breaks });

        return NextResponse.json({ 
          success: true, 
          message: 'Break started successfully' 
        });
      }

      case 'end-break': {
        if (!attendanceDoc.exists) {
          return NextResponse.json({ 
            error: 'No attendance record found for today' 
          }, { status: 404 });
        }

        const existingData = attendanceDoc.data() as AgentAttendanceRecord;
        const breaks = existingData.breaks || [];
        
        if (breaks.length === 0 || breaks[breaks.length - 1].endTime) {
          return NextResponse.json({ 
            error: 'Agent is not currently on a break' 
          }, { status: 400 });
        }

        breaks[breaks.length - 1].endTime = new Date();

        await attendanceRef.update({ breaks });

        return NextResponse.json({ 
          success: true, 
          message: 'Break ended successfully' 
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Attendance action error:', error);
    return NextResponse.json(
      { error: 'Failed to process attendance action' },
      { status: 500 }
    );
  }
}