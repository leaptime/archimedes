import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardHeader } from "@/components/DashboardHeader";
import { HelpChatbot } from "@/components/HelpChatbot";
import { motion } from "framer-motion";
import { 
  Search, Book, MessageCircle, Mail, FileText, 
  ExternalLink, ChevronRight, HelpCircle, Zap,
  Users, Shield, CreditCard, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const categories = [
  { icon: Zap, title: "Getting Started", articles: 12, color: "text-primary bg-primary/10" },
  { icon: Settings, title: "Module Setup", articles: 24, color: "text-warning bg-warning/10" },
  { icon: Users, title: "Team Management", articles: 8, color: "text-module-third-party bg-module-third-party/10" },
  { icon: Shield, title: "Security", articles: 15, color: "text-success bg-success/10" },
  { icon: CreditCard, title: "Billing & Plans", articles: 10, color: "text-accent-foreground bg-accent" },
  { icon: FileText, title: "API Documentation", articles: 32, color: "text-destructive bg-destructive/10" },
];

const faqs = [
  {
    question: "How do I install a new module?",
    answer: "Navigate to the Marketplace, find the module you want, and click the 'Install' button. The module will be added to your account and you can configure it from the 'My Modules' page."
  },
  {
    question: "Can I use modules from third-party developers?",
    answer: "Yes! The Last Software marketplace includes both official modules and third-party modules from verified developers. Third-party modules are clearly labeled and go through our security review process."
  },
  {
    question: "How do I invite team members?",
    answer: "Go to the Team page and click 'Invite Member'. Enter their email address and select their role. They'll receive an invitation email to join your workspace."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) and support invoicing for Business and Enterprise plans."
  },
  {
    question: "How do I cancel a module subscription?",
    answer: "Go to 'My Modules', find the module you want to cancel, click the power icon to disable it. You can fully uninstall from the module settings. You won't be charged after the current billing period."
  },
];

const Help = () => {
  return (
    <DashboardLayout>
      <DashboardHeader 
        title="Help & Support" 
        subtitle="Find answers and get help"
      />
      <div className="p-6 space-y-8">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/10 via-accent to-primary/5 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">How can we help you?</h2>
          <p className="text-muted-foreground mb-6">Search our knowledge base or browse categories below</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search for help articles..." 
              className="pl-12 h-12 text-base bg-card border-border"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">Browse by Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => (
              <motion.button
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all text-left group"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", category.color)}>
                  <category.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {category.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{category.articles} articles</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h3 className="font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border p-6 text-center hover:border-primary/30 hover:shadow-md transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Book className="w-7 h-7 text-primary" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Documentation</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Explore our comprehensive guides and API docs
            </p>
            <Button variant="outline" className="gap-2">
              View Docs <ExternalLink className="w-4 h-4" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl border border-border p-6 text-center hover:border-primary/30 hover:shadow-md transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-warning" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Live Chat</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Chat with our support team in real-time
            </p>
            <Button className="gap-2">
              Start Chat
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card rounded-xl border border-border p-6 text-center hover:border-primary/30 hover:shadow-md transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-module-third-party/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-module-third-party" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">Email Support</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Get help via email within 24 hours
            </p>
            <Button variant="outline" className="gap-2">
              Send Email
            </Button>
          </motion.div>
        </div>

        {/* Chatbot */}
        <HelpChatbot />
      </div>
    </DashboardLayout>
  );
};

export default Help;
