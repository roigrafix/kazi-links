import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, X, Minimize2, Maximize2, Phone, Mail, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  message: string;
  timestamp: Date;
}

export default function CustomerServicePage() {
  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'support',
      message: 'Hello! Welcome to our customer support. How can we help you today?',
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    // Simulate support response
    setTimeout(() => {
      const supportMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'support',
        message: 'Thank you for your message. Our support team will respond shortly. For urgent matters, please call 1-800-SUPPORT.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, supportMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-logoBlack to-[#2a2a2a]">
      {/* Header */}
      <section className="py-20 border-b border-logoGold/20">
        <div className="max-w-[100rem] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-6xl font-heading font-bold mb-6 leading-tight text-logoGold">
              Customer Service Center
            </h1>
            <p className="text-2xl font-paragraph max-w-4xl mx-auto leading-relaxed text-secondary/90">
              We're here to help. Get support through multiple channels available 24/7.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-20">
        <div className="max-w-[100rem] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-4xl font-heading font-bold text-center mb-12 text-logoGold leading-tight">
              How Can We Help You?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Live Chat */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-secondary border-logoGold/20 shadow-lg h-full hover:shadow-xl transition-shadow">
                  <CardHeader className="text-center pb-6">
                    <div className="mx-auto mb-4 w-16 h-16 bg-logoGold/15 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-logoGold" />
                    </div>
                    <CardTitle className="text-2xl font-heading font-bold text-logoBlack">
                      Live Chat
                    </CardTitle>
                    <CardDescription className="font-paragraph text-base text-logoBlack/70 mt-2">
                      Chat with our support team in real-time
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <p className="font-paragraph text-logoBlack/80">Available 24/7 for immediate assistance</p>
                    <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-logoGold hover:bg-logoGold/90 text-logoBlack font-semibold">
                          Start Chat
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Phone Support */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-secondary border-logoGold/20 shadow-lg h-full hover:shadow-xl transition-shadow">
                  <CardHeader className="text-center pb-6">
                    <div className="mx-auto mb-4 w-16 h-16 bg-logoGold/15 rounded-full flex items-center justify-center">
                      <Phone className="w-8 h-8 text-logoGold" />
                    </div>
                    <CardTitle className="text-2xl font-heading font-bold text-logoBlack">
                      Phone Support
                    </CardTitle>
                    <CardDescription className="font-paragraph text-base text-logoBlack/70 mt-2">
                      Call our support team directly
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div>
                      <p className="font-paragraph text-lg font-bold text-logoBlack mb-2">1-800-SUPPORT</p>
                      <p className="font-paragraph text-logoBlack/70">Mon-Fri 9AM-6PM EST</p>
                    </div>
                    <Button variant="outline" className="w-full border-logoGold/30 text-logoBlack hover:bg-logoGold/10">
                      Call Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Email Support */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-secondary border-logoGold/20 shadow-lg h-full hover:shadow-xl transition-shadow">
                  <CardHeader className="text-center pb-6">
                    <div className="mx-auto mb-4 w-16 h-16 bg-logoGold/15 rounded-full flex items-center justify-center">
                      <Mail className="w-8 h-8 text-logoGold" />
                    </div>
                    <CardTitle className="text-2xl font-heading font-bold text-logoBlack">
                      Email Support
                    </CardTitle>
                    <CardDescription className="font-paragraph text-base text-logoBlack/70 mt-2">
                      Send us a detailed message
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <p className="font-paragraph text-logoBlack/80">Response within 24 hours</p>
                    <Link to="/support">
                      <Button className="w-full bg-logoGold hover:bg-logoGold/90 text-logoBlack font-semibold">
                        Send Email
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-20"
          >
            <h2 className="text-4xl font-heading font-bold text-center mb-12 text-logoGold leading-tight">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  question: 'How do I track my booking?',
                  answer: 'You can track your booking status in real-time from your dashboard. Visit the Tracking page to see updates on your service.'
                },
                {
                  question: 'What is your refund policy?',
                  answer: 'We offer full refunds for cancellations made 24 hours before the scheduled service. Visit our Refund page for more details.'
                },
                {
                  question: 'How can I contact a freelancer?',
                  answer: 'You can contact your assigned freelancer through the booking details page or by calling our support team.'
                },
                {
                  question: 'What payment methods do you accept?',
                  answer: 'We accept all major credit cards, debit cards, and digital payment methods for your convenience.'
                },
              ].map((faq, index) => (
                <Card key={index} className="bg-secondary border-logoGold/20">
                  <CardHeader>
                    <CardTitle className="text-lg font-heading font-bold text-logoBlack">
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-paragraph text-logoBlack/80">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Chat Widget */}
      {isChatOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-6 right-6 w-96 h-[600px] bg-secondary border-2 border-logoGold rounded-lg shadow-2xl flex flex-col z-50"
        >
          {/* Chat Header */}
          <div className="bg-logoGold text-logoBlack p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-heading font-bold">Live Support</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsChatMinimized(!isChatMinimized)}
                className="hover:bg-logoGold/80 p-1 rounded transition-colors"
              >
                {isChatMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsChatOpen(false)}
                className="hover:bg-logoGold/80 p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          {!isChatMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender === 'user'
                          ? 'bg-logoGold text-logoBlack'
                          : 'bg-logoBlack/20 text-logoBlack border border-logoGold/20'
                      }`}
                    >
                      <p className="font-paragraph text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-logoBlack/20 text-logoBlack border border-logoGold/20 px-4 py-2 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-logoGold rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-logoGold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-logoGold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="border-t border-logoGold/20 p-4 flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message..."
                  className="bg-white text-logoBlack border-logoGold/30 font-paragraph"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-logoGold hover:bg-logoGold/90 text-logoBlack"
                  disabled={isLoading || !chatInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}
        </motion.div>
      )}

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-logoGold hover:bg-logoGold/90 text-logoBlack rounded-full shadow-lg flex items-center justify-center z-40 border-2 border-logoBlack"
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
}
