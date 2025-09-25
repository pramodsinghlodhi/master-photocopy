// src/app/admin/support/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, Search, CheckCircle2, MessageSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSupportTickets, resolveSupportTicket, updateTicketStatus, type SupportTicket, type TicketStatus } from '@/lib/mock-db';

const getStatusVariant = (status: TicketStatus) => {
    switch(status) {
        case 'Open': return 'destructive';
        case 'In Progress': return 'secondary';
        case 'Resolved': return 'default';
        default: return 'outline';
    }
}
const getPriorityVariant = (priority: SupportTicket['priority']) => {
    switch(priority) {
        case 'High': return 'destructive';
        case 'Medium': return 'secondary';
        case 'Low': return 'outline';
        default: return 'outline';
    }
}

export default function SupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
    const [currentTicket, setCurrentTicket] = useState<SupportTicket | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        const loadTickets = async () => {
            const data = await getSupportTickets();
            setTickets(data);
            setIsLoading(false);
        };
        loadTickets();
    }, []);

    const handleOpenReplyDialog = (ticket: SupportTicket) => {
        setCurrentTicket(ticket);
        setIsReplyDialogOpen(true);
    }
    
    const handleSendReply = async () => {
        if (!currentTicket || !replyMessage.trim()) {
            toast({ title: 'Please enter a reply message.', variant: 'destructive' });
            return;
        }

        // In a real app, this would send an email or push notification.
        // Here, we'll simulate it with a toast and update the ticket status.
        await updateTicketStatus(currentTicket.id, 'In Progress');
        const data = await getSupportTickets();
        setTickets(data);
        
        toast({ 
            title: `Reply Sent to ${currentTicket.user}`,
            description: 'The user has been notified of your reply.',
        });

        // Reset state and close dialog
        setReplyMessage('');
        setCurrentTicket(null);
        setIsReplyDialogOpen(false);
    }

    const handleResolve = async (id: string) => {
        await resolveSupportTicket(id);
        const data = await getSupportTickets();
        setTickets(data);
        toast({ title: `Ticket ${id} marked as resolved.` });
    }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Support Tickets</h1>
      </div>

       <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search by ticket ID or subject..." 
                className="pl-10"
            />
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Tickets</CardTitle>
          <CardDescription>Manage and respond to customer support requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map(ticket => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.id}</TableCell>
                  <TableCell>{ticket.user}</TableCell>
                  <TableCell>{ticket.subject}</TableCell>
                   <TableCell>
                    <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                  </TableCell>
                  <TableCell>
                     <Badge variant={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenReplyDialog(ticket)}>
                                <MessageSquare className="mr-2"/>Reply
                            </DropdownMenuItem>
                            {ticket.status !== 'Resolved' && (
                                <DropdownMenuItem onClick={() => handleResolve(ticket.id)}><CheckCircle2 className="mr-2"/>Mark as Resolved</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reply to Ticket #{currentTicket?.id}</DialogTitle>
                <DialogDescription>
                    Your message will be sent to the customer. The ticket status will be updated to &quot;In Progress&quot;.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="reply-message">Your Reply</Label>
                    <Textarea 
                        id="reply-message" 
                        rows={5} 
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your response here..."
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSendReply}>Send Reply</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
