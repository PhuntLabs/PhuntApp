'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const REPORT_EMAIL_TO = "your-email@example.com"; // IMPORTANT: Change this to your actual email address

export function BugReportSettings() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
            variant: "destructive",
            title: "File Too Large",
            description: "Please upload an image smaller than 5MB."
        });
        return;
      }
      setAttachment(file);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This method uses a mailto link, which has limitations (e.g., character limits, no real attachment).
    // For a real app, you would send this data to a backend service (e.g., a Cloud Function)
    // that then sends a formatted email.
    
    let mailtoBody = `Hello,\n\nI'm reporting a bug or providing feedback.\n\nWhat I was doing:\n${body}\n\n`;
    if (attachment) {
        mailtoBody += `\n[An image was attached, but mailto links do not support attachments. Please describe the image or send a follow-up email.]`;
    }
    mailtoBody += `\n\nThanks!`;

    const mailtoLink = `mailto:${REPORT_EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailtoBody)}`;
    
    window.location.href = mailtoLink;

    toast({
        title: "Email Client Opened",
        description: "Please complete and send the bug report using your email app."
    });
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Bugs & Feedback</h2>
      <p className="text-muted-foreground">Report a bug or provide feedback to the developers.</p>

      <Card className="mt-6">
        <CardHeader>
            <CardTitle>Submit a Report</CardTitle>
            <CardDescription>
                Your feedback is invaluable. Please provide as much detail as possible.
                To submit a report, please add and message <span className="font-bold text-primary">@heina</span> or <span className="font-bold text-primary">@thatguy123</span>.
            </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
                 <div className="space-y-1.5">
                    <Label htmlFor="report-subject">Subject</Label>
                    <Input 
                        id="report-subject" 
                        placeholder="e.g., 'Server settings not saving'"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                    />
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="report-body">What were you doing?</Label>
                    <Textarea 
                        id="report-body"
                        placeholder="Describe the steps you took, what you expected to happen, and what actually happened."
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        required
                        rows={6}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="report-attachment">Attach Screenshot (Optional)</Label>
                    <Input 
                        id="report-attachment" 
                        type="file"
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/gif"
                        className="file:text-foreground"
                    />
                    {attachment && <p className="text-xs text-muted-foreground">Attached: {attachment.name}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={!subject || !body}>
                    <Send className="mr-2 size-4"/>
                    Open Email Client to Send Report
                </Button>
            </CardContent>
        </form>
      </Card>
    </div>
  );
}
