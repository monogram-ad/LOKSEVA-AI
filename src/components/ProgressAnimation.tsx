import React, { useEffect, useState } from 'react';
import { BrainCircuit, Check, CheckCircle2, Cpu, GitBranch, Loader2, Network } from 'lucide-react';

interface ProgressAnimationProps {
  onComplete: () => void;
}

export const ProgressAnimation: React.FC<ProgressAnimationProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const steps = [
    {
      id: 1,
      title: 'Analyzing',
      subtitle: 'Parsing natural language semantics, extracting location entities & key phrases',
      icon: Cpu,
    },
    {
      id: 2,
      title: 'Classifying',
      subtitle: 'Evaluating urgency matrix, life-safety hazard level & multi-issue detection',
      icon: BrainCircuit,
    },
    {
      id: 3,
      title: 'Routing',
      subtitle: 'Matching departmental jurisdiction, jurisdiction rules & SLA prioritization',
      icon: Network,
    },
  ];

  useEffect(() => {
    // Step 1 -> 2
    const timer1 = setTimeout(() => {
      setCurrentStep(2);
    }, 800);

    // Step 2 -> 3
    const timer2 = setTimeout(() => {
      setCurrentStep(3);
    }, 1600);

    // Step 3 -> complete
    const timer3 = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="w-full bg-white rounded-[12px] border border-slate-200/80 p-8 shadow-sm transition-all duration-300">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              Automated Intake & AI Triage in Progress
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Processing transcript through government grievance dispatch engine
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            Step {currentStep} of 3
          </span>
        </div>

        {/* Step Timeline */}
        <div className="relative mb-8">
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-100 -z-0">
            <div
              className="h-full bg-indigo-600 transition-all duration-500 ease-out"
              style={{
                width: currentStep === 1 ? '15%' : currentStep === 2 ? '55%' : '100%',
              }}
            />
          </div>

          <div className="flex items-center justify-between relative z-10">
            {steps.map((step) => {
              const isPast = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 font-semibold text-sm ${
                      isPast
                        ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50'
                        : isCurrent
                        ? 'bg-indigo-600 text-white shadow-md ring-4 ring-indigo-50 animate-pulse'
                        : 'bg-white text-slate-400 border-2 border-slate-200'
                    }`}
                  >
                    {isPast ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`mt-2.5 text-xs font-medium tracking-tight ${
                      isCurrent
                        ? 'text-indigo-600 font-bold'
                        : isPast
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Active Step Details Card */}
        <div className="bg-[#F4F6FA] rounded-[10px] p-4 border border-slate-200/60 flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-white shadow-xs text-indigo-600 border border-slate-200/50">
            {currentStep === 1 && <Cpu className="w-4 h-4 animate-spin" />}
            {currentStep === 2 && <BrainCircuit className="w-4 h-4 animate-bounce" />}
            {currentStep === 3 && <Network className="w-4 h-4 animate-pulse" />}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Live Stage: {steps[currentStep - 1]?.title}
            </div>
            <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {steps[currentStep - 1]?.subtitle}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
