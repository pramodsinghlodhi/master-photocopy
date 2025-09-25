import { 
  OrderAssignment, 
  AgentStatus, 
  OrderWithDetails, 
  AgentWorkload, 
  AssignmentFilters 
} from '@/types/order-management';
import { Order, Agent } from '@/lib/types';

export class OrderManagementService {
  /**
   * Find the best available agent for order assignment
   */
  static findBestAgent(
    availableAgents: Agent[], 
    agentStatuses: AgentStatus[], 
    order: Order,
    filters: AssignmentFilters = {}
  ): Agent | null {
    // Filter agents based on status and availability
    const eligibleAgents = availableAgents.filter(agent => {
      const status = agentStatuses.find(s => s.agentId === agent.agentId);
      
      if (!status) return false;
      
      // Must be active and not at capacity
      if (status.status !== 'active') return false;
      if (status.currentWorkload >= status.workloadCapacity) return false;
      
      // Exclude specific agents if requested
      if (filters.excludeAgents?.includes(agent.agentId)) return false;
      
      return true;
    });

    if (eligibleAgents.length === 0) return null;

    // Score and rank agents
    const scoredAgents = eligibleAgents.map(agent => {
      const status = agentStatuses.find(s => s.agentId === agent.agentId);
      let score = 0;

      // Base score from workload capacity (prefer less loaded agents)
      const workloadRatio = status!.currentWorkload / status!.workloadCapacity;
      score += (1 - workloadRatio) * 40; // 0-40 points

      // Location proximity bonus (if location data available)
      if (filters.location && status!.location) {
        const distance = this.calculateDistance(
          filters.location,
          { lat: status!.location.lat, lng: status!.location.lng }
        );
        // Closer agents get higher score (max 30 points)
        score += Math.max(0, 30 - distance);
      } else {
        score += 15; // neutral score if no location data
      }

      // Vehicle type bonus (priority for bikes for urgent orders)
      if (order.urgent && agent.vehicle?.type === 'bike') {
        score += 20;
      } else if (!order.urgent && agent.vehicle?.type === 'car') {
        score += 10;
      }

      // Experience bonus (based on agent creation date)
      const daysActive = Math.floor(
        (Date.now() - agent.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      score += Math.min(10, daysActive / 10); // Max 10 points for experience

      return { agent, score, workloadRatio, distance: 0 };
    });

    // Sort by score (highest first)
    scoredAgents.sort((a, b) => b.score - a.score);

    return scoredAgents[0].agent;
  }

  /**
   * Calculate distance between two coordinates (simplified)
   */
  static calculateDistance(
    coord1: { lat: number; lng: number }, 
    coord2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLng = this.deg2rad(coord2.lng - coord1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(coord1.lat)) * Math.cos(this.deg2rad(coord2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Get agent workload summary
   */
  static getAgentWorkloads(agents: Agent[], agentStatuses: AgentStatus[]): AgentWorkload[] {
    return agents.map(agent => {
      const status = agentStatuses.find(s => s.agentId === agent.agentId);
      
      return {
        agentId: agent.agentId,
        name: `${agent.first_name} ${agent.last_name}`,
        currentOrders: status?.currentWorkload || 0,
        capacity: status?.workloadCapacity || 5,
        status: status?.status || 'inactive',
        rating: 0, // TODO: Implement rating system
        completedOrders: 0, // TODO: Get from order history
      };
    });
  }

  /**
   * Validate if agent can accept new order
   */
  static canAssignToAgent(agent: Agent, status: AgentStatus): boolean {
    if (!status) return false;
    if (status.status !== 'active') return false;
    if (status.currentWorkload >= status.workloadCapacity) return false;
    
    return true;
  }

  /**
   * Create order assignment
   */
  static createOrderAssignment(
    orderId: string,
    agentId: string,
    assignedBy: string,
    notes?: string
  ): OrderAssignment {
    return {
      orderId,
      agentId,
      assignedAt: new Date(),
      assignedBy,
      status: 'assigned',
      notes,
    };
  }

  /**
   * Get order status display
   */
  static getOrderStatusBadge(order: OrderWithDetails): {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    text: string;
  } {
    if (order.assignment) {
      switch (order.assignment.status) {
        case 'assigned':
          return { variant: 'outline', text: 'Assigned' };
        case 'accepted':
          return { variant: 'secondary', text: 'Accepted' };
        case 'rejected':
          return { variant: 'destructive', text: 'Rejected' };
        case 'completed':
          return { variant: 'default', text: 'Completed' };
      }
    }
    
    switch (order.status) {
      case 'Processing':
        return { variant: 'outline', text: 'Processing' };
      case 'Out for Delivery':
        return { variant: 'secondary', text: 'Out for Delivery' };
      case 'Delivered':
        return { variant: 'default', text: 'Delivered' };
      default:
        return { variant: 'outline', text: order.status };
    }
  }
}