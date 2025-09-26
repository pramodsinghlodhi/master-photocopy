// src/components/referrals/referral-share.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Twitter, Facebook, Linkedin, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReferralShareProps {
    referralCode: string;
}

export function ReferralShare({ referralCode }: ReferralShareProps) {
    const { toast } = useToast();
    const referralUrl = `https://masterphotocopy.com/signup?ref=${referralCode}`;
    const shareText = `Join Master PhotoCopy and get a discount on your first order! Use my code: ${referralCode}`;

    const socialPlatforms = [
        { name: 'WhatsApp', icon: MessageSquare, url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralUrl}`)}` },
        { name: 'Twitter', icon: Twitter, url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralUrl)}` },
        { name: 'Facebook', icon: Facebook, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}` },
        { name: 'LinkedIn', icon: Linkedin, url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(referralUrl)}&title=${encodeURIComponent('Join Master PhotoCopy!')}&summary=${encodeURIComponent(shareText)}` },
    ];

    const handleShare = (url: string) => {
        if (typeof window !== 'undefined') {
            window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
        } else {
            toast({
                title: "Could not open share window",
                description: "Sharing is only available in a browser environment.",
                variant: 'destructive',
            });
        }
    };

    return (
        <div>
            <p className="text-sm font-medium">Or share via</p>
            <div className="flex flex-wrap gap-2 mt-2">
                {socialPlatforms.map(platform => (
                    <Button 
                        key={platform.name}
                        variant="outline" 
                        size="icon"
                        onClick={() => handleShare(platform.url)}
                        aria-label={`Share on ${platform.name}`}
                    >
                        <platform.icon className="h-5 w-5" />
                    </Button>
                ))}
            </div>
        </div>
    );
}
