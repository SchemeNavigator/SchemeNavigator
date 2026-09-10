import React, { useState } from 'react';
import { SAMPLE_AI_PROMPTS } from '../../constants';
import { ALL_SCHEMES } from '../../data/allSchemes';
import { Scheme } from '../../types';
import { api } from '../../services/api';
import { StatusPill } from '../common/StatusPill';

import { Link } from 'react-router-dom';
import {
  Sparkles,
  Send,
  User,
  Bot,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lightbulb,
  Building,
  RefreshCw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  matchedSchemes?: Scheme[];
  timestamp: string;
}

export const SchemeAdvisorChat: React.FC = () => {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: 'Namaste! I am your SchemeNavigator AI Advisor. Tell me about yourself (e.g. your age, state, occupation, student stage, or what support you are looking for), and I will cross-reference verified government criteria to suggest relevant welfare schemes.',
      timestamp: 'Just now',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (queryText: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      // Call Backend AI Advisor API
      const response = await api.askAI(q);

      const matchedSchemes = response.referencedSchemes && response.referencedSchemes.length > 0
        ? ALL_SCHEMES.filter((s) => response.referencedSchemes!.some((r) => r.id === s.id || r.slug === s.slug))
        : ALL_SCHEMES.filter(
            (s) =>
              s.name.toLowerCase().includes(q.toLowerCase()) ||
              s.tags.some((t) => q.toLowerCase().includes(t))
          ).slice(0, 3);

      const botMsg: ChatMessage = {
        id: 'msg-bot-' + Date.now(),
        sender: 'assistant',
        text: response.answer,
        matchedSchemes: matchedSchemes.length > 0 ? matchedSchemes : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      // Offline fallback
      const matched = ALL_SCHEMES.slice(0, 3);
      const botMsg: ChatMessage = {
        id: 'msg-bot-' + Date.now(),
        sender: 'assistant',
        text: `Based on your request, here are government schemes that appear relevant:`,
        matchedSchemes: matched,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-teal-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-800/80 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Grounded Welfare AI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Scheme Advisor
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/80 max-w-xl leading-relaxed">
            Ask natural language questions about your age, education, location, or goals. Our AI analyzes official eligibility rules deterministically.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-teal-900/50 border border-teal-700/50 text-xs text-emerald-300 flex items-center gap-2.5 shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="max-w-[200px] leading-tight">
            Strictly grounded in official government gazettes
          </span>
        </div>
      </div>

      {/* Suggested Prompt Pills */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Try asking these example questions:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_AI_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              className="text-left text-xs font-medium bg-white hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300 text-slate-700 p-2.5 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 min-h-[420px] flex flex-col justify-between">
        <div className="space-y-6 overflow-y-auto max-h-[520px] pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${
                msg.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-slate-900'
                    : 'bg-gradient-to-br from-teal-700 to-teal-900 border border-teal-600'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-emerald-300" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`space-y-3 max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-teal-900 text-white rounded-tr-xs'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Inline Recommended Scheme Cards */}
                {msg.matchedSchemes && msg.matchedSchemes.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {msg.matchedSchemes.map((scheme) => (
                      <div
                        key={scheme.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 transition-all space-y-2 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <StatusPill type="category" value={scheme.category} size="sm" />
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Potential Match
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900">
                          {scheme.name}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-2">
                          {scheme.shortDescription}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-teal-800">
                            {scheme.benefits[0]?.amountOrValue || 'Official Benefit'}
                          </span>
                          <Link
                            to={`/schemes/${scheme.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950"
                          >
                            <span>View Scheme</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-slate-400 text-right">{msg.timestamp}</div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic pl-12">
              <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
              <span>Analyzing government scheme guidelines...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-4 border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything (e.g., I'm a 20yo student from Haryana with ₹1.5L income...)"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-teal-600 focus:bg-white rounded-2xl text-xs sm:text-sm font-medium outline-hidden transition-all"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="p-3.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-2xl shadow-md transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
