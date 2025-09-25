'use client';

import { useState } from 'react';
import { AdminAgentManagement } from '@/components/admin/agent-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Users, 
  ArrowLeft,
  Settings
} from 'lucide-react';

export default function AdminAgentManagementPage() {
  const [impersonationMode, setImpersonationMode] = useState(false);
  const [impersonatedAgent, setImpersonatedAgent] = useState<{id: string; name: string} | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingImpersonation, setPendingImpersonation] = useState<{id: string; name: string} | null>(null);

  const handleImpersonate = (agentId: string, agentName: string) => {
    setPendingImpersonation({ id: agentId, name: agentName });
    setShowConfirmDialog(true);
  };

  const confirmImpersonation = () => {
    if (pendingImpersonation) {
      setImpersonatedAgent(pendingImpersonation);
      setImpersonationMode(true);
      setShowConfirmDialog(false);
      setPendingImpersonation(null);
      
      // In a real app, you would:
      // 1. Set session data to impersonate the agent
      // 2. Redirect to agent dashboard with special flag
      // 3. Log the impersonation action for audit
      
      alert(`Impersonation mode activated for ${pendingImpersonation.name}. In a real application, you would now be viewing their dashboard.`);
    }
  };

  const stopImpersonation = () => {
    setImpersonationMode(false);
    setImpersonatedAgent(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Management</h1>
          <p className="text-gray-600 mt-1">
            Manage agent status, attendance, and performance
          </p>
        </div>
        
        {impersonationMode && impersonatedAgent && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium text-orange-800">
                      Impersonating {impersonatedAgent.name}
                    </div>
                    <div className="text-sm text-orange-600">
                      Admin view - actions will be logged
                    </div>
                  </div>
                </div>
                <Button
                  onClick={stopImpersonation}
                  size="sm"
                  variant="outline"
                  className="border-orange-300 hover:bg-orange-100"
                >
                  <EyeOff className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <AdminAgentManagement onImpersonate={handleImpersonate} />

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              Confirm Agent Impersonation
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 mt-0.5 text-orange-600">
                  <Eye />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-orange-800 mb-1">
                    You are about to impersonate:
                  </div>
                  <div className="text-orange-700">
                    <strong>{pendingImpersonation?.name}</strong>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p>This action will:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Allow you to view the agent's dashboard and data</li>
                <li>Be logged for security and audit purposes</li>
                <li>Show a banner indicating impersonation mode</li>
                <li>Can be stopped at any time</li>
              </ul>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmImpersonation}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Eye className="w-4 h-4 mr-2" />
                Start Impersonation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}