'use client';

import { useState } from 'react';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase';
import { Agent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Car, 
  Upload, 
  CheckCircle, 
  FileText,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AgentOnboardingProps {
  user: any; // Firebase user
  onComplete: (agent: Agent) => void;
}

export function AgentOnboarding({ user, onComplete }: AgentOnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [vehicleInfo, setVehicleInfo] = useState({
    type: '',
    number: '',
    model: '',
    color: ''
  });

  const [documents, setDocuments] = useState({
    idProof: null as File | null,
    addressProof: null as File | null,
    vehicleProof: null as File | null
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handlePersonalInfoSubmit = () => {
    if (!personalInfo.first_name || !personalInfo.last_name || !personalInfo.email) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required personal information.",
        variant: "destructive"
      });
      return;
    }
    setStep(2);
  };

  const handleVehicleInfoSubmit = () => {
    if (!vehicleInfo.type || !vehicleInfo.number) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in vehicle type and number.",
        variant: "destructive"
      });
      return;
    }
    setStep(3);
  };

  const uploadDocument = async (file: File, path: string): Promise<string> => {
    // In a real app, you would upload to Firebase Storage
    // For now, we'll simulate the upload
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://example.com/documents/${path}/${Date.now()}_${file.name}`);
      }, 1000);
    });
  };

  const handleDocumentsSubmit = async () => {
    try {
      setLoading(true);

      if (!documents.idProof || !documents.addressProof) {
        toast({
          title: "Required Documents Missing",
          description: "Please upload ID proof and address proof.",
          variant: "destructive"
        });
        return;
      }

      // Upload documents
      const [idProofUrl, addressProofUrl, vehicleProofUrl] = await Promise.all([
        uploadDocument(documents.idProof, 'id_proof'),
        uploadDocument(documents.addressProof, 'address_proof'),
        documents.vehicleProof ? uploadDocument(documents.vehicleProof, 'vehicle_proof') : Promise.resolve(null)
      ]);

      // Create agent profile
      const agentData: Omit<Agent, 'agentId'> = {
        userRef: user.uid,
        uid: user.uid,
        phone: user.phoneNumber || '',
        first_name: personalInfo.first_name,
        last_name: personalInfo.last_name,
        email: personalInfo.email,
        vehicle: {
          type: vehicleInfo.type as 'bike' | 'car' | 'bicycle',
          number: vehicleInfo.number
        },
        status: 'pending',
        onboarding: {
          idProofUrl,
          addressProofUrl,
          vehicleProofUrl: vehicleProofUrl || undefined,
          completed: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (!db) {
        throw new Error('Database not initialized');
      }

      // Save to Firestore
      const agentRef = doc(db, 'agents', user.uid);
      await setDoc(agentRef, agentData);

      // Also create/update user document with agent role
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        role: 'agent',
        first_name: personalInfo.first_name,
        last_name: personalInfo.last_name,
        phone: user.phoneNumber || '',
        email: personalInfo.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {
          verifiedPhone: true
        }
      }, { merge: true });

      toast({
        title: "Onboarding Complete!",
        description: "Your agent profile has been created. Please wait for admin approval."
      });

      const completeAgent: Agent = {
        agentId: user.uid,
        ...agentData
      };

      onComplete(completeAgent);

    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalInfoStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              value={personalInfo.first_name}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, first_name: e.target.value }))}
              placeholder="Enter first name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              value={personalInfo.last_name}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, last_name: e.target.value }))}
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={personalInfo.email}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              value={user.phoneNumber || ''}
              disabled
              className="pl-10 bg-muted"
            />
          </div>
          <p className="text-xs text-muted-foreground">Phone number is verified and cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              id="address"
              value={personalInfo.address}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter full address"
              className="pl-10"
              rows={3}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={personalInfo.city}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Enter city"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={personalInfo.state}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, state: e.target.value }))}
              placeholder="Enter state"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              value={personalInfo.pincode}
              onChange={(e) => setPersonalInfo(prev => ({ ...prev, pincode: e.target.value }))}
              placeholder="Enter pincode"
            />
          </div>
        </div>

        <Button onClick={handlePersonalInfoSubmit} className="w-full">
          Continue to Vehicle Information
        </Button>
      </CardContent>
    </Card>
  );

  const renderVehicleInfoStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Vehicle Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vehicle_type">Vehicle Type *</Label>
          <Select value={vehicleInfo.type} onValueChange={(value) => setVehicleInfo(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select vehicle type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bike">Motorcycle/Scooter</SelectItem>
              <SelectItem value="car">Car</SelectItem>
              <SelectItem value="bicycle">Bicycle</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle_number">Vehicle Number *</Label>
          <Input
            id="vehicle_number"
            value={vehicleInfo.number}
            onChange={(e) => setVehicleInfo(prev => ({ ...prev, number: e.target.value.toUpperCase() }))}
            placeholder="Enter vehicle registration number"
            style={{ textTransform: 'uppercase' }}
          />
          <p className="text-xs text-muted-foreground">e.g., MH01AB1234</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle_model">Model (Optional)</Label>
            <Input
              id="vehicle_model"
              value={vehicleInfo.model}
              onChange={(e) => setVehicleInfo(prev => ({ ...prev, model: e.target.value }))}
              placeholder="e.g., Honda Activa"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle_color">Color (Optional)</Label>
            <Input
              id="vehicle_color"
              value={vehicleInfo.color}
              onChange={(e) => setVehicleInfo(prev => ({ ...prev, color: e.target.value }))}
              placeholder="e.g., Red"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
            Back
          </Button>
          <Button onClick={handleVehicleInfoSubmit} className="flex-1">
            Continue to Documents
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderDocumentsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>ID Proof * (Aadhar Card, Passport, Driving License)</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setDocuments(prev => ({ ...prev, idProof: e.target.files?.[0] || null }))}
                className="hidden"
                id="id-proof"
              />
              <Label htmlFor="id-proof" className="cursor-pointer">
                <Button variant="outline" className="pointer-events-none">
                  Choose File
                </Button>
              </Label>
              {documents.idProof && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {documents.idProof.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Address Proof * (Electricity Bill, Bank Statement, Rent Agreement)</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setDocuments(prev => ({ ...prev, addressProof: e.target.files?.[0] || null }))}
                className="hidden"
                id="address-proof"
              />
              <Label htmlFor="address-proof" className="cursor-pointer">
                <Button variant="outline" className="pointer-events-none">
                  Choose File
                </Button>
              </Label>
              {documents.addressProof && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {documents.addressProof.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Vehicle Proof (RC Book, Insurance) - Optional</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setDocuments(prev => ({ ...prev, vehicleProof: e.target.files?.[0] || null }))}
                className="hidden"
                id="vehicle-proof"
              />
              <Label htmlFor="vehicle-proof" className="cursor-pointer">
                <Button variant="outline" className="pointer-events-none">
                  Choose File
                </Button>
              </Label>
              {documents.vehicleProof && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {documents.vehicleProof.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> All documents will be verified by our team. Please ensure all documents are clear and valid.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={loading}>
            Back
          </Button>
          <Button onClick={handleDocumentsSubmit} className="flex-1" disabled={loading}>
            {loading ? 'Uploading...' : 'Complete Onboarding'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agent Onboarding</h1>
          <p className="mt-2 text-gray-600">
            Complete your profile to start delivering orders
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {step === 1 && renderPersonalInfoStep()}
          {step === 2 && renderVehicleInfoStep()}
          {step === 3 && renderDocumentsStep()}
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center space-x-4 mt-8">
          {[1, 2, 3].map((stepNumber) => (
            <div
              key={stepNumber}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                stepNumber < step
                  ? 'bg-green-100 text-green-600'
                  : stepNumber === step
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {stepNumber < step ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                stepNumber
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
