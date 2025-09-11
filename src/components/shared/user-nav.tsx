
'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Wallet, FileText, MessageSquare, LifeBuoy } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { signOut } from "firebase/auth"
import { auth, isFirebaseConfigured } from "@/lib/firebase"
import { useAuthState } from 'react-firebase-hooks/auth';

function AuthUserNav() {
  const [user, loading] = useAuthState(auth!);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) return;
    try {
        await signOut(auth);
        router.push('/login');
    } catch(error: any) {
        toast({
            title: "Logout Failed",
            description: error.message,
            variant: "destructive",
        })
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  if (loading) {
    return null; // Don't show anything while loading auth state
  }

  if (!user) {
    return (
       <Button asChild>
            <Link href="/login">Login</Link>
        </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL ?? "https://placehold.co/40x40.png"} alt={user.displayName ?? 'User'} />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/wallet">
              <Wallet className="mr-2 h-4 w-4" />
              <span>Wallet</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
            <DropdownMenuItem asChild>
                <Link href="/legal/terms">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Terms of Service</span>
                </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href="/legal/privacy">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Privacy Policy</span>
                </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href="/legal/refund">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Refund Policy</span>
                </Link>
            </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
         <DropdownMenuGroup>
            <DropdownMenuItem asChild>
                <Link href="/feedback">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Feedback</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/support">
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    <span>Support</span>
                </Link>
            </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MockUserNav() {
    return (
        <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={"https://placehold.co/40x40.png"} alt={'User'} />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">John Doe</p>
            <p className="text-xs leading-none text-muted-foreground">
              john.doe@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/wallet">
              <Wallet className="mr-2 h-4 w-4" />
              <span>Wallet</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
            <DropdownMenuItem asChild>
                <Link href="/legal/terms">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Terms of Service</span>
                </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href="/legal/privacy">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Privacy Policy</span>
                </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href="/legal/refund">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Refund Policy</span>
                </Link>
            </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
         <DropdownMenuGroup>
            <DropdownMenuItem asChild>
                <Link href="/feedback">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Feedback</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/support">
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    <span>Support</span>
                </Link>
            </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    )
}


export function UserNav() {
  if (isFirebaseConfigured) {
      return <AuthUserNav/>;
  }
  return <MockUserNav />;
}
