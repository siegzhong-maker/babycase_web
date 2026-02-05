"use client";

import { X } from "lucide-react";
import { calculateAge } from "@/utils/age";

const STORAGE_KEY = "douzhidao_baby_profile";

const DEFAULT_PROFILE = {
  name: "糯米",
  gender: "男孩",
  birth: "2024-11-20",
  stage_range: undefined,
  object: undefined,
};

export function loadProfile() {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PROFILE, ...parsed };
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
  if (!isOpen) return null;
  const ageStr = calculateAge(profile.birth);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const next = {
      name: form.name?.value?.trim() || profile.name,
      gender: profile.gender,
      birth: form.birth?.value || profile.birth,
      stage_range: profile.stage_range,
      object: profile.object,
    };
    onSave(next);
    onClose();
  };

  const setGender = (g) => onSave({ ...profile, gender: g });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">宝宝档案</h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">宝宝昵称</label>
            <input
              type="text"
              name="name"
              defaultValue={profile.name}
              placeholder="如：糯米"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGender("男孩")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  profile.gender === "男孩"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                男孩
              </button>
              <button
                type="button"
                onClick={() => setGender("女孩")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  profile.gender === "女孩"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                女孩
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
            <input
              type="date"
              name="birth"
              defaultValue={profile.birth}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            <p className="mt-1.5 text-sm text-emerald-600 font-medium">{ageStr}</p>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors active:scale-[0.98]"
          >
            保存档案
          </button>
        </form>
      </div>
    </div>
  );
}
