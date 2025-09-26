import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Palette, Printer, Sparkles, UploadCloud } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: <UploadCloud className="h-10 w-10 text-primary" />,
      title: 'Smart Order Upload',
      description: 'Upload multiple PDFs at once. Drag, drop, and group files for batch printing with ease.',
      image: 'https://placehold.co/600x400.png',
      alt: 'File upload interface',
      hint: 'upload interface'
    },
    {
      icon: <Printer className="h-10 w-10 text-primary" />,
      title: 'Custom Print Settings',
      description: 'Choose from single/double-sided, color/B&W, and various binding options per file or group.',
      image: 'https://placehold.co/600x400.png',
      alt: 'Print settings selection',
      hint: 'print settings'
    },
    {
      icon: <Sparkles className="h-10 w-10 text-primary" />,
      title: 'AI Document Analysis',
      description: 'Our AI analyzes your document for formatting quality and provides suggestions for a perfect print.',
      image: 'https://placehold.co/600x400.png',
      alt: 'AI analysis results',
      hint: 'AI analysis'
    },
     {
      icon: <Palette className="h-10 w-10 text-primary" />,
      title: 'Real-Time Pricing',
      description: 'Transparent pricing that updates instantly as you customize your print job. No surprises.',
      image: 'https://placehold.co/600x400.png',
      alt: 'Real-time price calculator',
      hint: 'price calculator'
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Printer className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold">Master PhotoCopy</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Login
          </Link>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Professional Printing, Simplified
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    From single resumes to entire theses, get high-quality prints with custom settings and AI-powered enhancements.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup">
                      Upload & Print Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Hero"
                data-ai-hint="printing documents"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need for Perfect Prints</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is packed with powerful features to make your printing experience seamless and intelligent.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-12 py-12 lg:grid-cols-2 lg:gap-16">
              {features.map((feature, index) => (
                <div key={index} className="grid gap-4">
                    <div className="flex items-center gap-4">
                        {feature.icon}
                        <h3 className="text-xl font-bold">{feature.title}</h3>
                    </div>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Master PhotoCopy. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/legal/terms" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="/legal/privacy" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
           <Link href="/legal/refund" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Refund Policy
          </Link>
           <Link href="/feedback" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Feedback
          </Link>
          <Link href="/support" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Support
          </Link>
        </nav>
      </footer>
    </div>
  );
}
