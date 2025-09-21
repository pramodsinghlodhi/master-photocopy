'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Upload, 
  ArrowLeft
} from 'lucide-react';

export default function UploadDocuments() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents - Not Available
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Feature Not Available</h3>
            <p className="text-muted-foreground">
              The document upload feature is currently not available for regular users.
              Please contact an administrator or use the admin panel for document uploads.
            </p>
          </div>

          <div className="flex gap-4 justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            
            <Button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}