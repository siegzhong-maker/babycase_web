"use client";

export default function WorryWall({ tags, onTagClick, compact }) {
  if (!tags || tags.length === 0) return null;

  if (compact) {
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
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 my-4">
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
  );
}
