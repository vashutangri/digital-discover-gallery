import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Calendar, FileType, HardDrive, Clock, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface SmartSearchProps {
  onSearch: (filters: SearchFilters) => void;
  searchFilters: SearchFilters;
  availableTags: string[];
}

export interface SearchFilters {
  query: string;
  tags: string[];
  fileTypes: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  sizeRange?: {
    min?: number;
    max?: number;
  };
  sortBy: 'name' | 'date' | 'size' | 'views' | 'relevance';
  sortOrder: 'asc' | 'desc';
}

const FILE_TYPES = [
  { value: 'image', label: 'Images', icon: '🖼️' },
  { value: 'video', label: 'Videos', icon: '🎥' },
  { value: 'audio', label: 'Audio', icon: '🎵' },
  { value: 'document', label: 'Documents', icon: '📄' },
  { value: 'archive', label: 'Archives', icon: '📦' },
];

const SIZE_PRESETS = [
  { value: 'small', label: 'Small (< 1MB)', min: 0, max: 1024 * 1024 },
  { value: 'medium', label: 'Medium (1-10MB)', min: 1024 * 1024, max: 10 * 1024 * 1024 },
  { value: 'large', label: 'Large (> 10MB)', min: 10 * 1024 * 1024, max: undefined },
];

const SmartSearch = ({ onSearch, searchFilters, availableTags }: SmartSearchProps) => {
  const [localQuery, setLocalQuery] = useState(searchFilters.query);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  useEffect(() => {
    if (localQuery.length > 1) {
      const filtered = availableTags
        .filter(tag => tag.toLowerCase().includes(localQuery.toLowerCase()))
        .slice(0, 5);
      setSuggestions([...filtered, ...searchHistory.filter(h => 
        h.toLowerCase().includes(localQuery.toLowerCase()) && !filtered.includes(h)
      )].slice(0, 8));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [localQuery, availableTags, searchHistory]);

  const handleSearch = () => {
    if (localQuery && !searchHistory.includes(localQuery)) {
      const newHistory = [localQuery, ...searchHistory.slice(0, 9)];
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }

    onSearch({
      ...searchFilters,
      query: localQuery,
    });
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalQuery(suggestion);
    setShowSuggestions(false);
    onSearch({
      ...searchFilters,
      query: suggestion,
    });
  };

  const clearSearch = () => {
    setLocalQuery('');
    onSearch({
      ...searchFilters,
      query: '',
    });
  };

  const toggleFileType = (fileType: string) => {
    const newTypes = searchFilters.fileTypes.includes(fileType)
      ? searchFilters.fileTypes.filter(t => t !== fileType)
      : [...searchFilters.fileTypes, fileType];
    
    onSearch({
      ...searchFilters,
      fileTypes: newTypes,
    });
  };

  const toggleTag = (tag: string) => {
    const newTags = searchFilters.tags.includes(tag)
      ? searchFilters.tags.filter(t => t !== tag)
      : [...searchFilters.tags, tag];
    
    onSearch({
      ...searchFilters,
      tags: newTags,
    });
  };

  const setSizePreset = (preset: string) => {
    const range = SIZE_PRESETS.find(p => p.value === preset);
    if (range) {
      onSearch({
        ...searchFilters,
        sizeRange: { min: range.min, max: range.max },
      });
    }
  };

  const hasActiveFilters = searchFilters.fileTypes.length > 0 || 
    searchFilters.tags.length > 0 || 
    searchFilters.dateRange?.from || 
    searchFilters.sizeRange?.min !== undefined;

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Smart Search</span>
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`transition-colors ${hasActiveFilters ? 'text-primary hover:text-primary/80' : 'text-muted-foreground'}`}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1.5 h-4 w-4 p-0 text-xs rounded-full">
                {[...searchFilters.fileTypes, ...searchFilters.tags].length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => localQuery.length > 1 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search by name, tags, content... (use quotes for exact match)"
            className="pl-10 pr-20 h-10"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {localQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button onClick={handleSearch} size="sm" className="h-8 px-3">
              Search
            </Button>
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors"
              >
                <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="px-4 pb-4 space-y-4 border-t bg-muted/10">
          <div className="pt-4">
            {/* File Types */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileType className="h-4 w-4 text-muted-foreground" />
                File Types
              </label>
              <div className="flex flex-wrap gap-2">
                {FILE_TYPES.map(type => (
                  <Button
                    key={type.value}
                    variant={searchFilters.fileTypes.includes(type.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFileType(type.value)}
                    className="h-8 text-xs"
                  >
                    <span className="mr-1.5">{type.icon}</span>
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {availableTags.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Popular Tags</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {availableTags.slice(0, 15).map(tag => (
                    <Button
                      key={tag}
                      variant={searchFilters.tags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTag(tag)}
                      className="h-7 text-xs"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Date Range and Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Upload Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs">
                      {searchFilters.dateRange?.from ? (
                        searchFilters.dateRange.to ? (
                          `${searchFilters.dateRange.from.toLocaleDateString()} - ${searchFilters.dateRange.to.toLocaleDateString()}`
                        ) : (
                          `From ${searchFilters.dateRange.from.toLocaleDateString()}`
                        )
                      ) : (
                        'Any date'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="range"
                      selected={searchFilters.dateRange ? { 
                        from: searchFilters.dateRange.from, 
                        to: searchFilters.dateRange.to 
                      } : undefined}
                      onSelect={(range) => onSearch({ ...searchFilters, dateRange: range || undefined })}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Size Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  File Size
                </label>
                <Select onValueChange={setSizePreset}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Any size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any size</SelectItem>
                    {SIZE_PRESETS.map(preset => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sort By</label>
                <Select 
                  value={searchFilters.sortBy}
                  onValueChange={(value: any) => onSearch({ ...searchFilters, sortBy: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="date">Upload Date</SelectItem>
                    <SelectItem value="size">File Size</SelectItem>
                    <SelectItem value="views">View Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Order</label>
                <Select 
                  value={searchFilters.sortOrder}
                  onValueChange={(value: any) => onSearch({ ...searchFilters, sortOrder: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="px-4 pb-4 border-t bg-muted/10">
          <div className="pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Active Filters</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearch({ 
                  query: localQuery, 
                  tags: [], 
                  fileTypes: [], 
                  sortBy: 'relevance', 
                  sortOrder: 'desc' 
                })}
                className="h-6 text-xs hover:text-destructive"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchFilters.fileTypes.map(type => (
                <Badge key={type} variant="secondary" className="flex items-center gap-1 pr-1">
                  <span className="text-xs">{FILE_TYPES.find(t => t.value === type)?.label}</span>
                  <button 
                    onClick={() => toggleFileType(type)}
                    className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
              {searchFilters.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1">
                  <span className="text-xs">{tag}</span>
                  <button 
                    onClick={() => toggleTag(tag)}
                    className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearch;