// src/components/shared/notifications.tsx
'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";

const mockNotifications = [
  { id: 1, title: "Order #ORD789 Shipped", description: "Your order has been shipped and is on its way." },
  { id: 2, title: "Referral Bonus!", description: "You've received a ₹10 bonus for referring a friend." },
  { id: 3, title: "Welcome to Masterphoto", description: "Your account has been created successfully." },
];

export function Notifications() {
  const [notifications, setNotifications] = React.useState(mockNotifications);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium leading-none">Notifications</p>
            <Button variant="ghost" size="sm" onClick={() => setNotifications([])}>
              <Check className="mr-2 h-4 w-4"/>Mark all as read
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-3">
                <p className="font-semibold">{notification.title}</p>
                <p className="text-xs text-muted-foreground">{notification.description}</p>
              </DropdownMenuItem>
            ))
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">No new notifications</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
