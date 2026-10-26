import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  User,
  X,
  Trash2,
  Shield,
  Briefcase,
  UserCheck,
  Sparkles,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  roleTarget?: string;
}

const ROLE_CONFIGS = {
  ADMIN: {
    title: 'Executive AI Assistant',
    badgeLabel: 'Admin Mode',
    badgeVariant: 'primary' as const,
    icon: Shield,
    initialGreeting:
      'Assalam-o-Alaikum, System Administrator!\n\nMain aapka Executive HCM Assistant hoon. Aap payroll locking, audit compliance, hierarchy configuration, aur system-wide tax rules ke mutaliq sawalat pooch sakte hain.',
    quickQuestions: [
      'Payroll runs finalize aur lock kaise hoti hain?',
      'Audit logs monitor karne ka procedure?',
      '5-Tier income tax slabs calculation?',
      'Org hierarchy aur timings configure karna?',
    ],
  },
  HR: {
    title: 'Operations AI Assistant',
    badgeLabel: 'HR Mode',
    badgeVariant: 'success' as const,
    icon: Briefcase,
    initialGreeting:
      'Assalam-o-Alaikum, HR Operations Manager!\n\nMain aapka Operations Assistant hoon. Daily attendance tracking, 15-min grace period (09:15 AM), leave approvals, aur draft payroll checks mein madad kar sakta hoon.',
    quickQuestions: [
      'Attendance grace period aur late deduction policy?',
      'Leave requests review aur approve karne ka workflow?',
      'Naye employee onboarding par default salary structure?',
      'Individual payslip generate kaise karein?',
    ],
  },
  EMPLOYEE: {
    title: 'Saylani AI Assistant',
    badgeLabel: 'Self-Service',
    badgeVariant: 'secondary' as const,
    icon: UserCheck,
    initialGreeting:
      'Assalam-o-Alaikum!\n\nMain aapka Employee Assistant hoon. Aap mujh se office timings, check-in grace period, apna monthly payslip, ya leave quotas ke baray mein sawalat pooch sakte hain!',
    quickQuestions: [
      'Meri office timing aur 15-min grace period kia hai?',
      'Mera salary payslip aur deductions formula?',
      'Casual aur Sick leave ka annual quota kitna hai?',
      '5 ghantay se kam kaam karein to half-day kyu lagta hai?',
    ],
  },
};

export const FloatingAiWidget: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const currentRole = (role === 'ADMIN' || role === 'HR' || role === 'EMPLOYEE') ? role : 'EMPLOYEE';
  const roleConfig = ROLE_CONFIGS[currentRole];
  const storageKey = `saylani_hcm_chat_${currentRole}`;

  // Role-separated conversation history
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: '1',
        sender: 'bot',
        text: roleConfig.initialGreeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roleTarget: currentRole,
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Switch chat stream when role changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`saylani_hcm_chat_${currentRole}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {}

    setMessages([
      {
        id: '1',
        sender: 'bot',
        text: roleConfig.initialGreeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roleTarget: currentRole,
      },
    ]);
  }, [currentRole, roleConfig.initialGreeting]);

  // Persist messages per role
  useEffect(() => {
    try {
      localStorage.setItem(`saylani_hcm_chat_${currentRole}`, JSON.stringify(messages));
    } catch {}
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, currentRole, isOpen]);

  // Clear chat
  const handleClearChat = () => {
    const initial: ChatMessage[] = [
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: roleConfig.initialGreeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roleTarget: currentRole,
      },
    ];
    setMessages(initial);
    try {
      localStorage.setItem(`saylani_hcm_chat_${currentRole}`, JSON.stringify(initial));
    } catch {}
  };

  const handleSend = (userText?: string) => {
    const question = (userText || input).trim();
    if (!question) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: question,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      roleTarget: currentRole,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userText) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let botAnswer = '';
      const q = question.toLowerCase();

      // ROLE-SPECIFIC RESPONSES
      if (currentRole === 'ADMIN') {
        if (q.includes('finaliz') || q.includes('lock') || q.includes('run')) {
          botAnswer =
            '🔒 Admin Payroll Finalization:\n• Payroll draft finalize karne ka authority sirf System ADMIN ke paas hai.\n• Finalize karne par us period ke tamam payslips immutable ho jate hain aur unka status "FINALIZED" ho jata hai, jise employee foran apne portal par download kar sakta hai.';
        } else if (q.includes('audit') || q.includes('log') || q.includes('security')) {
          botAnswer =
            '🛡️ System Audit Trail:\n• Har sensitive administrative action (Create, Update, Finalize) automatically immutable Audit Logs mein record hota hai, including User ID, Role, IP Address aur Timestamp.';
        } else if (q.includes('tax') || q.includes('slab')) {
          botAnswer =
            '📊 5-Tier Annual Tax Slabs:\n• Tier 1 (Upto 600K): 0%\n• Tier 2 (600K - 1.2M): 5%\n• Tier 3 (1.2M - 2.2M): Rs. 30K + 15%\n• Tier 4 (2.2M - 3.2M): Rs. 180K + 25%\n• Tier 5 (> 3.2M): Rs. 430K + 35%\nMonthly tax liability automatically is slab ke mutabiq deduct hoti hai.';
        } else {
          botAnswer =
            `Admin Assistant: Aapke sawal "${question}" ke mutabiq, aap "Payroll", "Audit Logs", ya "Settings" menu se governance actions complete kar sakte hain.`;
        }
      } else if (currentRole === 'HR') {
        if (q.includes('time') || q.includes('timing') || q.includes('grace') || q.includes('late')) {
          botAnswer =
            '⏰ Attendance Policy:\n• Office Start: 09:00 AM\n• Grace Period: 15 Minutes (09:15 AM tak check-in "Present" hota hai).\n• 09:16 AM ke baad system authoritatively "LATE" flag karta hai.';
        } else if (q.includes('leave') || q.includes('approve') || q.includes('quota')) {
          botAnswer =
            '📋 Leave Policy:\n• Casual: 10 days | Sick: 8 days | Annual: 14 days\n• "Leave Requests" section se pending requests ko review karke Approve ya Reject karein. Weekends aur public holidays duration se automatically exclude hoti hain.';
        } else if (q.includes('individual') || q.includes('payslip') || q.includes('draft')) {
          botAnswer =
            '💵 Individual Payslips:\n• "Payroll" page par "Generate Individual Slip" button click karein, kisi bhi employee ko select karke unka instant verified payslip calculate kar sakte hain.';
        } else {
          botAnswer =
            `HR Assistant: Aapke sawal "${question}" ke mutabiq, HR Operations portal se daily attendance, leave approvals aur staff payslips easily manage kiye ja sakte hain.`;
        }
      } else {
        // Employee
        if (q.includes('time') || q.includes('timing') || q.includes('grace') || q.includes('late')) {
          botAnswer =
            '⏰ Aapki Timings:\n• Start Time: 09:00 AM | End Time: 06:00 PM\n• 15-Minute Grace Period: 09:15 AM tak punch-in normal Present mark hota hai. 09:15 AM ke baad Late count hota hai.';
        } else if (q.includes('payslip') || q.includes('salary') || q.includes('pdf')) {
          botAnswer =
            '📑 Aapka Payslip:\n• Aap "My Payslips" page par ja kar kisi bhi month ka verified salary advice dekh sakte hain aur "Download PDF" click karke official slip save kar sakte hain.';
        } else if (q.includes('leave') || q.includes('quota')) {
          botAnswer =
            '🌴 Leave Quota:\n• Casual Leave: 10 paid days\n• Sick Leave: 8 paid days\n• Annual Leave: 14 paid days\n• "Leaves" menu se "Apply for Leave" par click karke chutti apply karein.';
        } else if (q.includes('5') || q.includes('half')) {
          botAnswer =
            '⏱️ Half-Day Rule:\n• Agar aapka daily working duration 5 hours se kam hoga to system automatically us din ko Half-Day mark karega.';
        } else {
          botAnswer =
            `Employee Assistant: Aap apne Dashboard se daily check-in/out karein aur "My Payslips" se apni verified salary slips download karein!`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botAnswer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          roleTarget: currentRole,
        },
      ]);
      setIsTyping(false);
    }, 400);
  };

  if (!isAuthenticated) return null;

  const RoleIcon = roleConfig.icon;

  return (
    <>
      {/* Floating Chat Window (Bottom Right) */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-7rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 font-sans">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#4338CA] to-[#3730A3] p-3.5 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center font-bold text-white border border-white/20">
                <RoleIcon className="w-4 h-4 text-indigo-100" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-tight leading-none">
                    {roleConfig.title}
                  </h3>
                  <span className="text-[10px] bg-white/20 text-white font-semibold px-1.5 py-0.2 rounded-full">
                    {roleConfig.badgeLabel}
                  </span>
                </div>
                <p className="text-[10px] text-indigo-200 mt-0.5">Saylani HCM Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Clear History"
                className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize Assistant"
                className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-line text-[11px] ${
                    m.sender === 'user'
                      ? 'bg-[#4338CA] text-white rounded-tr-none shadow-xs font-medium'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  {m.text}
                  <span
                    className={`text-[9px] block text-right mt-1 font-mono ${
                      m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>

                {m.sender === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400 pl-8">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                <span className="font-medium">AI is typing...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Quick Question Pills */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
            {roleConfig.quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-[10px] bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-full shrink-0 transition-all font-medium active:scale-95 shadow-2xs cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Text Input */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] bg-slate-50/60"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button size="sm" variant="primary" onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Trigger Button (Bottom Right Circle) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-[#4338CA] to-[#6366F1] text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 group cursor-pointer border-2 border-white"
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform group-hover:rotate-90 duration-200" />
        ) : (
          <div className="relative flex items-center justify-center">
            {/* Pulsing indicator ring */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white" />
            </span>
            <Bot className="w-7 h-7" />
          </div>
        )}

        {/* Hover Tooltip (when closed) */}
        {!isOpen && (
          <span className="absolute right-16 bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            Saylani AI Assistant
          </span>
        )}
      </button>
    </>
  );
};
