
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CircleDollarSign, Ticket, IndianRupee, CreditCard, Truck, Zap, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { OrderItem, PrintFile, FileGroup, UserData, Order } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface PriceSummaryProps {
  files: PrintFile[];
  groups: FileGroup[];
  totalCost: number;
}

const URGENT_FEE = 25; 
const OUT_OF_AREA_FEE = 50;

declare global {
    interface Window {
        Razorpay: any;
    }
}

function AuthPriceSummary({ files, groups, totalCost }: PriceSummaryProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [user, userLoading] = useAuthState(auth!);
  const [coupon, setCoupon] = React.useState('');
  const [discount, setDiscount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState('online');
  const [isUrgent, setIsUrgent] = React.useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);

  const isOutOfArea = false; 

  const handleApplyCoupon = () => {
    if (coupon.toUpperCase() === 'SAVE10') {
      const discountAmount = totalCost * 0.1;
      setDiscount(discountAmount);
      toast({
        title: 'Coupon Applied!',
        description: `You saved ₹${discountAmount.toFixed(2)}.`,
      });
    } else {
      toast({
        title: 'Invalid Coupon',
        description: 'The coupon code you entered is not valid.',
        variant: 'destructive',
      });
    }
  };
  
  const shippingFee = isOutOfArea ? OUT_OF_AREA_FEE : 0;
  const finalTotal = totalCost + (isUrgent ? URGENT_FEE : 0) + shippingFee - discount;
  const isCodEligible = finalTotal >= 100;

  React.useEffect(() => {
    if (!isCodEligible && paymentMethod === 'cod') {
      setPaymentMethod('online');
    }
  }, [isCodEligible, paymentMethod]);


  const saveOrderToDb = async (razorpayData: any = {}) => {
    if (!user || !db) return null;
    
    const allPrintFiles = [...files, ...groups.flatMap(g => g.files)];
    const orderItems: OrderItem[] = allPrintFiles.map(f => ({
        name: f.file.name,
        totalPages: f.totalPages,
        settings: f.settings,
        price: f.price,
    }));

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() as UserData : null;

    const orderData: Omit<Order, 'id'> = {
        userId: user.uid,
        customer: {
          name: user.displayName || 'N/A',
          email: user.email || 'N/A',
          phone: userData?.phone || 'N/A',
          address: userData?.address || 'N/A',
        },
        items: orderItems,
        itemCount: allPrintFiles.length,
        status: 'Processing' as const,
        total: finalTotal,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        paymentMethod: paymentMethod as 'online' | 'cod',
        isUrgent,
        paymentDetails: {
            ...razorpayData,
            status: razorpayData.razorpay_payment_id ? 'Paid' : 'Pending'
        }
    };
    
    const orderRef = await addDoc(collection(db, 'orders'), orderData);
    return orderRef.id;
  }

  const handlePlaceOrder = async () => {
      if (!user) {
          toast({ title: "Please login to place an order.", variant: 'destructive' });
          router.push('/login');
          return;
      }

      if (totalCost === 0) {
          toast({ title: "Your cart is empty.", description: "Please add files to create an order.", variant: 'destructive' });
          return;
      }

      setIsPlacingOrder(true);
      
      if (paymentMethod === 'cod') {
        try {
          await saveOrderToDb();
          toast({
              title: "Order Placed Successfully!",
              description: "You can track your order in your dashboard.",
          });
          router.push('/dashboard');
        } catch(error) {
            console.error("Error placing COD order:", error);
            toast({ title: "Failed to place order", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
        } finally {
            setIsPlacingOrder(false);
        }
        return;
      }

      // Handle Online Payment
      try {
        const res = await fetch('/api/razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: finalTotal * 100 })
        });
        
        if (!res.ok) {
            throw new Error('Failed to create Razorpay order');
        }
        
        const { order } = await res.json();
        
        const userDocRef = doc(db!, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() as UserData : {};

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: "INR",
            name: "Masterphoto Copy",
            description: "Document Printing Service",
            image: "/icon.png", // Add your logo here
            order_id: order.id,
            handler: async function (response: any){
                await saveOrderToDb({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                });

                toast({
                    title: "Payment Successful & Order Placed!",
                    description: "You can track your order in your dashboard.",
                });
                router.push('/dashboard');
            },
            prefill: {
                name: user.displayName,
                email: user.email,
                contact: userData.phone
            },
            notes: {
                userId: user.uid
            },
            theme: {
                color: "#2563eb"
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any){
                toast({
                    title: "Payment Failed",
                    description: response.error.description,
                    variant: 'destructive'
                });
                setIsPlacingOrder(false);
        });
        rzp.open();
        
      } catch(error) {
          console.error("Error processing payment:", error);
          toast({ title: "Payment Error", description: "Could not initiate payment. Please try again.", variant: "destructive" });
          setIsPlacingOrder(false);
      }
  }

  const getButtonText = () => {
    if (paymentMethod === 'cod') {
        return 'Place Order';
    }
    return 'Proceed to Payment';
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDollarSign className="h-6 w-6" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-4">
            <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium flex items-center"><IndianRupee className="h-4 w-4"/>{totalCost.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Checkbox id="urgent" checked={isUrgent} onCheckedChange={(checked) => setIsUrgent(checked as boolean)} />
                    <Label htmlFor="urgent" className="flex items-center gap-1.5 font-normal">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Urgent Delivery
                    </Label>
                </div>
                <span className="font-medium flex items-center"><IndianRupee className="h-4 w-4"/>{URGENT_FEE.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Shipping Fee</span>
              <span className="font-medium flex items-center"><IndianRupee className="h-4 w-4"/>{shippingFee.toFixed(2)}</span>
            </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="coupon" className="flex items-center gap-2 text-sm"><Ticket className="h-4 w-4"/> Have a coupon?</Label>
          <div className="flex gap-2">
            <Input id="coupon" placeholder="Enter coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
            <Button variant="outline" onClick={handleApplyCoupon}>Apply</Button>
          </div>
        </div>
        
        {discount > 0 && (
             <div className="flex items-center justify-between text-green-600">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium flex items-center">- <IndianRupee className="h-4 w-4"/>{discount.toFixed(2)}</span>
            </div>
        )}

        <Separator/>

        <div>
            <Label className="text-sm font-medium">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2 grid grid-cols-1 gap-2">
                <Label htmlFor='payment-online' className='flex items-center gap-2 rounded-md border p-3 hover:border-primary has-[[data-state=checked]]:border-primary'>
                    <RadioGroupItem value="online" id="payment-online" />
                    <CreditCard className="h-5 w-5"/>
                    <span className='font-normal'>Pay Online</span>
                </Label>
                 <Label htmlFor='payment-cod' className={`flex items-center gap-2 rounded-md border p-3 ${!isCodEligible ? 'cursor-not-allowed opacity-50' : 'hover:border-primary has-[[data-state=checked]]:border-primary'}`}>
                    <RadioGroupItem value="cod" id="payment-cod" disabled={!isCodEligible} />
                    <Truck className="h-5 w-5"/>
                    <span className='font-normal'>Cash on Delivery</span>
                     {!isCodEligible && <Badge variant="secondary" className="ml-auto">Min. ₹100</Badge>}
                </Label>
            </RadioGroup>
        </div>
        
        <Separator />
        <div className="flex items-center justify-between font-bold text-lg">
          <span>Total</span>
          <span className='flex items-center'><IndianRupee className="h-5 w-5"/>{finalTotal.toFixed(2)}</span>
        </div>
        <Button size="lg" className="w-full" onClick={handlePlaceOrder} disabled={isPlacingOrder || userLoading}>
          {isPlacingOrder ? <Loader className="animate-spin" /> : getButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
}

export function PriceSummary(props: PriceSummaryProps) {
  if (!isFirebaseConfigured) {
    return (
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDollarSign className="h-6 w-6" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
              Firebase not configured. Please login to place an order.
          </p>
          <Button disabled className="w-full">Place Order</Button>
        </CardContent>
      </Card>
    )
  }

  return <AuthPriceSummary {...props} />
}
