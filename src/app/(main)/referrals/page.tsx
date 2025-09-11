// src/app/(main)/referrals/page.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Gift, IndianRupee } from 'lucide-react';
import { ReferralShare } from '@/components/referrals/referral-share';

const referralHistory = [
    { name: 'Alice', date: '2023-11-20', status: 'Completed', earning: 10 },
    { name: 'Bob', date: '2023-11-18', status: 'Pending', earning: 10 },
    { name: 'Charlie', date: '2023-11-15', status: 'Completed', earning: 10 },
];

const REFERRAL_CODE = "MASTERCOPY-A8B2C";

export default function ReferralsPage() {

  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Refer & Earn</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gift className="h-6 w-6 text-primary"/>Refer a Friend</CardTitle>
          <CardDescription>
            Share your referral code with friends. When they place their first order, you both get ₹10 in your wallet!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium">Your Referral Code</p>
            <div className="flex w-full max-w-sm items-center space-x-2">
                <Input type="text" value={REFERRAL_CODE} readOnly />
                <Button type="submit">
                <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
            </div>
          </div>
          <ReferralShare referralCode={REFERRAL_CODE} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>Track your referral earnings.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Referred Friend</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Earning</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {referralHistory.map((ref, index) => (
                        <TableRow key={index}>
                            <TableCell>{ref.name}</TableCell>
                            <TableCell>{ref.date}</TableCell>
                            <TableCell>{ref.status}</TableCell>
                            <TableCell className="text-right flex items-center justify-end"><IndianRupee className="h-4 w-4"/>{ref.earning.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
