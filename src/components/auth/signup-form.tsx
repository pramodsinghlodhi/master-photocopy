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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
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
  const [myReferralCode, setMyReferralCode] = useState<string>('');
  
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
    if (!isFirebaseConfigured || !auth || !db) {
        toast({ title: "Firebase not configured", description: "Please configure Firebase in your .env file", variant: "destructive" });
        return;
    }

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

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;

        await updateProfile(user, {
            displayName: values.name,
        });

        // Generate user's own referral code
        const userReferralCode = generateReferralCode(values.name, values.email);
        setMyReferralCode(userReferralCode);

        // Create user document
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: values.name,
            email: values.email,
            phone: values.phone || '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            landmark: '',
            referralCode: userReferralCode,
            usedReferralCode: values.referralCode?.trim() || '',
            createdAt: new Date(),
        });

        // Create user's referral document
        await setDoc(doc(db, 'referrals', userReferralCode), {
          userId: user.uid,
          code: userReferralCode,
          totalReferrals: 0,
          createdAt: new Date(),
          lastReferralAt: null
        });

        // Process referral reward if referral code was used
        if (values.referralCode && values.referralCode.trim()) {
          await processReferralReward(values.referralCode.trim(), user.uid);
        } else {
          // Create wallet for new user without referral bonus
          await setDoc(doc(db, 'wallets', user.uid), {
            userId: user.uid,
            balance: 0,
            createdAt: new Date(),
            lastUpdated: new Date()
          });
        }

        toast({
          title: "Account Created!",
          description: `Welcome! Your referral code is: ${userReferralCode}`,
        });
        
        router.push('/dashboard');
    } catch(error: any) {
        toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
        });
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
                  <Input placeholder="John Doe" {...field} />
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
                  <Input placeholder="name@example.com" {...field} />
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
                  <Input placeholder="9876543210" {...field} />
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
                  <Input type="password" placeholder="••••••••" {...field} />
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
                      <Input placeholder="Enter friend's referral code" {...field} />
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

          <Button type="submit" className="w-full">
            Create Account
          </Button>
        </form>
      </Form>
    </div>
  );
}
