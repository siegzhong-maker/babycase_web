"use client";

export default function WorryWall({ tags, onTagClick, compact, guidedPrompts, onGuidedClick }) {
  if (compact) {
    if (!tags || tags.length === 0) return null;
    return (
      <div className="px-4 pb-2">
        <div className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-2 px-1">
          <span>月嫂阿姨常被问</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onTagClick(tag)}
              className="whitespace-nowrap px-3 py-2 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 transition-all rounded-full text-xs font-medium text-gray-700 border border-transparent hover:border-emerald-100"
            >
              {tag.display_tag}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-4">
      {guidedPrompts && guidedPrompts.length > 0 && (
        <div className="bg-amber-50/80 rounded-2xl p-4 shadow-sm border border-amber-100">
          <h3 className="text-xs font-medium text-amber-800 mb-3 ml-1">不知道问啥？</h3>
          <div className="flex flex-col gap-2">
            {guidedPrompts.map((item, i) => (
              <button
                key={i}
                onClick={() => onGuidedClick && onGuidedClick(item)}
                className="text-left px-3 py-2.5 bg-white hover:bg-amber-50 rounded-xl text-sm font-medium text-gray-800 border border-amber-100 active:scale-[0.98] transition-all"
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}
      {(tags && tags.length > 0) && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-xs font-medium text-gray-500 mb-3 ml-1">月嫂阿姨常被问：</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onTagClick(tag)}
                className="px-3 py-2 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 transition-all rounded-full text-xs font-medium text-gray-700 border border-transparent hover:border-emerald-100"
              >
                {tag.display_tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
