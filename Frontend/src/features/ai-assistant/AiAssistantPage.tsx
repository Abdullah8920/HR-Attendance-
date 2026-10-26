import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, MessageSquare, Trash2, Shield, UserCheck, Briefcase } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  roleTarget?: string;
}

const ROLE_CONFIGS = {
  ADMIN: {
    title: 'Admin Governance & Executive Assistant',
    subtitle: 'System-wide policy enforcement, payroll finalization, compliance auditing, and organizational hierarchy',
    icon: Shield,
    badgeLabel: 'Admin Governance Mode',
    badgeVariant: 'primary' as const,
    initialGreeting:
      'Assalam-o-Alaikum, System Administrator!\n\nMain aapka Executive HCM AI Assistant hoon. Aapke paas full administrative authority hai:\n• Batch & Individual payroll finalization aur calculation locking\n• System audit logs, IP tracking aur security compliance records\n• Organization hierarchy (Departments, Designations & Working Days)\n• Company-wide leave quotas aur policy override permissions\n\nAap administrative operations ya governance rules ke mutaliq sawalat pooch sakte hain.',
    quickQuestions: [
      'Payroll runs finalization aur locking rule kia hai?',
      'Audit logs aur security compliance monitor karne ka workflow?',
      'Departments aur designations configure karne ke rules?',
      '5-Tier annual income tax slabs formula kia hai?',
    ],
  },
  HR: {
    title: 'HR Operations & People Management Assistant',
    subtitle: 'Staff onboarding, daily attendance monitoring, leave approvals, and monthly draft calculations',
    icon: Briefcase,
    badgeLabel: 'HR Operations Mode',
    badgeVariant: 'success' as const,
    initialGreeting:
      'Assalam-o-Alaikum, HR Operations Manager!\n\nMain aapka People & Operations AI Assistant hoon. Main daily HR workflows mein aapki madad karta hoon:\n• Daily attendance tracking, 15-min grace period (09:15 AM cut-off) aur Late flags\n• Leave requests review, approve/reject workflow aur auto weekend exclusions\n• Monthly draft payroll runs aur unexcused absence deduction verification\n• New employee registration, temporary credentials aur salary assignment\n\nAap operational tasks ya staff policy procedures ke mutaliq sawal pooch sakte hain.',
    quickQuestions: [
      'Office timing (09:00 AM) aur late mark karne ka rule?',
      'Leave requests review aur approve karne ka standard process?',
      'Batch payroll draft generate karne aur deductions check karna?',
      'Naye employee onboarding par default salary structure kia hai?',
    ],
  },
  EMPLOYEE: {
    title: 'Employee Self-Service & Benefits Assistant',
    subtitle: 'Personal attendance records, monthly payslip explanations, leave balance checks, and office timings',
    icon: UserCheck,
    badgeLabel: 'Employee Self-Service Mode',
    badgeVariant: 'secondary' as const,
    initialGreeting:
      'Assalam-o-Alaikum!\n\nMain aapka Saylani Employee Self-Service Assistant hoon. Aap apne personal portal aur entitlements ke mutaliq sawalat pooch sakte hain:\n• Office start time (09:00 AM), 15-minute grace period (09:15 AM) aur checkout\n• Apna monthly payslip dekhna, tax calculation aur transparent deductions\n• Leaves ka quota (Casual 10, Sick 8, Annual 14) aur chutti apply karna\n• 5 ghantay se kam kaam karne par automatic half-day rule ki wazahat\n\nAap apni attendance, salary, ya company rules ke mutaliq sawal pooch sakte hain!',
    quickQuestions: [
      'Meri office timing aur 15-min grace period kia hai?',
      'Mera salary payslip aur deduction formula kaise kaam karta hai?',
      'Leaves ka annual quota kitna milta hai?',
      '5 ghantay se kam kaam karein to half-day kyu lagta hai?',
    ],
  },
};

export const AiAssistantPage: React.FC = () => {
  const { role } = useAuth();
  const currentRole = (role === 'ADMIN' || role === 'HR' || role === 'EMPLOYEE') ? role : 'EMPLOYEE';
  const roleConfig = ROLE_CONFIGS[currentRole];

  const storageKey = `saylani_hcm_chat_${currentRole}`;

  // Initialize separate chat messages per role from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
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

  // When role changes, switch to that role's distinct chat history
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
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, currentRole]);

  // Clear chat for this specific role
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

      // ROLE-SPECIFIC INTELLIGENCE ENGINE
      if (currentRole === 'ADMIN') {
        if (q.includes('finaliz') || q.includes('lock') || q.includes('run') || q.includes('batch')) {
          botAnswer =
            '🔒 Admin Payroll Finalization Rule:\n• Payroll draft finalize karne ka authority sirf System ADMIN ke paas hota hai.\n• Finalize karne par us period ke tamam payslips immutable ho jate hain aur unka status "FINALIZED" ho jata hai.\n• Finalized hotay hi har employee ko apne portal par apna personal payslip aur verified PDF download button visible ho jata hai.';
        } else if (q.includes('audit') || q.includes('log') || q.includes('security') || q.includes('ip') || q.includes('track')) {
          botAnswer =
            '🛡️ System Audit Trail & Compliance:\n• Saylani HCM mein har sensitive action (Employee Creation, Payroll Run, Status Modification, Password changes) automatically Audit Log table mein record hota hai.\n• Records include: Actor User ID, Role, IP Address, User Agent, Resource ID, aur Action Timestamp.\n• Aap "Audit Logs" menu se tamam immutable compliance logs filter aur review kar sakte hain.';
        } else if (q.includes('department') || q.includes('designation') || q.includes('org') || q.includes('hierarchy') || q.includes('company')) {
          botAnswer =
            '🏢 Organization Hierarchy & Setup:\n• Admin settings se aap Departments (e.g. IT, Accounts, Operations) aur Designations (e.g. Senior Software Engineer) manage kar sakte hain.\n• Company timing: Standard 09:00 AM to 06:00 PM, 15-minute grace period.\n• Weekend days (Saturday & Sunday) configure karne se attendance deductions aur payroll calculations automatically sync rehti hain.';
        } else if (q.includes('tax') || q.includes('slab') || q.includes('formula') || q.includes('rate')) {
          botAnswer =
            '📊 5-Tier Annual Income Tax Slabs:\n• Tier 1: Upto Rs. 600,000 / year → 0% Tax\n• Tier 2: Rs. 600,001 - 1,200,000 → 5% of amount exceeding Rs. 600,000\n• Tier 3: Rs. 1,200,001 - 2,200,000 → Rs. 30,000 + 15% of excess over 1.2M\n• Tier 4: Rs. 2,200,001 - 3,200,000 → Rs. 180,000 + 25% of excess over 2.2M\n• Tier 5: Above Rs. 3,200,000 → Rs. 430,000 + 35% of excess over 3.2M\nMonthly tax withholding automatically is annual liability ko 12 par divide karke salary se withhold karti hai.';
        } else {
          botAnswer =
            `Admin Assistant Response:\nAapke sawal "${question}" ke mutabiq: System Administrator ke tor par aapke paas complete audit logs, employee provisioning, tax slabs aur payroll locking ki full governance access hai. Mazeed specific details ke liye "Payroll", "Audit Logs", ya "Settings" tabs visit karein.`;
        }
      } else if (currentRole === 'HR') {
        if (q.includes('time') || q.includes('timing') || q.includes('grace') || q.includes('late') || q.includes('start')) {
          botAnswer =
            '⏰ HR Attendance Policy & Grace Period:\n• Office Start Time: 09:00 AM\n• Grace Period: 15 Minutes (09:15 AM tak check-in "PRESENT" mark hota hai).\n• 09:16 AM ke baad check-in system authoritatively "LATE" mark karta hai.\n• Agar employee 5 ghantay se kam kaam kare to automated system us din ko "HALF_DAY" flag karta hai.';
        } else if (q.includes('leave') || q.includes('approve') || q.includes('reject') || q.includes('quota') || q.includes('chutti')) {
          botAnswer =
            '📋 Leave Management & Approval Procedures:\n• Casual Leaves: 10 paid days / year\n• Sick Leaves: 8 paid days / year\n• Annual Leaves: 14 paid days / year\n• Unpaid Leaves: Unlimited (payroll par transparent daily deduction hoti hai).\n• HR Approval: "Leave Requests" section mein ja kar aap Pending requests ko Approve ya Reject kar sakte hain. System weekends aur gazetted holidays ko duration se automatically exclude kar deta hai.';
        } else if (q.includes('payroll') || q.includes('draft') || q.includes('deduct') || q.includes('salary') || q.includes('individual')) {
          botAnswer =
            '💵 HR Payroll Operations:\n• HR managers "Generate Batch Draft" se poori company ka provisional payroll calculate kar sakte hain.\n• "Generate Individual Slip" button se kisi aik makhsoos employee ki attendances aur deductions select karke unka individual payslip bana sakte hain.\n• Daily Rate Formula = Gross Salary / Monthly Working Days.\n• Unexcused absences aur half-days par deductions automated calculate hoti hain.';
        } else if (q.includes('onboard') || q.includes('new') || q.includes('register') || q.includes('structure')) {
          botAnswer =
            '👤 Employee Onboarding & Salary Assignment:\n• "Employees" page par "Add Employee" click karein.\n• Form fill karne par system auto temporary password (e.g. Pass@1234) generate karta hai.\n• Default salary structure automatically configure ho jati hai:\n  - HRA: 40% of Basic\n  - Medical: 10% of Basic\n  - Gross: Basic + HRA + Medical (1.5x Basic).';
        } else {
          botAnswer =
            `HR Assistant Response:\nAapke sawal "${question}" ke mutabiq: HR Operations portal se aap daily attendances, leave approvals, employee records, aur individual employee payslips manage kar sakte hain.`;
        }
      } else {
        // EMPLOYEE SELF-SERVICE
        if (q.includes('time') || q.includes('timing') || q.includes('grace') || q.includes('late') || q.includes('start')) {
          botAnswer =
            '⏰ Meri Office Timing & Grace Period:\n• Duty Start Time: 09:00 AM\n• Duty End Time: 06:00 PM\n• 15 Minutes Grace Period: 09:15 AM tak check-in karne par aapki attendance "Present" count hoti hai.\n• 09:15 AM ke baad check-in hone par system "Late" mark karta hai.';
        } else if (q.includes('salary') || q.includes('payslip') || q.includes('tankhwah') || q.includes('deduct') || q.includes('tax') || q.includes('pdf')) {
          botAnswer =
            '📑 Mera Payslip & Salary Breakdown:\n• Basic Salary = Base pay\n• House Rent (HRA) = 40% of Basic\n• Medical Allowance = 10% of Basic\n• Gross Salary = Basic + HRA + Medical (1.5x of Basic)\n• Deductions: Agar aap unexcused absent rahein ya 5 ghantay se kam kaam karein, to daily rate ke hisab se deduction hoti hai.\n• Payslip Download: Aap "Payroll" page par ja kar "View & Download PDF" button dabayein, official verified PDF slip instant download ho jaye gi!';
        } else if (q.includes('leave') || q.includes('quota') || q.includes('chutti') || q.includes('casual') || q.includes('sick')) {
          botAnswer =
            '🌴 Mera Annual Leave Quota:\n• Casual Leave: 10 paid days\n• Sick Leave: 8 paid days\n• Annual Leave: 14 paid days\n• Leave Apply: "Leaves" menu par jayein aur "Apply for Leave" select karein. Approved hone par weekends ke days deduct nahi hote aur salary bhi nahi kat-ti.';
        } else if (q.includes('5') || q.includes('half') || q.includes('ghant') || q.includes('hour')) {
          botAnswer =
            '⏱️ Half-Day Rule ki Wazahat:\n• Agar check-in aur check-out ke darmiyan working duration 5 hours se kam hogi, to system us din ko automatically "HALF_DAY" mark karega aur 0.5 daily rate deduction count hogi.\n• Full day present hone ke liye minimum 5 hours kaam karna zaroori hai.';
        } else {
          botAnswer =
            `Employee Assistant Response:\nAapke sawal "${question}" ke mutabiq: Aap apne Dashboard se daily check-in/out kar sakte hain, "Payroll" page se har mahine ka individual verified payslip download kar sakte hain, aur "Leaves" section se chutti apply kar sakte hain.`;
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
    }, 450);
  };

  const RoleIcon = roleConfig.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-4 font-sans">
      {/* Header with Role Mode Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
            <RoleIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {roleConfig.title}
              </h2>
              <Badge variant={roleConfig.badgeVariant}>{roleConfig.badgeLabel}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{roleConfig.subtitle}</p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleClearChat}
          leftIcon={<Trash2 className="w-3.5 h-3.5 text-slate-400" />}
        >
          Clear History
        </Button>
      </div>

      {/* Main Chat Container */}
      <Card className="h-[520px] flex flex-col justify-between overflow-hidden shadow-card border border-slate-200 bg-white">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'bot' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-100">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-lg rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-[#4338CA] text-white rounded-tr-none shadow-xs font-medium'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80 shadow-2xs'
                }`}
              >
                {m.text}
                <span
                  className={`text-[9px] block text-right mt-1.5 font-mono ${
                    m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </span>
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-10">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <span className="font-medium text-slate-500">AI Assistant is typing response...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Role-Specific Quick Question Pills */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Suggested Questions:</span>
          {roleConfig.quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-700 text-slate-700 px-3 py-1 rounded-full shrink-0 transition-all font-medium active:scale-95 shadow-2xs cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            className="flex-1 text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] bg-slate-50/50"
            placeholder={`Ask a question as ${roleConfig.badgeLabel}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button size="sm" variant="primary" onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
            <Send className="w-3.5 h-3.5 mr-1" /> Send
          </Button>
        </div>
      </Card>
    </div>
  );
};
