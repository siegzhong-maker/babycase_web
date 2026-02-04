"use client";

export default function WorryWall({ tags, onTagClick }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 my-4">
      <h3 className="text-xs font-medium text-gray-500 mb-3 ml-1">大家都在问：</h3>
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
