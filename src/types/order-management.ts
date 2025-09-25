export interface OrderAssignment {
  orderId: string;
  agentId: string;
  assignedAt: Date;
  assignedBy: string; // admin user ID
  status: 'assigned' | 'accepted' | 'rejected' | 'completed';
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  notes?: string;
}

export interface AgentStatus {
  id: string;
  agentId: string;
  status: 'active' | 'inactive' | 'suspended' | 'on-break';
  lastUpdated: Date;
  updatedBy: string;
  reason?: string;
  workloadCapacity: number; // max orders agent can handle
  currentWorkload: number; // current assigned orders
  checkedIn?: boolean; // current check-in status
  location?: {
    lat: number;
    lng: number;
    address: string;
    lastUpdated: Date;
  };
}

export interface AgentAttendanceRecord {
  id: string;
  agentId: string;
  date: string; // YYYY-MM-DD
  checkInTime?: Date;
  checkOutTime?: Date;
  breaks: {
    startTime: Date;
    endTime?: Date;
    reason: string;
    duration?: number; // minutes
  }[];
  totalWorkingHours?: number;
  status: 'checked-in' | 'checked-out' | 'on-break' | 'absent';
  location?: {
    checkIn?: { lat: number; lng: number; address: string };
    checkOut?: { lat: number; lng: number; address: string };
  };
}

export interface OrderWithDetails extends Order {
  assignedAgent?: {
    id: string;
    agentId: string;
    name: string;
    phone: string;
    vehicle: {
      type: string;
      number: string;
    };
    status: string;
  };
  assignment?: OrderAssignment;
  uploadedFiles?: {
    id: string;
    filename: string;
    url: string;
    type: 'document' | 'image' | 'other';
    uploadedAt: Date;
    uploadedBy: string;
  }[];
}

export interface AgentWorkload {
  agentId: string;
  name: string;
  currentOrders: number;
  capacity: number;
  status: string;
  distance?: number; // from order pickup location
  rating?: number;
  completedOrders: number;
}

export interface AssignmentFilters {
  location?: { lat: number; lng: number };
  urgency?: 'high' | 'medium' | 'low';
  orderType?: string;
  excludeAgents?: string[];
}

// Import Order type from existing types
import { Order } from '@/lib/types';