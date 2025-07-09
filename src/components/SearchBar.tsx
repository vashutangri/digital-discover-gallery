
import { useState } from 'react';
import { Search, X, Tag } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, tags: string[]) => void;
  searchQuery: string;
  selectedTags: string[];
}

const SearchBar = ({ onSearch, searchQuery, selectedTags }: SearchBarProps) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery, selectedTags);
  };

  const clearSearch = () => {
    setLocalQuery('');
    onSearch('', selectedTags);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
        <Search className="h-5 w-5" />
        <span>Search Assets</span>
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search by name, tags, or content..."
            className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {localQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Search
        </button>
      </form>

      {selectedTags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <Tag className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-600">Active Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
              >
                <span>{tag}</span>
                <button
                  onClick={() => onSearch(searchQuery, selectedTags.filter(t => t !== tag))}
                  className="hover:bg-blue-200 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
