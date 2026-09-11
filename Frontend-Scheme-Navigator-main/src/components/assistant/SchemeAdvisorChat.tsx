import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Scheme } from '../../types';
import { api } from '../../services/api';
import { getSavedProfile } from '../../services/storageService';
import { StatusPill } from '../common/StatusPill';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '../../store/appStore';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { translateSchemeContent } from '../../utils/schemeTranslator';
import {
  Sparkles,
  Send,
  User,
  Bot,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Compass,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  UserCheck,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  matchedSchemes?: Scheme[];
  timestamp: string;
}

const getChatPromptsByLang = (langCode: string) => {
  if (langCode.startsWith('or')) {
    return [
      { label: '🌾 କୃଷକ ଓ କୃଷି ଯୋଜନା', query: 'ମୋତେ ଚାଷୀ ଏବଂ କୃଷି ପାଇଁ ସରକାରୀ ସବସିଡି ଏବଂ ଯୋଜନା ବିଷୟରେ କୁହନ୍ତୁ' },
      { label: '🎓 ଛାତ୍ରବୃତ୍ତି ଓ ଶିକ୍ଷା ସହାୟତା', query: 'କଲେଜ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ କେଉଁ ସ୍କଲାରସିପ୍ ଏବଂ ଶିକ୍ଷା ସହାୟତା ଉପଲବ୍ଧ?' },
      { label: '💼 ମୁଦ୍ରା ଓ ବ୍ୟବସାୟ ଋଣ', query: 'ନୂତନ ବ୍ୟବସାୟ କିମ୍ବା ଦୋକାନ ପାଇଁ କମ୍ ସୁଧ ସରକାରୀ ଋଣ ଯୋଜନା କ’ଣ?' },
      { label: '🏥 ବିଜୁ ସ୍ୱାସ୍ଥ୍ୟ ଓ ଆୟୁଷ୍ମାନ ଭାରତ', query: 'ଆୟୁଷ୍ମାନ ଭାରତ କାର୍ଡ଼ ଏବଂ ମାଗଣା ଡାକ୍ତରଖାନା ଚିକିତ୍ସା ପାତ୍ରତା କ’ଣ?' },
      { label: '👩 ମହିଳା ଓ ଶିଶୁ କଲ୍ୟାଣ', query: 'ମହିଳା ଏବଂ ଝିଅମାନଙ୍କ ପାଇଁ ସରକାରୀ କଲ୍ୟାଣ ଏବଂ ସଞ୍ଚୟ ଯୋଜନା କ’ଣ?' },
      { label: '👵 ବାର୍ଦ୍ଧକ୍ୟ ପେନସନ ଯୋଜନା', query: 'ବରିଷ୍ଠ ନାଗରିକ ଏବଂ ବାର୍ଦ୍ଧକ୍ୟ ପେନସନ ଯୋଜନା ପାତ୍ରତା' },
    ];
  }
  if (langCode.startsWith('hi')) {
    return [
      { label: '🌾 किसान व कृषि योजनाएं', query: 'मुझे किसान और खेती के लिए सरकारी सब्सिडी और योजनाएं बताइए' },
      { label: '🎓 छात्रवृत्ति व शिक्षा सहायता', query: 'कॉलेज और 12वीं के छात्रों के लिए कौन सी सरकारी स्कॉलरशिप उपलब्ध हैं?' },
      { label: '💼 मुद्रा व बिजनेस लोन', query: 'नए बिजनेस या दुकान के लिए कम ब्याज वाली सरकारी लोन योजनाएं कौन सी हैं?' },
      { label: '🏥 आयुष्मान भारत स्वास्थ्य कार्ड', query: 'आयुष्मान भारत कार्ड और 5 लाख तक मुफ्त इलाज की पात्रता क्या है?' },
      { label: '👩 महिला एवं बाल कल्याण', query: 'महिलाओं और बेटियों के लिए सरकारी कल्याण और बचत योजनाएं कौन सी हैं?' },
      { label: '👵 वरिष्ठ नागरिक पेंशन', query: 'वृद्धावस्था और वरिष्ठ नागरिक पेंशन योजना की पात्रता क्या है?' },
    ];
  }
  if (langCode.startsWith('bn')) {
    return [
      { label: '🌾 কৃষক ও কৃষি প্রকল্প', query: 'কৃষকদের জন্য সরকারি অনুদান ও প্রকল্পের তথ্য দিন' },
      { label: '🎓 স্কলারশিপ ও শিক্ষা সাহায্য', query: 'ছাত্রছাত্রীদের জন্য কোন কোন सरकारी স্কলারশিপ রয়েছে?' },
      { label: '💼 মুদ্রা ও ব্যবসা ঋণ', query: 'নতুন ব্যবসা শুরুর জন্য স্বল্প সুদের सरकारी ঋণ প্রকল্প' },
      { label: '🏥 স্বাস্থ্যসাথী ও আয়ুষ্মান ভারত', query: 'আয়ুষ্মান ভারত কার্ড ও বিনামূল্যে চিকিৎসার যোগ্যতা' },
      { label: '👩 নারী ও শিশু কল্যাণ', query: 'মহিলা ও কন্যাদের জন্য सरकारी সঞ্চয় ও সাহায্য প্রকল্প' },
      { label: '👵 বার্ধক্য পেনশন প্রকল্প', query: 'প্রবীণ নাগরিকদের জন্য বার্ধক্য পেনশন প্রকল্পের যোগ্যতা' },
    ];
  }
  return [
    { label: '🌾 Kisan & Agriculture', query: 'Tell me about government farming subsidies and PM-Kisan benefits' },
    { label: '🎓 Student Scholarships', query: 'What scholarships and educational financial assistance are available for college students?' },
    { label: '💼 Business & Mudra Loans', query: 'What are low-interest government loan schemes for starting a shop or new business?' },
    { label: '🏥 Ayushman Bharat Health', query: 'How can I get an Ayushman Bharat golden card for 5 lakh free hospitalization?' },
    { label: '👩 Women & Child Welfare', query: 'What government savings and financial welfare schemes exist for women and daughters?' },
    { label: '👵 Senior Citizen Pensions', query: 'Eligibility and benefits of old age and senior citizen pension schemes' },
  ];
};

let _msgCounter = 0;
const nextMsgId = (prefix = 'msg') => `${prefix}-${Date.now()}-${++_msgCounter}`;

// Helper to strip Markdown formatting for clean voice speech synthesis
const cleanTextForSpeech = (rawText: string): string => {
  return rawText
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\n\r]+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper to render Markdown formatting nicely
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  const formatInline = (str: string): React.ReactNode => {
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-inherit">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={idx} className="italic opacity-90">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-sm sm:text-base text-inherit mt-2 mb-1">
              {formatInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-extrabold text-base text-inherit mt-2.5 mb-1">
              {formatInline(trimmed.replace(/^##\s+/, ''))}
            </h3>
          );
        }

        if (/^[-*•]\s+/.test(trimmed)) {
          const content = trimmed.replace(/^[-*•]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-teal-600 font-bold shrink-0 mt-0.5">•</span>
              <span className="flex-1">{formatInline(content)}</span>
            </div>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-teal-700 font-bold shrink-0 text-xs mt-0.5">{numMatch[1]}.</span>
              <span className="flex-1">{formatInline(numMatch[2])}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {formatInline(line)}
          </p>
        );
      })}
    </div>
  );
};

export const SchemeAdvisorChat: React.FC = () => {
  const { t, langCode } = useTranslation();
  const { selectedLanguage } = useAppStore();
  const location = useLocation();

  const isHindi = langCode.startsWith('hi');
  const isOdia = langCode.startsWith('or');
  const activeSpeechLang = selectedLanguage?.speechCode || (isOdia ? 'or-IN' : isHindi ? 'hi-IN' : 'en-IN');

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-init-1',
      sender: 'assistant',
      text: isOdia
        ? 'ନମସ୍କାର! 🙏 ମୁଁ ଆପଣଙ୍କର **ମିତ୍ର (Mitra AI)** — ସରକାରୀ ଯୋଜନା ପରାମର୍ଶଦାତା।\n\nମୋତେ ଆପଣଙ୍କ ବିଷୟରେ କୁହନ୍ତୁ — ଯେପରିକି ଆପଣଙ୍କର **ବୟସ (Age)**, **ରାଜ୍ୟ (State)**, **ବୃତ୍ତି (Occupation)**, କିମ୍ବା ଆପଣ କେଉଁ ପ୍ରକାରର ଯୋଜନା ଖୋଜୁଛନ୍ତି (ଛାତ୍ରବୃତ୍ତି, କୃଷକ ସହାୟତା, ବ୍ୟବସାୟ ଋଣ, ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଡ଼, ବାର୍ଦ୍ଧକ୍ୟ ପେନସନ), ଏବଂ ମୁଁ ୩,୮୬୬ ଯୋଜନାରୁ ସଠିକ୍ ସୂଚନା ଦେବି।'
        : isHindi
        ? 'नमस्ते! 🙏 मैं आपका **मित्र (Mitra AI)** — सरकारी योजना सलाहकार हूँ।\n\nमुझे अपने बारे में बताएं — जैसे आपकी **आयु (Age)**, **राज्य (State)**, **व्यवसाय (Occupation)**, या आप किस प्रकार की योजना ढूंढ रहे हैं (छात्रवृत्ति, किसान सहायता, बिजनेस लोन, स्वास्थ्य कार्ड, आवास), और मैं आपके लिए 3,866 सत्यापित सरकारी योजनाओं में से सटीक जानकारी दूंगा।'
        : 'Hello! 👋 I am **Mitra (मित्र)** — your personal AI Welfare & Scheme Advisor.\n\nTell me about yourself — like your **Age**, **State**, **Occupation**, or what support you need (Scholarships, Farming subsidies, Mudra loans, Healthcare, Housing), and I will find verified government welfare schemes for you.',
      timestamp: 'Just now',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  // Auto-speak is OFF by default so user is never interrupted
  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const initialSentRef = useRef(false);
  const userProfile = getSavedProfile();

  // Voice Input (STT) Hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    language: activeSpeechLang,
    continuous: true,
    interimResults: true,
    onResult: (finalText) => {
      setInputQuery(finalText);
    },
  });

  // Keep inputQuery synced with voice transcript
  useEffect(() => {
    if (transcript) {
      setInputQuery(transcript);
    }
  }, [transcript]);

  // Voice Talk / TTS Controller
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('SpeechSynthesis cancel error:', e);
      }
      setSpeakingMessageId(null);
      setIsSpeechPaused(false);
    }
  }, []);

  const pauseSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
        setIsSpeechPaused(true);
      } catch (e) {
        console.warn('SpeechSynthesis pause error:', e);
      }
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        setIsSpeechPaused(false);
      } catch (e) {
        console.warn('SpeechSynthesis resume error:', e);
      }
    }
  }, []);

  const speakText = useCallback(
    (msgId: string, textToSpeak: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      stopSpeech();

      const cleaned = cleanTextForSpeech(textToSpeak);
      if (!cleaned) return;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = activeSpeechLang;
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      // Match system voice for Indic languages
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = activeSpeechLang.split('-')[0].toLowerCase();
        const bestVoice =
          voices.find((v) => v.lang.toLowerCase() === activeSpeechLang.toLowerCase()) ||
          voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
          voices.find((v) => v.lang.includes('IN')) ||
          voices[0];
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }

      utterance.onstart = () => {
        setSpeakingMessageId(msgId);
        setIsSpeechPaused(false);
      };

      utterance.onend = () => {
        setSpeakingMessageId(null);
        setIsSpeechPaused(false);
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setSpeakingMessageId(null);
        setIsSpeechPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [activeSpeechLang, speechRate, stopSpeech]
  );

  const handleCopyText = (msgId: string, text: string) => {
    const textToCopy = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();
    navigator.clipboard.writeText(textToCopy);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleClearChat = () => {
    stopSpeech();
    setMessages([
      {
        id: nextMsgId('msg-init'),
        sender: 'assistant',
        text: isOdia
          ? 'ନମସ୍କାର! ବାର୍ତ୍ତାଳାପ ପୁନଃସ୍ଥାପିତ ହୋଇଛି। ଆଜି ମିତ୍ର ଆପଣଙ୍କୁ କେଉଁ ସରକାରୀ ଯୋଜନା ଖୋଜିବାରେ ସାହାଯ୍ୟ କରିପାରିବ?'
          : isHindi
          ? 'नमस्ते! बातचीत रीसेट कर दी गई है। आज मैं आपकी कौन सी सरकारी योजना खोजने में मदद कर सकता हूँ?'
          : 'Hello! Chat has been reset. How can Mitra AI help you discover welfare schemes today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSend = async (queryText: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isTyping) return;

    if (isListening) {
      stopListening();
    }
    stopSpeech();
    resetTranscript();

    const userMsg: ChatMessage = {
      id: nextMsgId('msg-user'),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputQuery('');
    setIsTyping(true);

    try {
      const history = newMessages.slice(-10).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const profile = getSavedProfile();
      const response = await api.askAI(q, history, profile);

      const matchedSchemes =
        response.referencedSchemes && response.referencedSchemes.length > 0
          ? response.referencedSchemes
          : undefined;

      const botMsgId = nextMsgId('msg-bot');
      const botMsg: ChatMessage = {
        id: botMsgId,
        sender: 'assistant',
        text: response.answer,
        matchedSchemes,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Only speak if user explicitly enabled auto-speak
      if (isAutoSpeak) {
        setTimeout(() => {
          speakText(botMsgId, response.answer);
        }, 300);
      }
    } catch {
      const fallbackId = nextMsgId('msg-bot-fallback');
      const fallbackText = isOdia
        ? 'ମୁଁ ଆପଣଙ୍କ ଅନୁରୋଧର ବିଶ୍ଳେଷଣ କରୁଛି। ଆପଣ ସିଧାସଳଖ ଯୋଜନା ତାଲିକା ମଧ୍ୟ ଦେଖିପାରିବେ କିମ୍ବା ଯୋଗ୍ୟତା ଯାଞ୍ଚ କରିପାରିବେ।'
        : isHindi
        ? 'मैं आपके अनुरोध का विश्लेषण कर रहा हूँ। आप सीधे योजनाओं की सूची भी देख सकते हैं या पात्रता फॉर्म भर सकते हैं।'
        : 'I am analyzing your request. You can also explore verified schemes directly in the directory or complete the eligibility survey.';

      const botMsg: ChatMessage = {
        id: fallbackId,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);

      if (isAutoSpeak) {
        setTimeout(() => {
          speakText(fallbackId, fallbackText);
        }, 300);
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Consume initialQuery from navigation state (e.g. from popup search)
  useEffect(() => {
    const initQuery = (location.state as any)?.initialQuery;
    if (initQuery && !initialSentRef.current) {
      initialSentRef.current = true;
      handleSend(initQuery);
    }
  }, [location.state]);

  const promptCategories = getChatPromptsByLang(langCode);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-slate-950 text-white rounded-3xl p-5 sm:p-7 border border-teal-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/80 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isOdia
                ? 'ମିତ୍ର AI — ସ୍ମାର୍ଟ ଯୋଜନା ପରାମର୍ଶଦାତା'
                : isHindi
                ? 'मित्र AI — स्मार्ट योजना सलाहकार'
                : 'Mitra AI — Smart Welfare Advisor'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {isOdia ? 'ମିତ୍ର (Mitra AI)' : isHindi ? 'मित्र (Mitra AI)' : 'Mitra — AI Scheme Advisor'}
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/80 max-w-xl leading-relaxed">
            {isOdia
              ? 'ଆପଣଙ୍କର ବ୍ୟକ୍ତିଗତ AI ସାଥୀ ଯିଏ ୩,୮୬୬ ସରକାରୀ ଯୋଜନାରୁ ଆପଣଙ୍କ ଭାଷାରେ ତତକ୍ଷଣାତ ପରାମର୍ଶ ଦେଇଥାଏ।'
              : isHindi
              ? 'आपका व्यक्तिगत AI मित्र जो 3,866 सरकारी योजनाओं के पूरे डेटाबेस से आपकी भाषा में सटीक सलाह देता है।'
              : 'Your personal AI companion that provides instant eligibility insights across 3,866 verified welfare schemes in Indian languages.'}
          </p>
        </div>

        {/* Header Right: Verified count & Audio speed */}
        <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2.5 shrink-0">
          <div className="p-2.5 rounded-2xl bg-teal-900/60 border border-teal-700/60 text-xs text-emerald-300 flex items-center gap-2 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-xs">
              {isOdia ? '୩,୮୬୬ ଯୋଜନା ସତ୍ୟାପିତ' : isHindi ? '3,866 सत्यापित योजनाएं' : '3,866 verified schemes'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 border border-teal-700/50 rounded-2xl px-3 py-1 text-xs text-slate-200">
            <button
              type="button"
              onClick={() => {
                if (isAutoSpeak) {
                  stopSpeech();
                }
                setIsAutoSpeak(!isAutoSpeak);
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                isAutoSpeak ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Auto-speak incoming responses"
            >
              {isAutoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{isOdia ? 'ସ୍ୱୟଂଚାଳିତ ସ୍ୱର' : isHindi ? 'ऑटो-वॉइस' : 'Auto Voice'}</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={() => setSpeechRate((r) => (r === 1.0 ? 1.2 : r === 1.2 ? 0.9 : 1.0))}
              className="text-[11px] font-bold text-teal-300 hover:text-white transition-colors cursor-pointer"
              title="Change Voice Speed"
            >
              {speechRate}x
            </button>
          </div>
        </div>
      </div>

      {/* Citizen Profile Context Card (if available) */}
      {userProfile && (userProfile.state || userProfile.age || userProfile.occupation) && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-emerald-950 dark:text-emerald-200 shadow-2xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="font-bold shrink-0">{isOdia ? 'ପ୍ରୋଫାଇଲ୍ ସଂଯୁକ୍ତ:' : isHindi ? 'प्रोफाइल कनेक्टेड:' : 'Active Profile:'}</span>
            <span className="truncate text-emerald-800 dark:text-emerald-300">
              {[
                userProfile.state ? `📍 ${userProfile.state}` : '',
                userProfile.age ? `🎂 ${userProfile.age} ${isOdia ? 'ବର୍ଷ' : isHindi ? 'वर्ष' : 'yrs'}` : '',
                userProfile.occupation ? `💼 ${userProfile.occupation}` : '',
                userProfile.category ? `🏷️ ${userProfile.category}` : '',
              ]
                .filter(Boolean)
                .join(' • ')}
            </span>
          </div>
          <Link
            to="/eligibility"
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 underline shrink-0"
          >
            {isOdia ? 'ପରିବର୍ତ୍ତନ' : isHindi ? 'बदलें' : 'Edit'}
          </Link>
        </div>
      )}

      {/* Suggested Quick Prompt Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{isOdia ? 'ପ୍ରମୁଖ ବିଷୟ:' : isHindi ? 'सुझाए गए विषय:' : 'Suggested Topics:'}</span>
          </span>
          {messages.length > 1 && (
            <button
              onClick={handleClearChat}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              title="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isOdia ? 'ଚାଟ୍ ରିସେଟ୍' : isHindi ? 'रीसेट चैट' : 'Reset Chat'}</span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {promptCategories.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip.query)}
              className="text-left text-xs font-medium bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-950 dark:hover:text-teal-300 hover:border-teal-400 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-all cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 min-h-[480px] flex flex-col justify-between">
        {/* Messages List */}
        <div ref={chatScrollRef} className="space-y-4 overflow-y-auto max-h-[540px] pr-2">
          {messages.map((msg) => {
            const isSpeakingThis = speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-slate-900'
                      : 'bg-gradient-to-br from-teal-700 to-teal-950 border border-teal-600'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-emerald-300" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`space-y-2.5 max-w-[88%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed relative ${
                    msg.sender === 'user'
                      ? 'bg-teal-800 dark:bg-teal-700 text-white rounded-tr-xs shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {/* Formatted Markdown Message Body */}
                  <FormattedMessage text={msg.text} />

                  {/* Inline Referenced Scheme Cards (Localized) */}
                  {msg.matchedSchemes && msg.matchedSchemes.length > 0 && (
                    <div className="space-y-2 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-800 dark:text-teal-300">
                        <Compass className="w-3.5 h-3.5" />
                        <span>{isOdia ? 'ଅନୁଶଂସିତ ସରକାରୀ ଯୋଜନା:' : isHindi ? 'अनुशंसित योजनाएं:' : 'Recommended Verified Schemes:'}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {msg.matchedSchemes.map((rawScheme) => {
                          const scheme = translateSchemeContent(rawScheme, langCode);
                          const benefit = Array.isArray(scheme.benefits) ? scheme.benefits[0] : null;

                          return (
                            <div
                              key={scheme.id || scheme.slug}
                              className="bg-white dark:bg-slate-800/95 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 transition-all text-left space-y-1.5 shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <StatusPill type="category" value={scheme.category} size="sm" />
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                  {isOdia ? '✓ ସତ୍ୟାପିତ ଯୋଜନା' : isHindi ? '✓ सत्यापित योजना' : '✓ Verified'}
                                </span>
                              </div>

                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                                {scheme.name}
                              </h4>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                {scheme.shortDescription || scheme.tagline}
                              </p>

                              {benefit && (
                                <div className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border dark:border-teal-900/60">
                                  💰 {benefit.amountOrValue || benefit.title || benefit.description}
                                </div>
                              )}

                              <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-700/60">
                                {scheme.verification?.officialPortalUrl ? (
                                  <a
                                    href={scheme.verification.officialPortalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>{isOdia ? 'ଅଫିସିଆଲ୍ ପୋର୍ଟାଲ୍' : isHindi ? 'ऑफिशियल पोर्टल' : 'Official Portal'}</span>
                                  </a>
                                ) : <span />}

                                <Link
                                  to={`/schemes/${scheme.slug}`}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 dark:text-teal-400 hover:text-teal-950 dark:hover:text-teal-300"
                                >
                                  <span>{t('scheme_card.view_details', undefined, isOdia ? 'ସମ୍ପୂର୍ଣ୍ଣ ବିବରଣୀ' : isHindi ? 'योजना देखें' : 'View Details')}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Message Bottom Action Bar */}
                  {msg.sender === 'assistant' ? (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        {/* Audio Listen / Pause / Stop Button */}
                        {isSpeakingThis ? (
                          <div className="flex items-center gap-1 bg-teal-100/80 dark:bg-teal-900/60 px-2 py-0.5 rounded-lg text-teal-900 dark:text-teal-200 font-medium">
                            <span className="w-1 h-3 bg-teal-600 rounded-full animate-pulse" />
                            <span className="w-1 h-4 bg-teal-600 rounded-full animate-pulse [animation-delay:0.2s]" />
                            <span className="w-1 h-2 bg-teal-600 rounded-full animate-pulse [animation-delay:0.4s]" />
                            <span className="text-[10px] font-bold mx-1">
                              {isSpeechPaused ? (isHindi ? 'रोका गया' : 'Paused') : (isHindi ? 'सुनाया जा रहा है...' : 'Playing...')}
                            </span>
                            {isSpeechPaused ? (
                              <button
                                type="button"
                                onClick={resumeSpeech}
                                className="p-0.5 hover:text-teal-950 dark:hover:text-white cursor-pointer"
                                title="Resume"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={pauseSpeech}
                                className="p-0.5 hover:text-teal-950 dark:hover:text-white cursor-pointer"
                                title="Pause"
                              >
                                <Pause className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={stopSpeech}
                              className="p-0.5 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer text-rose-600 dark:text-rose-400"
                              title="Stop"
                            >
                              <Square className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => speakText(msg.id, msg.text)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700 hover:bg-teal-100 dark:hover:bg-slate-600 hover:text-teal-900 dark:hover:text-white text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Listen aloud (बोलकर सुनें)"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                            <span>{isOdia ? 'ଶୁଣନ୍ତୁ' : isHindi ? 'सुनें' : 'Listen'}</span>
                          </button>
                        )}

                        {/* Copy Message Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Copy text"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{isHindi ? 'कॉपी हुआ!' : 'Copied!'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                              <span>{isHindi ? 'कॉपी' : 'Copy'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{msg.timestamp}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-300 dark:text-slate-500 text-right">{msg.timestamp}</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Clean Modern Typing / Thinking Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3 pl-1 animate-in fade-in">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-950 flex items-center justify-center shrink-0 text-white shadow-2xs">
                <Bot className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-2xs">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300 ml-1">
                  {isOdia
                    ? 'ମିତ୍ର AI ବିଶ୍ଳେଷଣ କରୁଛି...'
                    : isHindi
                    ? 'मित्र AI सोच रहा है...'
                    : 'Mitra AI is thinking...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Voice Transcript Live Pill (While Mic is active) */}
        {isListening && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl p-3 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2 text-xs text-rose-900 dark:text-rose-200 font-bold overflow-hidden">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <span className="shrink-0">{isOdia ? 'ଶୁଣୁଛି...' : isHindi ? 'सुन रहा हूँ... बोलिए:' : 'Listening... Speak now:'}</span>
              <span className="italic truncate text-rose-700 dark:text-rose-300 font-normal">
                {interimTranscript || transcript || (isOdia ? 'ଆପଣଙ୍କ ପ୍ରଶ୍ନ କୁହନ୍ତୁ...' : isHindi ? 'अपनी भाषा में बोलें...' : 'Speak your question...')}
              </span>
            </div>
            <button
              type="button"
              onClick={stopListening}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer shadow-xs"
            >
              {isOdia ? 'ସମାପ୍ତ କରନ୍ତୁ' : isHindi ? 'रोकें' : 'Done'}
            </button>
          </div>
        )}

        {/* Voice Error Notification */}
        {voiceError && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
            <span>{voiceError}</span>
            <button
              type="button"
              onClick={resetTranscript}
              className="font-bold underline text-amber-900 dark:text-amber-300 cursor-pointer"
            >
              OK
            </button>
          </div>
        )}

        {/* Input Bar with Voice Input (Mic) and Text Send */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            {/* Voice Input Mic Button */}
            <button
              type="button"
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  resetTranscript();
                  startListening();
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-rose-600 border-rose-700 text-white shadow-lg ring-4 ring-rose-300 dark:ring-rose-900/60 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 text-teal-800 dark:text-teal-400 shadow-2xs'
              }`}
              title={
                isListening
                  ? 'Listening... Click to stop'
                  : isOdia
                  ? 'ମାଇକ୍ ସହିତ କୁହନ୍ତୁ (Voice Input)'
                  : isHindi
                  ? 'माइक से बोलें (Voice Input)'
                  : 'Click to speak in your language (Voice Input)'
              }
            >
              {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input Field */}
            <input
              type="text"
              placeholder={
                isListening
                  ? isOdia ? 'ଶୁଣୁଛି... କୁହନ୍ତୁ...' : isHindi ? 'सुन रहा हूँ... बोलिए...' : 'Listening... Speak now...'
                  : isOdia
                  ? 'ଆପଣଙ୍କ ଭାଷାରେ ଯେକୌଣସି ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ କିମ୍ବା ମାଇକ୍ ବଟନ୍ ଦବାନ୍ତୁ...'
                  : isHindi
                  ? 'अपनी भाषा में कुछ भी पूछें या माइक दबाकर बोलें...'
                  : 'Type your question or click mic to speak in your language...'
              }
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 px-4 py-3.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:border-teal-600 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl text-xs sm:text-sm font-medium outline-hidden transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="p-3.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-40 text-white rounded-2xl shadow-md transition-all cursor-pointer shrink-0"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


