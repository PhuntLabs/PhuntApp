
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-8">Terms of Use</h1>
        
        <div className="space-y-6 text-muted-foreground">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">1. Introduction</h2>
            <p>Welcome to Phunt ("we," "our," or "us"). These Terms of Use govern your access to and use of our application and services. By accessing or using our service, you agree to be bound by these terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">2. User Conduct</h2>
            <p>You agree not to use the service to post content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy. You are responsible for your conduct and content.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">3. Intellectual Property</h2>
            <p>The service and its original content, features, and functionality are and will remain the exclusive property of PhuntLabs and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of PhuntLabs.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">4. Termination</h2>
            <p>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">5. Limitation of Liability</h2>
            <p>In no event shall Phunt, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">6. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which PhuntLabs operates, without regard to its conflict of law provisions.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">7. Changes</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">8. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us.</p>
          </section>
        </div>
        
        <div className="mt-12 text-center">
            <Link href="/">
                <Button>Back to Home</Button>
            </Link>
        </div>
      </div>
    </div>
  );
}
