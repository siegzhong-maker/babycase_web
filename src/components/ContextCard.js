import { User, ChevronRight, Sparkles } from 'lucide-react';
import { calculateAge } from '@/utils/age';

export default function ContextCard({ profile, onClick }) {
  // Simple heuristic for "Cold Start" or "Unset Profile":
  // If name is default "糯米", no tags, and no inferred info.
  const isDefaultName = profile.name === "糯米";
  const hasTags = profile.tags && profile.tags.length > 0;
  const hasInferredInfo = !!profile.stage_range || !!profile.object;
  
  const isColdStart = isDefaultName && !hasTags && !hasInferredInfo;

  if (isColdStart) {
    return (
      <div 
        onClick={onClick}
        className="mx-4 mt-4 mb-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-3 shadow-md text-white flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold">完善宝宝档案</div>
            <div className="text-xs text-emerald-100">告诉兜兜宝宝情况，获取专属建议</div>
          </div>
        </div>
        <ChevronRight size={18} className="text-emerald-100" />
      </div>
    );
  }

  // Use stage_range (inferred) if available, otherwise calculate from birth
  const ageDisplay = profile.stage_range || calculateAge(profile.birth);
  const tagsStr = profile.tags?.join(" | ");

  return (
    <div 
      onClick={onClick}
      className="mx-4 mt-2 mb-2 bg-white border border-emerald-100 rounded-xl p-3 shadow-sm flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 transition-colors"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-600">
          <User size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800 truncate">{profile.name}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md flex-shrink-0">{ageDisplay}</span>
          </div>
          {hasTags ? (
            <div className="text-xs text-emerald-600 mt-0.5 truncate font-medium">
              {tagsStr}
            </div>
          ) : (
            <div className="text-xs text-gray-400 mt-0.5 truncate">
              点击添加特别关注标签...
            </div>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-300 flex-shrink-0 ml-2" />
    </div>
  );
}
