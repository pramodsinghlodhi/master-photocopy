'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { Copy, Users } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }).optional(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  referralCode: z.string().optional(),
});

export function SignUpForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { register } = useAuth();
  const [myReferralCode, setMyReferralCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      referralCode: '',
    },
  });

  // Generate unique referral code
  const generateReferralCode = (name: string, email: string): string => {
    const namePrefix = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const emailPrefix = email.split('@')[0].substring(0, 3).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${namePrefix}${emailPrefix}${randomSuffix}`;
  };

  // Copy referral code to clipboard
  const copyReferralCode = () => {
    if (myReferralCode) {
      navigator.clipboard.writeText(myReferralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  // Validate referral code
  const validateReferralCode = async (code: string): Promise<boolean> => {
    if (!code || !db) return false;
    
    try {
      const referralDoc = await getDoc(doc(db, 'referrals', code));
      return referralDoc.exists();
    } catch (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
  };

  // Process referral reward
  const processReferralReward = async (referralCode: string, newUserId: string) => {
    if (!db) return;

    try {
      const referralDoc = await getDoc(doc(db, 'referrals', referralCode));
      if (referralDoc.exists()) {
        const referralData = referralDoc.data();
        const referrerUserId = referralData.userId;

        // Add ₹10 to both users' wallets
        const referrerWalletRef = doc(db, 'wallets', referrerUserId);
        const newUserWalletRef = doc(db, 'wallets', newUserId);

        // Update referrer's wallet
        await updateDoc(referrerWalletRef, {
          balance: increment(10),
          lastUpdated: new Date()
        }).catch(async () => {
          // Create wallet if it doesn't exist
          await setDoc(referrerWalletRef, {
            userId: referrerUserId,
            balance: 10,
            createdAt: new Date(),
            lastUpdated: new Date()
          });
        });

        // Create new user's wallet with referral bonus
        await setDoc(newUserWalletRef, {
          userId: newUserId,
          balance: 10,
          createdAt: new Date(),
          lastUpdated: new Date()
        });

        // Update referral stats
        await updateDoc(doc(db, 'referrals', referralCode), {
          totalReferrals: increment(1),
          lastReferralAt: new Date()
        });

        // Create referral transaction records
        const transactionData = {
          amount: 10,
          type: 'referral_bonus',
          description: 'Referral bonus',
          createdAt: new Date()
        };

        await setDoc(doc(db, 'transactions', `${referrerUserId}_${Date.now()}_ref`), {
          ...transactionData,
          userId: referrerUserId,
          description: 'Referral bonus - Friend joined'
        });

        await setDoc(doc(db, 'transactions', `${newUserId}_${Date.now()}_ref`), {
          ...transactionData,
          userId: newUserId,
          description: 'Welcome bonus - Used referral code'
        });

        toast({
          title: "Referral Success!",
          description: "You and your friend both received ₹10 wallet bonus!",
        });
      }
    } catch (error) {
      console.error('Error processing referral reward:', error);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      // Validate referral code if provided
      if (values.referralCode && values.referralCode.trim()) {
        const isValidReferral = await validateReferralCode(values.referralCode.trim());
        if (!isValidReferral) {
          toast({
            title: "Invalid Referral Code",
            description: "The referral code you entered is not valid.",
            variant: "destructive",
          });
          return;
        }
      }

      // Register user using the new auth system
      const result = await register(values.email, values.password, values.name, 'user');
      
      if (!result.success) {
        toast({
          title: "Sign Up Failed",
          description: result.error || "Registration failed",
          variant: "destructive",
        });
        return;
      }

      // Generate user's own referral code
      const userReferralCode = generateReferralCode(values.name, values.email);
      setMyReferralCode(userReferralCode);

      // Additional Firestore operations if Firebase is configured
      if (isFirebaseConfigured && db) {
        try {
          // Note: We'll get the user ID from the auth context after successful registration
          // For now, we'll create a placeholder and update it in a useEffect
          
          toast({
            title: "Account Created!",
            description: `Welcome! Your referral code will be: ${userReferralCode}`,
          });
        } catch (error) {
          console.warn('Error with additional Firestore operations:', error);
        }
      }

      toast({
        title: "Account Created!",
        description: "Welcome to Master Photocopy!",
      });
      
      router.push('/dashboard');
      
    } catch(error: any) {
        toast({
            title: "Sign Up Failed",
            description: error.message || "An unexpected error occurred",
            variant: "destructive",
        });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="name@example.com" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="9876543210" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator className="my-6" />

          {/* Referral Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Refer a Friend
              </CardTitle>
              <CardDescription>
                Share your referral code with friends. When they place their first order, you both get ₹10 in your wallet!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Have a Referral Code? (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter friend's referral code" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {myReferralCode && (
                <div>
                  <FormLabel>Your Referral Code</FormLabel>
                  <div className="flex items-center gap-2 mt-2">
                    <Input 
                      value={myReferralCode} 
                      readOnly 
                      className="bg-muted"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyReferralCode}
                      disabled={isLoading}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share this code with friends to earn rewards!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
