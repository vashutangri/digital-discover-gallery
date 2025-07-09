
import { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterPanelProps {
  availableTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const FilterPanel = ({ availableTags, selectedTags, onTagsChange }: FilterPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newTags);
  };

  if (availableTags.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="font-semibold text-slate-900 flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>Filter by Tags</span>
        </h3>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-600" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {availableTags.map(tag => (
            <label
              key={tag}
              className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded-md"
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => toggleTag(tag)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 capitalize">{tag}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
