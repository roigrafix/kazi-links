import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="font-paragraph text-xl text-primary-foreground/70">
              Last Updated: December 4, 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <div className="space-y-12">
            {[
              {
                number: 1,
                title: "Introduction",
                content: "KaziLinks (\"we\", \"us\", \"our\", or \"Company\") operates the KaziLinks website and mobile application (the \"Service\"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data. We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy."
              },
              {
                number: 2,
                title: "Information Collection and Use",
                content: "We collect several different types of information for various purposes to provide and improve our Service to you.\n\nTypes of Data Collected:\n• Personal Data: While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you (\"Personal Data\"). This may include, but is not limited to:\n  - Email address\n  - First name and last name\n  - Phone number\n  - Address, State, Province, ZIP/Postal code, City\n  - Cookies and Usage Data\n\n• Usage Data: We may also collect information on how the Service is accessed and used (\"Usage Data\"). This may include information such as your computer's Internet Protocol address (e.g. IP address), browser type, browser version, the pages you visit, the time and date of your visit, the time spent on those pages, and other diagnostic data."
              },
              {
                number: 3,
                title: "Use of Data",
                content: "KaziLinks uses the collected data for various purposes:\n• To provide and maintain the Service\n• To notify you about changes to our Service\n• To allow you to participate in interactive features of our Service when you choose to do so\n• To provide customer care and support\n• To gather analysis or valuable information so that we can improve the Service\n• To monitor the usage of the Service\n• To detect, prevent and address technical issues\n• To provide you with news, special offers and general information about other goods, services and events which we offer that are similar to those that you have already purchased or enquired about unless you have opted not to receive such information"
              },
              {
                number: 4,
                title: "Security of Data",
                content: "The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure or destruction. However, we cannot guarantee the absolute security of your information."
              },
              {
                number: 5,
                title: "Changes to This Privacy Policy",
                content: "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the \"Last Updated\" date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page."
              },
              {
                number: 6,
                title: "Contact Us",
                content: "If you have any questions about this Privacy Policy, please contact us by email at support@kazilinks.com or by mail at:\n\nKaziLinks\nPrivacy Policy Inquiries\nIndia\n\nWe will respond to your inquiry within 30 days of receipt."
              },
              {
                number: 7,
                title: "Your Rights",
                content: "Depending on your location, you may have certain rights regarding your personal data, including:\n• The right to access your personal data\n• The right to correct inaccurate personal data\n• The right to request deletion of your personal data\n• The right to restrict processing of your personal data\n• The right to data portability\n• The right to object to processing of your personal data\n• The right to withdraw consent at any time\n\nTo exercise any of these rights, please contact us using the information provided in the Contact Us section above."
              },
              {
                number: 8,
                title: "Cookies",
                content: "We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service. Our Service may use cookies for the following purposes:\n• To remember your preferences and settings\n• To understand how you use our Service\n• To improve the performance of our Service\n• To provide personalized content and advertisements"
              },
              {
                number: 9,
                title: "Third-Party Links",
                content: "Our Service may contain links to other sites that are not operated by us. If you click on a third party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services."
              },
              {
                number: 10,
                title: "Data Retention",
                content: "KaziLinks will retain your Personal Data only for as long as necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies. In some cases, we may retain Personal Data for longer periods when required by law or for legitimate business purposes."
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
                    <p className="font-paragraph text-secondary-foreground/80 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-16 p-8 bg-logoGold/10 rounded-lg border border-logoGold/20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="font-paragraph text-secondary-foreground/80 mb-6">
              <span className="font-semibold">Important Notice:</span> This Privacy Policy is designed to help you understand our practices regarding the collection and use of your information. If you have any questions or concerns about how we handle your data, please do not hesitate to contact us. Your privacy is important to us, and we are committed to being transparent about our data practices.
            </p>
            <p className="font-paragraph text-secondary-foreground/70 text-sm">
              By using KaziLinks, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem] text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-4xl lg:text-6xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="font-paragraph text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied clients who have found their perfect freelancer match through KaziLinks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-logoGold text-logoBlack hover:bg-logoGold/90 text-lg px-8 py-6"
              >
                <Link to="/services">
                  Start Browsing Services <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8 py-6"
              >
                <Link to="/booking">
                  Book Now
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
