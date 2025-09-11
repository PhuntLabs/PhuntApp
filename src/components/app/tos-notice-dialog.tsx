
'use client';

import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface TosNoticeDialogProps {
  isOpen: boolean;
  onAccept: () => void;
}

export function TosNoticeDialog({ isOpen, onAccept }: TosNoticeDialogProps) {
  const handleDecline = () => {
    // In a real app, you might want to log the user out or redirect them.
    // For this prototype, we'll just close the dialog.
    // In a real scenario, the main form would remain disabled.
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileText /> Our Terms Have Been Updated
          </AlertDialogTitle>
          <AlertDialogDescription>
            We've made some changes to our Terms of Use and Privacy Policy. By clicking "Accept", you agree to the updated terms. Please take a moment to review them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
            <Link href="/terms" target="_blank" rel="noopener noreferrer">
                <Button variant="link" className="p-0 h-auto">View Terms of Use</Button>
            </Link>
            <br/>
            <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                <Button variant="link" className="p-0 h-auto">View Privacy Policy</Button>
            </Link>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="destructive" onClick={handleDecline}>Decline</Button>
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAccept}>Accept</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
