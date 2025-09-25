'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Calculator, 
  Truck, 
  DollarSign,
  MapPin,
  TrendingUp,
  Users
} from 'lucide-react';

interface DeliveryPricingRule {
  id?: string;
  maxDistanceKm: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  description?: string;
  agentCommissionPercentage?: number;
}

interface PricingCalculation {
  distance: number;
  basePrice: number;
  agentCommission: number;
  companyRevenue: number;
  applicableRule: DeliveryPricingRule;
}

export function DynamicDeliveryPricing() {
  const [rules, setRules] = useState<DeliveryPricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DeliveryPricingRule | null>(null);
  const [calculation, setCalculation] = useState<PricingCalculation | null>(null);
  const [testDistance, setTestDistance] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    maxDistanceKm: '',
    price: '',
    description: '',
    agentCommissionPercentage: '70',
    isActive: true
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/delivery-pricing');
      const data = await response.json();

      if (response.ok) {
        setRules(data.data || []);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch pricing rules',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pricing rules',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.maxDistanceKm || !formData.price) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const method = editingRule ? 'PUT' : 'POST';
      const body = editingRule 
        ? { id: editingRule.id, ...formData, maxDistanceKm: Number(formData.maxDistanceKm), price: Number(formData.price), agentCommissionPercentage: Number(formData.agentCommissionPercentage) }
        : { ...formData, maxDistanceKm: Number(formData.maxDistanceKm), price: Number(formData.price), agentCommissionPercentage: Number(formData.agentCommissionPercentage) };

      const response = await fetch('/api/delivery-pricing', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Pricing rule ${editingRule ? 'updated' : 'created'} successfully`
        });
        fetchRules();
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast({
          title: 'Error',
          description: data.error || `Failed to ${editingRule ? 'update' : 'create'} pricing rule`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingRule ? 'update' : 'create'} pricing rule`,
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (rule: DeliveryPricingRule) => {
    setEditingRule(rule);
    setFormData({
      maxDistanceKm: rule.maxDistanceKm.toString(),
      price: rule.price.toString(),
      description: rule.description || '',
      agentCommissionPercentage: (rule.agentCommissionPercentage || 70).toString(),
      isActive: rule.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/delivery-pricing?id=${ruleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Pricing rule deleted successfully'
        });
        fetchRules();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete pricing rule',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete pricing rule',
        variant: 'destructive'
      });
    }
  };

  const calculatePrice = async () => {
    if (!testDistance || isNaN(Number(testDistance)) || Number(testDistance) <= 0) {
      toast({
        title: 'Invalid Distance',
        description: 'Please enter a valid distance in kilometers',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`/api/delivery-pricing?distance=${testDistance}&calculate=true`);
      const data = await response.json();

      if (response.ok) {
        setCalculation(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to calculate delivery price',
          variant: 'destructive'
        });
        setCalculation(null);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      toast({
        title: 'Error',
        description: 'Failed to calculate delivery price',
        variant: 'destructive'
      });
      setCalculation(null);
    }
  };

  const resetForm = () => {
    setEditingRule(null);
    setFormData({
      maxDistanceKm: '',
      price: '',
      description: '',
      agentCommissionPercentage: '70',
      isActive: true
    });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading pricing rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dynamic Delivery Pricing</h1>
          <p className="text-muted-foreground">
            Set delivery fees based on distance ranges for your delivery service
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Pricing Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Pricing Rule' : 'Add New Pricing Rule'}
              </DialogTitle>
              <DialogDescription>
                Configure delivery pricing based on maximum distance
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxDistance">Max Distance (km) *</Label>
                  <Input
                    id="maxDistance"
                    type="number"
                    placeholder="e.g., 10"
                    value={formData.maxDistanceKm}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxDistanceKm: e.target.value }))}
                    required
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g., 50"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                    min="0"
                    step="1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="commission">Agent Commission (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  placeholder="e.g., 70"
                  value={formData.agentCommissionPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, agentCommissionPercentage: e.target.value }))}
                  min="0"
                  max="100"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Percentage of delivery fee that goes to the agent
                </p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="active">Active</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Price Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Price Calculator
          </CardTitle>
          <CardDescription>
            Test delivery pricing for any distance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="testDistance">Distance (km)</Label>
              <Input
                id="testDistance"
                type="number"
                placeholder="Enter distance to test"
                value={testDistance}
                onChange={(e) => setTestDistance(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
            <Button onClick={calculatePrice} disabled={!testDistance}>
              Calculate Price
            </Button>
          </div>

          {calculation && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Distance</p>
                  <p className="text-lg font-bold text-blue-900">{calculation.distance} km</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Price</p>
                  <p className="text-lg font-bold text-green-900">₹{calculation.basePrice}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Agent Gets</p>
                  <p className="text-lg font-bold text-purple-900">₹{calculation.agentCommission}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600 font-medium">Company Gets</p>
                  <p className="text-lg font-bold text-orange-900">₹{calculation.companyRevenue}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Pricing Rules
          </CardTitle>
          <CardDescription>
            Configure pricing based on delivery distance ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900">No pricing rules configured</p>
              <p className="text-gray-500 mb-4">Add your first pricing rule to get started</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Rule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Distance Range</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Agent Commission</TableHead>
                  <TableHead>Company Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule, index) => {
                  const prevDistance = index > 0 ? rules[index - 1].maxDistanceKm : 0;
                  const agentCommission = Math.round((rule.price * (rule.agentCommissionPercentage || 70)) / 100);
                  const companyRevenue = rule.price - agentCommission;
                  
                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        {prevDistance > 0 ? `${prevDistance} - ${rule.maxDistanceKm}` : `0 - ${rule.maxDistanceKm}`} km
                      </TableCell>
                      <TableCell className="font-medium">₹{rule.price}</TableCell>
                      <TableCell>₹{agentCommission} ({rule.agentCommissionPercentage || 70}%)</TableCell>
                      <TableCell>₹{companyRevenue}</TableCell>
                      <TableCell>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rule.description || `Up to ${rule.maxDistanceKm} km`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(rule)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => rule.id && handleDelete(rule.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}