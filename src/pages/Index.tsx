
import { useState, useEffect } from 'react';
import { Upload, Search, Grid, List, Filter, LogOut, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import FileUploadZone from '../components/FileUploadZone';
import FileGallery from '../components/FileGallery';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';

export interface DigitalAsset {
  id: string;
  name: string;
  type: 'image' | 'video';
  size: number;
  url: string;
  thumbnail: string;
  uploadDate: Date;
  tags: string[];
  description: string;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    format: string;
  };
}

const Index = () => {
  const { user, signOut } = useAuth();
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<DigitalAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load user's assets when they sign in
  useEffect(() => {
    const loadAssets = async () => {
      if (!user) {
        setAssets([]);
        setFilteredAssets([]);
        return;
      }

      const { data, error } = await supabase
        .from('digital_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading assets:', error);
        return;
      }

      const loadedAssets: DigitalAsset[] = data.map(asset => ({
        id: asset.id,
        name: asset.name,
        type: asset.type as 'image' | 'video',
        size: asset.size,
        url: asset.url,
        thumbnail: asset.thumbnail,
        uploadDate: new Date(asset.upload_date),
        tags: asset.tags || [],
        description: asset.description || '',
        metadata: typeof asset.metadata === 'object' && asset.metadata !== null ?
          asset.metadata as { width?: number; height?: number; duration?: number; format: string } :
          { format: 'unknown' },
      }));

      setAssets(loadedAssets);
      setFilteredAssets(loadedAssets);
    };

    loadAssets();
  }, [user]);

  const handleFilesUploaded = (newAssets: DigitalAsset[]) => {
    const updatedAssets = [...assets, ...newAssets];
    setAssets(updatedAssets);
    setFilteredAssets(updatedAssets);
  };

  const handleSearch = (query: string, tags: string[]) => {
    setSearchQuery(query);
    setSelectedTags(tags);
    
    let filtered = assets;
    
    if (query) {
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(query.toLowerCase()) ||
        asset.description.toLowerCase().includes(query.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    if (tags.length > 0) {
      filtered = filtered.filter(asset =>
        tags.every(tag => asset.tags.includes(tag))
      );
    }
    
    setFilteredAssets(filtered);
  };

  const allTags = [...new Set(assets.flatMap(asset => asset.tags))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">AssetHub</h1>
                <p className="text-sm text-slate-600">AI-Powered Digital Asset Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <SearchBar 
              onSearch={handleSearch}
              searchQuery={searchQuery}
              selectedTags={selectedTags}
            />
            
            <FilterPanel 
              availableTags={allTags}
              selectedTags={selectedTags}
              onTagsChange={(tags) => handleSearch(searchQuery, tags)}
            />

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Assets</span>
                  <span className="font-medium">{assets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Images</span>
                  <span className="font-medium">
                    {assets.filter(a => a.type === 'image').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Videos</span>
                  <span className="font-medium">
                    {assets.filter(a => a.type === 'video').length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <FileUploadZone 
              onFilesUploaded={handleFilesUploaded}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />
            
            <FileGallery 
              assets={filteredAssets}
              viewMode={viewMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
