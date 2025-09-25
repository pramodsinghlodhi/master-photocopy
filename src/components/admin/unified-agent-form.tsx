'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Key } from 'lucide-react';

interface UnifiedAgentFormProps {
  form: any;
  setForm: (updater: (prev: any) => any) => void;
  onGenerateCredentials: () => void;
  onCreateAgent: () => void;
  onCopyToClipboard: (text: string, label: string) => void;
}

export function UnifiedAgentForm({
  form,
  setForm,
  onGenerateCredentials,
  onCreateAgent,
  onCopyToClipboard
}: UnifiedAgentFormProps) {
  const handleFileChange = (field: string, file: File | null) => {
    setForm(prev => ({ ...prev, [field]: file }));
  };

  const getFilePreview = (file: File | null) => {
    if (!file) return null;
    return {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type
    };
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 mb-4">
        Create a new agent account with all required information and login credentials.
      </div>
      
      {/* Personal Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-lg border-b pb-2">Personal Information</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => setForm(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Enter first name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => setForm(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email (Optional)</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
          />
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-lg border-b pb-2">Vehicle Information</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <select
              id="vehicleType"
              value={form.vehicleType}
              onChange={(e) => setForm(prev => ({ ...prev, vehicleType: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="bike">Bike</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleNumber">Vehicle Number</Label>
            <Input
              id="vehicleNumber"
              value={form.vehicleNumber}
              onChange={(e) => setForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
              placeholder="Enter vehicle number"
            />
          </div>
        </div>
      </div>

      {/* Login Credentials */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-lg border-b pb-2 flex-1">Login Credentials</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateCredentials}
            className="ml-4"
          >
            <Key className="h-4 w-4 mr-2" />
            Generate
          </Button>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="agentId">Agent ID</Label>
            <div className="flex gap-2">
              <Input
                id="agentId"
                value={form.agentId}
                readOnly
                placeholder="Click Generate to create ID"
                className="bg-muted"
              />
              {form.agentId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyToClipboard(form.agentId, 'Agent ID')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                value={form.password}
                readOnly
                placeholder="Click Generate to create password"
                className="bg-muted"
              />
              {form.password && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyToClipboard(form.password, 'Password')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {form.agentId && form.password && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Share these credentials with the agent securely. They will use these to log in to the agent portal.
            </p>
          </div>
        )}
      </div>

      {/* Document Upload */}
      <div className="space-y-4">
        <h4 className="font-medium text-lg border-b pb-2">Document Upload</h4>
        
        <div className="space-y-4">
          {/* ID Proof */}
          <div className="space-y-2">
            <Label>ID Proof * (Aadhar Card, PAN Card, Driving License)</Label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(e) => handleFileChange('idProof', e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>
              {form.idProof && (
                <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  📄 {getFilePreview(form.idProof)?.name} ({getFilePreview(form.idProof)?.size})
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, JPEG, PDF up to 10MB</p>
          </div>

          {/* Address Proof */}
          <div className="space-y-2">
            <Label>Address Proof * (Utility Bill, Bank Statement, Rent Agreement)</Label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(e) => handleFileChange('addressProof', e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>
              {form.addressProof && (
                <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  📄 {getFilePreview(form.addressProof)?.name} ({getFilePreview(form.addressProof)?.size})
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, JPEG, PDF up to 10MB</p>
          </div>

          {/* Vehicle Proof */}
          <div className="space-y-2">
            <Label>Vehicle Proof (RC Book, Insurance - Optional)</Label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(e) => handleFileChange('vehicleProof', e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>
              {form.vehicleProof && (
                <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  📄 {getFilePreview(form.vehicleProof)?.name} ({getFilePreview(form.vehicleProof)?.size})
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, JPEG, PDF up to 10MB</p>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-4">
        <h4 className="font-medium text-lg border-b pb-2">Additional Information</h4>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <textarea
            id="notes"
            value={form.notes || ''}
            onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional information or special requirements..."
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t">
        <Button
          onClick={onCreateAgent}
          className="w-full"
          disabled={!form.firstName || !form.lastName || !form.phone || !form.agentId || !form.password}
        >
          Create Agent Account
        </Button>
      </div>
    </div>
  );
}