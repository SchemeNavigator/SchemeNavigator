import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../../types';
import { getSavedProfile, saveUserProfile } from '../../services/storageService';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from '../../hooks/useTranslation';
import { StepPersonal } from './StepPersonal';
import { StepLocation } from './StepLocation';
import { StepBackground } from './StepBackground';
import { StepEmployment } from './StepEmployment';
import { StepIncome } from './StepIncome';
import { StepReview, getMissingMandatoryFields } from './StepReview';
import { VoiceSurveyModal } from './VoiceSurveyModal';
import { VoiceMicButton } from './VoiceMicButton';
import { LanguageSelector } from '../common/LanguageSelector';
import { ParsedEntity } from '../../utils/voiceParser';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Compass,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const SurveyWizard: React.FC = () => {
  const navigate = useNavigate();
  const { profile: storeProfile, surveyDraft, saveDraft, submitSurvey } = useAppStore();
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(() => surveyDraft?.currentStep || 1);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const existing = storeProfile || getSavedProfile() || surveyDraft?.answers;
    return existing && existing.age ? existing : {};
  });
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceNotification, setVoiceNotification] = useState<{
    text: string;
    entities: ParsedEntity[];
  } | null>(null);

  const totalSteps = 6;

  const stepTitles = [
    t('survey.stepPersonal'),
    t('survey.stepLocation'),
    t('survey.stepBackground'),
    t('survey.stepEmployment'),
    t('survey.stepIncome'),
    t('survey.stepReview'),
  ];

  const handleFieldChange = (fields: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...fields };
      saveDraft(updated, currentStep);
      return updated;
    });
  };

  const handleVoiceApply = (extracted: Partial<UserProfile>, entities: ParsedEntity[]) => {
    setProfile((prev) => {
      const updated = { ...prev, ...extracted };
      saveDraft(updated, currentStep);
      return updated;
    });

    setVoiceNotification({
      text: `Updated ${entities.length} field${entities.length > 1 ? 's' : ''} from your voice answer!`,
      entities,
    });

    setTimeout(() => {
      setVoiceNotification(null);
    }, 5000);
  };

  const [stepError, setStepError] = useState<string | null>(null);

  const handleNext = async () => {
    setStepError(null);

    // Step 1 Validation
    if (currentStep === 1) {
      if (!profile.age || Number(profile.age) < 1 || Number(profile.age) > 120) {
        setStepError('⚠️ Age is mandatory (1–120 years). Please enter your age to discover matching schemes.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!profile.gender) {
        setStepError('⚠️ Gender is mandatory. Please select your gender to check scheme eligibility.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Step 2 Validation
    if (currentStep === 2) {
      if (!profile.state) {
        setStepError('⚠️ State / UT is mandatory. Please select your State to view applicable welfare schemes.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Step 4 Validation
    if (currentStep === 4) {
      if (!profile.employmentStatus && !profile.employmentType && !profile.occupation) {
        setStepError('⚠️ Occupation / Employment status is mandatory. Please select your primary occupation.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveDraft(profile, nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Step 6: Review & Confirmation -> Validate ALL Mandatory Fields before submitting
      const missing = getMissingMandatoryFields(profile);
      if (missing.length > 0) {
        setStepError(
          `⚠️ Mandatory Profile Fields Missing: Please fill ${missing.map((m) => m.label).join(', ')} before submitting to find eligible schemes.`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Save user profile immediately to local storage
      saveUserProfile(profile);

      // Trigger survey submit non-blocking so button does not freeze
      submitSurvey(profile).catch((err) => {
        console.warn('submitSurvey background error handled:', err);
      });

      // Instantly transition to analyzing screen without latency
      navigate('/analyzing');
    }
  };

  const handlePrev = () => {
    setStepError(null);
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveDraft(profile, prevStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (targetStep: number) => {
    setStepError(null);
    if (targetStep <= currentStep) {
      // Going back or staying on current step is always allowed
      setCurrentStep(targetStep);
      saveDraft(profile, targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check mandatory fields for all steps before targetStep
    const missing = getMissingMandatoryFields(profile);
    const missingBeforeTarget = missing.filter((m) => m.step < targetStep);

    if (missingBeforeTarget.length > 0) {
      setStepError(
        `⚠️ Mandatory fields missing: Please complete Step ${missingBeforeTarget[0].step} (${missingBeforeTarget[0].label}) before proceeding to Step ${targetStep}.`
      );
      setCurrentStep(missingBeforeTarget[0].step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentStep(targetStep);
    saveDraft(profile, targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditStep = (stepNumber: number) => {
    setStepError(null);
    setCurrentStep(stepNumber);
    saveDraft(profile, stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Progress percentage
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Wizard Header with Progress Bar */}
      <div className="mb-8 space-y-4">
        {/* Step Indicator Top Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-[11px]">
              {currentStep}
            </span>
            <span className="text-slate-900 dark:text-white uppercase tracking-wider">
              Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector variant="compact" align="right" />
            <VoiceMicButton
              onClick={() => setIsVoiceModalOpen(true)}
              variant="pill"
              label="Voice Input"
              sublabel="बोलें"
            />
          </div>
        </div>

        {/* Continuous Progress Bar */}
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Dots Checklist */}
        <div className="hidden sm:flex items-center justify-between pt-1">
          {stepTitles.map((title, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <button
                key={title}
                type="button"
                onClick={() => handleStepClick(stepNum)}
                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isCurrent
                    ? 'text-teal-900 dark:text-teal-400 font-bold'
                    : isCompleted
                    ? 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                      isCurrent
                        ? 'bg-teal-800 text-white font-bold'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {stepNum}
                  </span>
                )}
                <span>{title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Auto-fill Notification Banner */}
      {voiceNotification && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-400 animate-in slide-in-from-top-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-100 shrink-0" />
            <div>
              <span className="text-sm font-extrabold block">{voiceNotification.text}</span>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {voiceNotification.entities.map((ent, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-white/20 text-white font-semibold"
                  >
                    {ent.label}: {ent.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVoiceNotification(null)}
            className="text-white/80 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Voice Assistant Banner on Steps 1 to 5 */}
      {currentStep < 6 && (
        <div className="mb-6">
          <VoiceMicButton
            variant="banner"
            onClick={() => setIsVoiceModalOpen(true)}
            label="Speak your answer with Voice Assist"
            sublabel="बोल कर भरें"
          />
        </div>
      )}

      {/* Prominent Red Step Validation Error Alert */}
      {stepError && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-500 shadow-md shadow-rose-500/10 text-rose-950 flex items-start justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <span className="text-xs sm:text-sm font-extrabold text-rose-900 block">
                Action Required
              </span>
              <p className="text-xs sm:text-sm font-semibold text-rose-800 leading-snug">
                {stepError}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStepError(null)}
            className="text-rose-600 hover:text-rose-900 font-extrabold text-sm px-2 py-1 rounded-lg hover:bg-rose-100 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Survey Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-none transition-all">
        {currentStep === 1 && (
          <StepPersonal
            profile={profile}
            onChange={handleFieldChange}
            onOpenVoice={() => setIsVoiceModalOpen(true)}
          />
        )}
        {currentStep === 2 && (
          <StepLocation
            profile={profile}
            onChange={handleFieldChange}
            onOpenVoice={() => setIsVoiceModalOpen(true)}
          />
        )}
        {currentStep === 3 && (
          <StepBackground
            profile={profile}
            onChange={handleFieldChange}
            onOpenVoice={() => setIsVoiceModalOpen(true)}
          />
        )}
        {currentStep === 4 && (
          <StepEmployment
            profile={profile}
            onChange={handleFieldChange}
            onOpenVoice={() => setIsVoiceModalOpen(true)}
          />
        )}
        {currentStep === 5 && (
          <StepIncome
            profile={profile}
            onChange={handleFieldChange}
            onOpenVoice={() => setIsVoiceModalOpen(true)}
          />
        )}
        {currentStep === 6 && (
          <StepReview profile={profile} onEditStep={handleEditStep} />
        )}

        {/* Wizard Footer Navigation Actions */}
        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('survey.back')}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-teal-950 hover:from-teal-800 hover:to-slate-900 text-white font-extrabold text-sm shadow-lg shadow-teal-950/20 hover:shadow-xl transition-all cursor-pointer group active:scale-[0.98]"
          >
            {currentStep === totalSteps ? (
              <>
                <Compass className="w-4 h-4 text-emerald-300 group-hover:rotate-45 transition-transform" />
                <span>{t('survey.submit')}</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </>
            ) : (
              <>
                <span>{t('survey.next')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Voice Survey Assistant Modal */}
      <VoiceSurveyModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApply={handleVoiceApply}
        currentStep={currentStep}
        initialProfile={profile}
      />
    </div>
  );
};
