import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { Menu, X, MapPin, Users, Briefcase, Calendar, Phone, Mail, Instagram, Twitter, Linkedin, MessageCircle } from 'lucide-react';
import { useMember } from '@/integrations';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { member, isAuthenticated } = useMember();

  // Default admin emails - you can modify this list
  const adminEmails = [
    'admin@example.com',
    'admin@freelanceplatform.com',
    'manager@example.com'
  ];

  // Check if user is admin
  const userEmail = member?.loginEmail?.toLowerCase();
  const isAdmin = userEmail && adminEmails.some(email => email.toLowerCase() === userEmail);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Freelancers', href: '/freelancers' },
    { name: 'Book Now', href: '/booking' },
    { name: 'Track Booking', href: '/tracking' },
    // Show refund tracking to authenticated users
    ...(isAuthenticated ? [
      { name: 'Refund Tracking', href: '/refund-tracking' }
    ] : []),
    // Show freelancer dashboard to authenticated users
    ...(isAuthenticated ? [
      { name: 'Freelancer Dashboard', href: '/freelancer-dashboard' }
    ] : []),
    // Only show admin links to admin users
    ...(isAdmin ? [
      { name: 'Admin Dashboard', href: '/admin' },
      { name: 'Manage Refunds', href: '/admin-refunds' },
      { name: 'Manage Support', href: '/admin-support' },
      { name: 'Availability', href: '/freelancer-availability' }
    ] : []),
    { name: 'Login', href: '/login' }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b border-primary-foreground/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <Image
                src="https://static.wixstatic.com/media/d6d795_240b4c7ea1dc48b4a2b100e99044aa72~mv2.png"
                alt="KaziLinks Logo"
                width={40}
                className="w-10 h-10"
              />
              <span className="font-heading text-2xl font-bold">KaziLinks</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`font-paragraph text-sm font-medium transition-colors hover:text-logoGold ${
                    isActive(item.href) ? 'text-logoGold' : 'text-primary-foreground/80'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* CTA Button - Desktop */}
            <div className="hidden lg:block">
              <Button 
                asChild 
                className="bg-logoGold text-logoBlack hover:bg-logoGold/90"
              >
                <Link to="/booking">
                  Get Started
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-primary border-t border-primary-foreground/10"
            >
              <div className="container mx-auto px-6 py-4">
                <nav className="flex flex-col space-y-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`font-paragraph text-sm font-medium transition-colors hover:text-logoGold ${
                        isActive(item.href) ? 'text-logoGold' : 'text-primary-foreground/80'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Button 
                    asChild 
                    className="bg-logoGold text-logoBlack hover:bg-logoGold/90 w-full mt-4"
                  >
                    <Link to="/booking" onClick={() => setIsMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      {/* Main Content */}
      <main>
        <Outlet />
      </main>
      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-6 lg:px-12 max-w-[100rem]">
          {/* Main Footer Content */}
          <div className="py-16">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Company Info */}
              <div className="lg:col-span-1">
                <Link to="/" className="flex items-center gap-3 mb-4">
                  <Image
                    src="https://static.wixstatic.com/media/d6d795_240b4c7ea1dc48b4a2b100e99044aa72~mv2.png"
                    alt="KaziLinks Logo"
                    width={40}
                    className="w-10 h-10"
                  />
                  <span className="font-heading text-2xl font-bold">KaziLinks</span>
                </Link>
                <p className="font-paragraph text-secondary-foreground/70 mb-6">
                  Connecting talented freelancers with clients who need exceptional services. 
                  Your trusted platform for professional collaborations.
                </p>
                <div className="flex items-center gap-4">
                  <a 
                    href="https://www.instagram.com/kazi_links?igsh=MWh2NWVucmwxbTM4Yw==" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-logoGold rounded-full flex items-center justify-center hover:bg-logoGold/80 transition-colors"
                  >
                    <Instagram className="h-5 w-5 text-logoBlack" />
                  </a>
                  <a 
                    href="https://twitter.com/kazilinks" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-electricblue rounded-full flex items-center justify-center hover:bg-electricblue/80 transition-colors"
                  >
                    <Twitter className="h-5 w-5 text-white" />
                  </a>
                  <a 
                    href="https://linkedin.com/company/kazilinks" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-logoCream rounded-full flex items-center justify-center hover:bg-logoCream/80 transition-colors"
                  >
                    <Linkedin className="h-5 w-5 text-logoBlack" />
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-heading text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-3">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="font-paragraph text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Services */}
              <div>
                <h3 className="font-heading text-lg font-semibold mb-4">Popular Services</h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/services?category=Programming"
                      className="font-paragraph text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                    >
                      Programming
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/services?category=Photography"
                      className="font-paragraph text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                    >
                      Photography
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/services?category=Hair Styling"
                      className="font-paragraph text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                    >
                      Hair Styling
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/services?category=Makeup"
                      className="font-paragraph text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                    >
                      Makeup
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/services?category=Catering"
                      className="font-paragraph text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                    >
                      Catering
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-heading text-lg font-semibold mb-4">Contact Us</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-secondary-foreground/50" />
                    <span className="font-paragraph text-secondary-foreground/70">
                      hello@kazilinks.com
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-secondary-foreground/50" />
                    <span className="font-paragraph text-secondary-foreground/70">{"+91 966-395-2491"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-secondary-foreground/50" />
                    <span className="font-paragraph text-secondary-foreground/70">{"Bengaluru, IND"}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button 
                    asChild 
                    className="bg-logoGold text-logoBlack hover:bg-logoGold/90"
                  >
                    <Link to="/booking">
                      <Calendar className="mr-2 h-4 w-4" />
                      Book a Service
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="py-6 border-t border-secondary-foreground/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="font-paragraph text-sm text-secondary-foreground/70">{"© 2025 KaziLinks. All rights reserved."}</p>
              <div className="flex items-center gap-6">
                <Link
                  to="/privacy"
                  className="font-paragraph text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="font-paragraph text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/support"
                  className="font-paragraph text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
                >
                  Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}