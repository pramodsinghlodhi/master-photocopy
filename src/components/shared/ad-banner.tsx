// src/components/shared/ad-banner.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '../ui/card';

// In a real application, this data would be fetched from your backend.
// This mock represents an ad marked as 'active' in your admin panel.
const MOCK_ACTIVE_AD = {
  id: 'ad-1',
  title: 'Special Offer: 20% Off Color Prints!',
  imageUrl: 'https://placehold.co/1200x150.png',
  redirectUrl: '/order',
  width: 1200,
  height: 150,
  isActive: true,
};

export function AdBanner() {
  // In a real app, you'd use a hook to fetch the active ad.
  // const { data: ad, isLoading } = useFetchActiveAd();
  const [ad, setAd] = useState(MOCK_ACTIVE_AD);

  // For demonstration, we'll just use the mock data.
  // If no ad is active, the component will render nothing.
  if (!ad || !ad.isActive) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <Link href={ad.redirectUrl} passHref>
        <div className="block w-full cursor-pointer" aria-label={ad.title}>
          <Image
            src={ad.imageUrl}
            alt={ad.title}
            width={ad.width}
            height={ad.height}
            className="w-full object-cover"
            data-ai-hint="promotional banner"
          />
        </div>
      </Link>
    </Card>
  );
}
