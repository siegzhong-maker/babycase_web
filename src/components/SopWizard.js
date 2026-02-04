"use client";

import { useState, useEffect } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Play, ClipboardList } from 'lucide-react';

export default function SopWizard({ data }) {
  const [currentStep, setCurrentStep] = useState(-1); // -1: Prep, 0..N: Steps, 'finished': Done

  useEffect(() => {
    setCurrentStep(-1);
  }, [data]);

  if (!data || !Array.isArray(data.steps) || data.steps.length === 0) return null;

  const { title, preps, steps } = data;

  const handleStart = () => setCurrentStep(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCurrentStep('finished');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      setCurrentStep(-1);
    }
  };

  const handleReview = () => setCurrentStep(0);

  const totalCards = 1 + steps.length; // prep + steps
  const activeIndex = currentStep === -1 ? 0 : currentStep + 1;

  return (
    <div className="my-4 space-y-3">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <ClipboardList size={16} className="text-emerald-600" />
          </div>
          <span className="font-semibold text-gray-800 text-sm">{title || '操作向导'}</span>
        </div>
        {currentStep !== 'finished' && (
          <span className="text-xs text-gray-400 font-medium">
            {currentStep === -1 ? '1' : activeIndex} / {totalCards}
          </span>
        )}
      </div>

      {/* 卡片区域 */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* Phase 1: 准备卡片 */}
        {currentStep === -1 && (
          <div className="p-5" key="prep">
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 mb-4">
              <span className="text-xs font-semibold text-amber-700">准备阶段</span>
            </div>
            <div className="space-y-3 mb-6">
              {preps?.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleStart}
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-emerald-200"
            >
              <Play size={18} fill="currentColor" />
              开始执行
            </button>
          </div>
        )}

        {/* Phase 2: 步骤卡片 - 一卡一步 */}
        {typeof currentStep === 'number' && currentStep >= 0 && (
          <div className="p-5" key={currentStep}>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white text-sm font-bold flex items-center justify-center">
                {currentStep + 1}
              </span>
              <h3 className="text-base font-bold text-gray-900">
                {steps[currentStep]?.title || '未命名步骤'}
              </h3>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 mb-6 min-h-[80px]">
              <p className="text-gray-600 text-sm leading-relaxed">
                {steps[currentStep]?.desc || '暂无描述'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrev}
                className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 active:scale-95 transition-all flex-shrink-0"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1 flex gap-1.5 justify-center">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentStep
                        ? 'w-5 bg-emerald-500'
                        : i < currentStep
                        ? 'w-1.5 bg-emerald-300'
                        : 'w-1.5 bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                className="flex-1 max-w-[140px] bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
              >
                {currentStep === steps.length - 1 ? '完成' : '下一步'}
                {currentStep !== steps.length - 1 && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: 完成卡片 */}
        {currentStep === 'finished' && (
          <div className="p-8 text-center" key="done">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">全部完成</h3>
            <p className="text-gray-500 text-sm mb-6">宝宝现在一定感觉很舒服～</p>
            <button
              onClick={handleReview}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-full text-sm transition-colors"
            >
              回顾步骤
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
