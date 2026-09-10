import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { ChatbotFAB } from '../components/common/ChatbotFAB';
import { OnboardingTour } from '../components/common/OnboardingTour';

export const RootLayout: React.FC = () => {
  const location = useLocation();

  // Scroll to top on route transition
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Top Universal Transparency Notice */}
      <DisclaimerBanner variant="inline" />

      {/* Primary Sticky Header */}
      <Navbar />

      {/* Main Page Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating AI Advisor Chatbot Button */}
      <ChatbotFAB />

      {/* Interactive Onboarding Tour & Welcome Screen Window */}
      <OnboardingTour />
    </div>
  );
};
