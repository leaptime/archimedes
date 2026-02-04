import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardHeader } from "@/components/DashboardHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Package,
  Settings2,
  Loader2
} from "lucide-react";
import { mockModules } from "@/data/modules";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  suggestions?: string[];
  upgradePath?: UpgradePath;
  isTyping?: boolean;
}

interface UpgradePath {
  name: string;
  features: string[];
  price: number;
  recommended?: boolean;
}

const Wizard = () => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [upgradeDelivered, setUpgradeDelivered] = useState(false);

  const installedModules = mockModules.filter(m => m.status === "installed");

  const startConversation = (moduleId: string) => {
    setSelectedModule(moduleId);
    const module = mockModules.find(m => m.id === moduleId);
    
    setMessages([
      {
        id: "1",
        type: "ai",
        content: `Hi! I see you want to customize **${module?.name}**. What specific functionality would you like to add or modify? Here are some popular customization requests:`,
        suggestions: [
          "Add custom reporting dashboard",
          "Integrate with external API",
          "Add multi-language support",
          "Custom workflow automation"
        ]
      }
    ]);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: text
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock AI response based on conversation stage
    const responseIndex = messages.filter(m => m.type === "ai").length;
    
    let aiResponse: Message;

    if (responseIndex === 1) {
      // First AI response - ask clarifying questions
      aiResponse = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `Great choice! To implement **${text.toLowerCase()}**, I need a few clarifications:\n\n1. **Scope**: Should this apply to all users or specific roles?\n2. **Data sources**: Do you need to connect to existing data or create new data structures?\n3. **Priority**: Is this urgent or can we schedule it for the next release cycle?`,
        suggestions: [
          "All users, use existing data, urgent",
          "Admin only, new data structure, can wait",
          "Let me describe in detail..."
        ]
      };
    } else if (responseIndex === 2) {
      // Second AI response - suggest upgrade path
      aiResponse = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `Based on your requirements, I've analyzed the best upgrade paths. Here's my recommendation:`,
        upgradePath: {
          name: "Pro Enhancement Package",
          features: [
            "Custom reporting dashboard with drag-and-drop widgets",
            "Real-time data synchronization",
            "Role-based access controls",
            "API webhook integrations",
            "Priority support channel"
          ],
          price: 49,
          recommended: true
        },
        suggestions: [
          "Proceed with this upgrade",
          "Show alternative options",
          "I need something different"
        ]
      };
    } else {
      // Final response - deliver upgrade
      aiResponse = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `🎉 **Upgrade Successfully Deployed!**\n\nYour customization has been applied to the module. Here's what's been configured:\n\n✅ Custom dashboard widgets installed\n✅ Data connections established\n✅ Role permissions configured\n✅ API endpoints activated\n\nYou can access your new features from the module settings. Would you like me to walk you through the new functionality?`,
        suggestions: [
          "Show me the new features",
          "Configure more options",
          "Start another customization"
        ]
      };
      setUpgradeDelivered(true);
    }

    setMessages(prev => [...prev, aiResponse]);
    setIsProcessing(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const resetWizard = () => {
    setSelectedModule(null);
    setMessages([]);
    setInput("");
    setUpgradeDelivered(false);
  };

  return (
    <DashboardLayout>
      <DashboardHeader 
        title="Customization Wizard" 
        subtitle="AI-powered module customization and upgrades"
      />
      
      <div className="p-6 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!selectedModule ? (
            <motion.div
              key="module-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Hero Section */}
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4"
                >
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  AI Customization Wizard
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Tell our AI what you need, and we'll suggest the best upgrade path 
                  and deliver customizations tailored to your workflow.
                </p>
              </div>

              {/* Module Selection */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Select a module to customize
                </h3>
                
                <div className="grid gap-3">
                  {installedModules.map((module, index) => (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                        onClick={() => startConversation(module.id)}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold text-lg">
                                {module.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{module.name}</h4>
                              <p className="text-sm text-muted-foreground">v{module.version}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                              Installed
                            </Badge>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="conversation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Conversation Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Settings2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Customizing: {mockModules.find(m => m.id === selectedModule)?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">AI-assisted configuration</p>
                  </div>
                </div>
                <Button variant="outline" onClick={resetWizard}>
                  Start Over
                </Button>
              </div>

              {/* Messages */}
              <Card className="min-h-[400px] max-h-[500px] overflow-y-auto">
                <CardContent className="p-4 space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex gap-3 ${message.type === "user" ? "justify-end" : ""}`}
                    >
                      {message.type === "ai" && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      
                      <div className={`max-w-[80%] ${message.type === "user" ? "order-first" : ""}`}>
                        <div className={`rounded-2xl px-4 py-3 ${
                          message.type === "user" 
                            ? "bg-primary text-primary-foreground ml-auto" 
                            : "bg-muted"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        
                        {/* Upgrade Path Card */}
                        {message.upgradePath && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-3"
                          >
                            <Card className="border-primary/30 bg-primary/5">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-primary" />
                                    <span className="font-semibold text-foreground">
                                      {message.upgradePath.name}
                                    </span>
                                  </div>
                                  {message.upgradePath.recommended && (
                                    <Badge className="bg-primary text-primary-foreground">
                                      Recommended
                                    </Badge>
                                  )}
                                </div>
                                <ul className="space-y-2 mb-4">
                                  {message.upgradePath.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                  <span className="text-2xl font-bold text-foreground">
                                    ${message.upgradePath.price}
                                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                        
                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {message.suggestions.map((suggestion, i) => (
                              <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleSuggestionClick(suggestion)}
                                disabled={isProcessing}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {message.type === "user" && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-secondary-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">AI is thinking...</span>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Input */}
              <div className="flex gap-3">
                <Textarea
                  placeholder="Describe what you'd like to customize..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(input);
                    }
                  }}
                  className="min-h-[50px] max-h-[120px] resize-none"
                  disabled={isProcessing}
                />
                <Button 
                  onClick={() => handleSendMessage(input)}
                  disabled={!input.trim() || isProcessing}
                  className="px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Success State */}
              {upgradeDelivered && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Card className="border-success/30 bg-success/5">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">Upgrade Complete!</h4>
                        <p className="text-sm text-muted-foreground">
                          Your customization has been successfully applied.
                        </p>
                      </div>
                      <Button variant="outline" onClick={resetWizard}>
                        Customize Another Module
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default Wizard;
