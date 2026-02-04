"use client";

import { useState, useEffect } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Play } from 'lucide-react';

export default function SopWizard({ data }) {
  const [currentStep, setCurrentStep] = useState(-1); // -1: Prep, 0..N: Steps, 'finished': Done

  // Reset if data changes
  useEffect(() => {
    setCurrentStep(-1);
  }, [data]);

  if (!data || !Array.isArray(data.steps) || data.steps.length === 0) return null;

  const { title, preps, steps } = data;

  const handleStart = () => setCurrentStep(0);
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCurrentStep('finished');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      setCurrentStep(-1);
    }
  };

  const handleReview = () => setCurrentStep(0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden my-3">
      {/* Header */}
      {currentStep !== 'finished' && (
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="font-semibold text-gray-800 text-sm">{title || '操作向导'}</span>
          </div>
          <div className="text-xs px-2 py-1 bg-gray-200 rounded text-gray-600 font-medium">
            {currentStep === -1 ? '准备阶段' : `${currentStep + 1} / ${steps.length}`}
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Phase 1: Preparation */}
        {currentStep === -1 && (
          <div className="animate-fade-in">
            <div className="space-y-3 mb-6">
              {preps?.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 text-xs flex items-center justify-center font-bold">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={handleStart}
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Play size={16} fill="currentColor" />
              开始执行
            </button>
          </div>
        )}

        {/* Phase 2: Steps */}
        {typeof currentStep === 'number' && currentStep >= 0 && (
          <div className="animate-slide-in">
            <div className="mb-6 min-h-[120px]">
              <div className="text-xs font-bold text-emerald-500 tracking-wider mb-2 uppercase">Step {currentStep + 1}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{steps[currentStep]?.title || '未命名步骤'}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{steps[currentStep]?.desc || '暂无描述'}</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handlePrev}
                className="w-12 h-12 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={handleNext}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                {currentStep === steps.length - 1 ? '完成' : '下一步'}
                {currentStep !== steps.length - 1 && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: Finished */}
        {currentStep === 'finished' && (
          <div className="text-center py-8 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">已完成</h3>
            <p className="text-gray-500 text-sm mb-8">宝宝现在一定感觉很舒服</p>
            <button 
              onClick={handleReview}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-full text-sm transition-colors"
            >
              回顾步骤
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
