'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ExternalLink } from 'lucide-react';

interface ExternalLinkDialogProps {
  children: React.ReactNode;
  url: string;
}

export function ExternalLinkDialog({ children, url }: ExternalLinkDialogProps) {

  const handleContinue = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
             <ExternalLink className="size-5" /> Are you sure you want to leave?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This link is taking you to the following website. Make sure you trust this link before proceeding.
             <div className="mt-2 p-2 bg-muted rounded-md text-muted-foreground text-sm break-all">
              {url}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleContinue}>
            Continue to Site
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
