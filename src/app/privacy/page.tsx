
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-muted-foreground">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, create or share content, and communicate with others. This may include your email address, username, and any messages or content you post.</p>
            <p>We also collect log information when you use our services, including IP address, browser type, and usage details.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">2. How We Use Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Provide, maintain, and improve our services.</li>
              <li>Communicate with you about products, services, offers, and events.</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
              <li>Personalize the services and provide content and features that match user profiles or interests.</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities and protect the rights and property of PhuntLabs and others.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">3. Sharing of Information</h2>
            <p>We do not share your personal information with third parties except in the following cases:</p>
             <ul className="list-disc list-inside space-y-2 pl-4">
                <li>With your consent.</li>
                <li>To comply with a legal obligation.</li>
                <li>To protect and defend the rights or property of PhuntLabs.</li>
                <li>With service providers who need access to such information to carry out work on our behalf.</li>
             </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">4. Data Security</h2>
            <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration, and destruction.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">5. Your Choices</h2>
            <p>You may update, correct, or delete information about you at any time by logging into your online account or emailing us. If you wish to delete your account, please contact us, but note that we may retain certain information as required by law or for legitimate business purposes.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">6. Changes to This Policy</h2>
            <p>We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice (such as adding a statement to our homepage or sending you a notification).</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-3 text-foreground">7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us.</p>
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
