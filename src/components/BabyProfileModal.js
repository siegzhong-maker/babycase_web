"use client";

import { useState, useEffect } from "react";
import { X, Check, Baby, Calendar } from "lucide-react";
import { calculateAge, calculatePregnancyWeeks } from "@/utils/age";

const STORAGE_KEY = "douzhidao_baby_profile";

const DEFAULT_PROFILE = {
  name: "糯米",
  gender: "男孩",
  status: "born", // 'born' | 'pregnancy'
  birth: "2024-11-20",
  dueDate: "", 
  tags: [],
};

const TAG_OPTIONS = [
  "过敏体质", "早产宝宝", "混合喂养", 
  "纯母乳", "高需求宝宝", "二胎家庭", "新手爸妈"
];

export function loadProfile() {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { 
        ...DEFAULT_PROFILE, 
        ...parsed, 
        tags: parsed.tags || [],
        // Migration: if status missing but birth is future, set to pregnancy? 
        // For now just default to stored status or 'born'
        status: parsed.status || 'born' 
      };
    }
  } catch (e) {}
  return DEFAULT_PROFILE;
}

export function saveProfile(profile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {}
}

export default function BabyProfileModal({ isOpen, onClose, profile, onSave }) {
  // Sync internal state with props when modal opens
  const [localProfile, setLocalProfile] = useState(profile);

  useEffect(() => {
    if (isOpen) {
      setLocalProfile({
        ...DEFAULT_PROFILE,
        ...profile
      });
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const isPregnancy = localProfile.status === 'pregnancy';
  
  const ageDisplay = isPregnancy 
    ? calculatePregnancyWeeks(localProfile.dueDate) 
    : calculateAge(localProfile.birth);

  const toggleTag = (tag) => {
    const currentTags = localProfile.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    setLocalProfile({ ...localProfile, tags: newTags });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(localProfile);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-gray-800">家庭档案</h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Status Switch */}
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setLocalProfile({ ...localProfile, status: 'born' })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                !isPregnancy ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              宝宝已出生
            </button>
            <button
              type="button"
              onClick={() => setLocalProfile({ ...localProfile, status: 'pregnancy' })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                isPregnancy ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              怀孕中
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isPregnancy ? "给宝宝起的乳名 (可选)" : "宝宝昵称"}
            </label>
            <input
              type="text"
              value={localProfile.name}
              onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
              placeholder="如：糯米"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* Gender (Optional in pregnancy) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLocalProfile({ ...localProfile, gender: "男孩" })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  localProfile.gender === "男孩"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                男孩
              </button>
              <button
                type="button"
                onClick={() => setLocalProfile({ ...localProfile, gender: "女孩" })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  localProfile.gender === "女孩"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                女孩
              </button>
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isPregnancy ? "预产期" : "出生日期"}
            </label>
            <div className="relative">
              <input
                type="date"
                value={isPregnancy ? localProfile.dueDate : localProfile.birth}
                onChange={(e) => {
                   const val = e.target.value;
                   if (isPregnancy) {
                     setLocalProfile({ ...localProfile, dueDate: val });
                   } else {
                     setLocalProfile({ ...localProfile, birth: val });
                   }
                }}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              <Calendar className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={18} />
            </div>
            <p className="mt-2 text-sm text-emerald-600 font-medium bg-emerald-50 inline-block px-2 py-1 rounded-md">
              {isPregnancy ? "当前孕周：" : "当前月龄："}{ageDisplay}
            </p>
          </div>

          {/* Special Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              特别关注 <span className="text-xs text-gray-400 font-normal">(帮助兜兜更懂宝宝)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => {
                const isSelected = (localProfile.tags || []).includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors active:scale-[0.98] shadow-sm shadow-emerald-200"
          >
            保存档案
          </button>
        </form>
      </div>
    </div>
  );
}
