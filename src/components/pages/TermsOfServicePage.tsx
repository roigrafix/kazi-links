import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      {/* Header Section */}
      <section className="py-16 bg-primary text-primary-foreground border-b border-primary-foreground/10">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-heading text-5xl lg:text-7xl font-bold mb-4">
              Terms of Service
            </h1>
            <p className="font-paragraph text-xl text-primary-foreground/70">
              Last Updated: December 22, 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Terms of Service Content */}
      <section className="py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <div className="space-y-12">
            {[
              {
                number: 1,
                title: "Acceptance of Terms",
                content: "By accessing and using the KaziLinks website and mobile application (the \"Service\"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service. KaziLinks reserves the right to make changes to these Terms of Service at any time and without notice. Your continued use of the Service following the posting of revised Terms of Service means that you accept and agree to the changes."
              },
              {
                number: 2,
                title: "Use License",
                content: "Permission is granted to temporarily download one copy of the materials (information or software) on KaziLinks's Service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:\\n• Modify or copy the materials\\n• Use the materials for any commercial purpose or for any public display\\n• Attempt to decompile or reverse engineer any software contained on the Service\\n• Remove any copyright or other proprietary notations from the materials\\n• Transfer the materials to another person or \"mirror\" the materials on any other server\\n• Violate any applicable laws or regulations\\n• Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service"
              },
              {
                number: 3,
                title: "Disclaimer",
                content: "The materials on KaziLinks's Service are provided on an 'as is' basis. KaziLinks makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. Further, KaziLinks does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site."
              },
              {
                number: 4,
                title: "Limitations",
                content: "In no event shall KaziLinks or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on KaziLinks's Service, even if KaziLinks or a KaziLinks authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you."
              },
              {
                number: 5,
                title: "Accuracy of Materials",
                content: "The materials appearing on KaziLinks's Service could include technical, typographical, or photographic errors. KaziLinks does not warrant that any of the materials on its Service are accurate, complete, or current. KaziLinks may make changes to the materials contained on its Service at any time without notice. However, KaziLinks does not make any commitment to update the materials."
              },
              {
                number: 6,
                title: "Links",
                content: "KaziLinks has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by KaziLinks of the site. Use of any such linked website is at the user's own risk. If you believe that your intellectual property rights have been violated by any content on our Service, please contact us immediately at support@kazilinks.com."
              },
              {
                number: 7,
                title: "Modifications",
                content: "KaziLinks may revise these Terms of Service for its Service at any time without notice. By using this Service, you are agreeing to be bound by the then current version of these Terms of Service. We will notify you of any material changes to these terms by posting the updated Terms of Service on this page and updating the \"Last Updated\" date. Your continued use of the Service following the posting of revised Terms of Service means that you accept and agree to the changes."
              },
              {
                number: 8,
                title: "Governing Law",
                content: "These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location. The failure of KaziLinks to exercise or enforce any right or provision of these Terms of Service shall not constitute a waiver of such right or provision."
              },
              {
                number: 9,
                title: "User Responsibilities",
                content: "You agree to use the Service only for lawful purposes and in a way that does not infringe upon the rights of others or restrict their use and enjoyment of the Service. Prohibited behavior includes:\\n• Harassing or causing distress or inconvenience to any person\\n• Obscene or abusive language\\n• Disrupting the normal flow of dialogue within our Service\\n• Attempting to gain unauthorized access to our systems\\n• Transmitting obscene or abusive content\\n• Disrupting the normal flow of dialogue within the Service"
              },
              {
                number: 10,
                title: "Booking and Payment Terms",
                content: "When you make a booking through KaziLinks:\\n• You agree to provide accurate and complete information\\n• You are responsible for maintaining the confidentiality of your account information\\n• You agree to pay all charges incurred under your account\\n• You are responsible for all activities that occur under your account\\n• Cancellations must be made according to the freelancer's cancellation policy\\n• Refunds are processed according to our Refund Policy\\n• KaziLinks reserves the right to cancel any booking that violates these terms"
              },
              {
                number: 11,
                title: "Intellectual Property Rights",
                content: "Unless otherwise stated, KaziLinks owns the intellectual property rights for all material on the Service. All intellectual property rights are reserved. You may access this for personal use subject to restrictions set in these terms and conditions. You must not:\\n• Republish material from the Service\\n• Sell, rent or sub-license material from the Service\\n• Reproduce, duplicate or copy material from this Service for commercial purposes\\n• Redistribute content from KaziLinks unless content is specifically made for redistribution"
              },
              {
                number: 12,
                title: "Contact Information",
                content: "If you have any questions about these Terms of Service, please contact us at:\\n\\nKaziLinks\\nTerms of Service Inquiries\\nIndia\\nEmail: support@kazilinks.com\\n\\nWe will respond to your inquiry within 30 days of receipt."
              }
            ].map((item, index) => (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg p-8 border border-secondary-foreground/10"
              >
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-logoGold text-logoBlack font-heading font-bold">
                      {item.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="font-heading text-2xl font-semibold mb-4">
                      {item.title}
                    </h2>
                    <p className="font-paragraph text-secondary-foreground/80 whitespace-pre-line leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <p className="font-paragraph text-secondary-foreground/70 mb-6">
              Have questions about our Terms of Service?
            </p>
            <Button
              asChild
              size="lg"
              className="bg-logoGold hover:bg-logoGold/90 text-logoBlack font-heading font-semibold"
            >
              <Link to="/customer-service" className="flex items-center gap-2">
                Contact Support
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
