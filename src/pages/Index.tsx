
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Search, Grid, List, Filter, LogOut, User, FolderPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import FileUploadZone from '../components/FileUploadZone';
import FileGallery from '../components/FileGallery';
import SmartSearch, { SearchFilters } from '../components/SmartSearch';
import { performSmartSearch, DigitalAsset } from '../utils/searchUtils';
import { FolderBreadcrumb } from '../components/FolderBreadcrumb';
import { CreateFolderModal } from '../components/CreateFolderModal';
import { FolderCard } from '../components/FolderCard';
import { Folder } from '@/types/folder';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<DigitalAsset[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    tags: [],
    fileTypes: [],
    sortBy: 'relevance',
    sortOrder: 'desc'
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);

  // Load user's assets and folders when they sign in
  useEffect(() => {
    const loadData = async () => {
      console.log('Loading data, user:', user);
      
      if (!user) {
        console.log('No user, clearing data');
        setAssets([]);
        setFolders([]);
        setFilteredAssets([]);
        return;
      }

      console.log('User ID:', user.id);
      console.log('Current folder:', currentFolder);

      // Load assets
      let assetsQuery = supabase
        .from('digital_assets')
        .select('*')
        .eq('user_id', user.id);
      
      // Handle null folder_id correctly
      if (currentFolder?.id) {
        assetsQuery = assetsQuery.eq('folder_id', currentFolder.id);
      } else {
        assetsQuery = assetsQuery.is('folder_id', null);
      }
      
      const { data: assetsData, error: assetsError } = await assetsQuery
        .order('created_at', { ascending: false });

      if (assetsError) {
        console.error('Error loading assets:', assetsError);
      } else {
        const loadedAssets: DigitalAsset[] = assetsData.map(asset => ({
          id: asset.id,
          name: asset.name,
          type: asset.type as 'image' | 'video',
          size: asset.size,
          url: asset.url,
          thumbnail: asset.thumbnail,
          uploadDate: new Date(asset.upload_date),
          tags: asset.tags || [],
          description: asset.description || '',
          viewCount: asset.view_count || 0,
          lastViewed: asset.last_viewed ? new Date(asset.last_viewed) : undefined,
          lastModified: new Date(asset.last_modified || asset.updated_at),
          metadata: typeof asset.metadata === 'object' && asset.metadata !== null ?
            asset.metadata as { width?: number; height?: number; duration?: number; format: string } :
            { format: 'unknown' },
          exifData: typeof asset.exif_data === 'object' && asset.exif_data !== null ?
            asset.exif_data as any : undefined,
          aiDescription: asset.ai_description || undefined,
          aiObjects: asset.ai_objects || undefined,
          aiTextContent: asset.ai_text_content || undefined,
        }));

        setAssets(loadedAssets);
        setFilteredAssets(loadedAssets);
      }

      // Load folders in current directory
      console.log('Loading folders for user:', user.id, 'parent folder:', currentFolder?.id || null);
      
      let foldersQuery = supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id);
      
      // Handle null parent_folder_id correctly
      if (currentFolder?.id) {
        foldersQuery = foldersQuery.eq('parent_folder_id', currentFolder.id);
      } else {
        foldersQuery = foldersQuery.is('parent_folder_id', null);
      }
      
      const { data: foldersData, error: foldersError } = await foldersQuery
        .order('name', { ascending: true });

      console.log('Folders query result:', { foldersData, foldersError });

      if (foldersError) {
        console.error('Error loading folders:', foldersError);
      } else {
        console.log('Loaded folders:', foldersData);
        console.log('Current user ID:', user.id);
        const loadedFolders: Folder[] = foldersData.map(folder => ({
          id: folder.id,
          name: folder.name,
          user_id: folder.user_id,
          parent_folder_id: folder.parent_folder_id,
          created_at: new Date(folder.created_at),
          updated_at: new Date(folder.updated_at),
        }));

        setFolders(loadedFolders);
      }
    };

    loadData();
  }, [user, currentFolder]);

  const handleFilesUploaded = (newAssets: DigitalAsset[]) => {
    const updatedAssets = [...assets, ...newAssets];
    setAssets(updatedAssets);
    setFilteredAssets(updatedAssets);
  };

  const handleAssetView = async (assetId: string) => {
    if (!user) return;
    
    try {
      await supabase.rpc('increment_view_count', { asset_id: assetId });
      
      // Update local state
      setAssets(prev => prev.map(asset => 
        asset.id === assetId 
          ? { 
              ...asset, 
              viewCount: asset.viewCount + 1, 
              lastViewed: new Date() 
            }
          : asset
      ));
      
      setFilteredAssets(prev => prev.map(asset => 
        asset.id === assetId 
          ? { 
              ...asset, 
              viewCount: asset.viewCount + 1, 
              lastViewed: new Date() 
            }
          : asset
      ));
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleNavigateToFolder = async (folderId: string | null) => {
    if (!user) return;
    
    if (folderId === null) {
      // Navigate to root
      setCurrentFolder(null);
      setFolderPath([]);
      return;
    }

    // Load folder data
    const { data: folderData, error } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading folder:', error);
      return;
    }

    const folder: Folder = {
      id: folderData.id,
      name: folderData.name,
      user_id: folderData.user_id,
      parent_folder_id: folderData.parent_folder_id,
      created_at: new Date(folderData.created_at),
      updated_at: new Date(folderData.updated_at),
    };

    setCurrentFolder(folder);

    // Build folder path
    const buildPath = async (folder: Folder): Promise<Folder[]> => {
      const path: Folder[] = [folder];
      let currentParent = folder.parent_folder_id;

      while (currentParent) {
        const { data: parentData, error: parentError } = await supabase
          .from('folders')
          .select('*')
          .eq('id', currentParent)
          .eq('user_id', user.id)
          .single();

        if (parentError || !parentData) break;

        const parentFolder: Folder = {
          id: parentData.id,
          name: parentData.name,
          user_id: parentData.user_id,
          parent_folder_id: parentData.parent_folder_id,
          created_at: new Date(parentData.created_at),
          updated_at: new Date(parentData.updated_at),
        };

        path.unshift(parentFolder);
        currentParent = parentFolder.parent_folder_id;
      }

      return path.slice(0, -1); // Remove current folder from path
    };

    const path = await buildPath(folder);
    setFolderPath(path);
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder deleted successfully.",
      });

      // Refresh folders
      setFolders(folders.filter(f => f.id !== folderId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete folder.",
        variant: "destructive",
      });
    }
  };

  const handleRenameFolder = async (folderId: string, currentName: string) => {
    if (!user) return;
    const newName = prompt('Enter new folder name:', currentName);
    if (!newName || newName.trim() === currentName) return;

    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: newName.trim() })
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder renamed successfully.",
      });

      // Update local state
      setFolders(folders.map(f => 
        f.id === folderId ? { ...f, name: newName.trim() } : f
      ));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to rename folder.",
        variant: "destructive",
      });
    }
  };

  const handleFolderCreated = () => {
    // Force reload by creating a new timestamp
    const loadData = async () => {
      if (!user) return;

      // Load folders in current directory with proper null handling
      let foldersQuery = supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id);
      
      if (currentFolder?.id) {
        foldersQuery = foldersQuery.eq('parent_folder_id', currentFolder.id);
      } else {
        foldersQuery = foldersQuery.is('parent_folder_id', null);
      }
      
      const { data: foldersData, error: foldersError } = await foldersQuery
        .order('name', { ascending: true });

      if (foldersError) {
        console.error('Error loading folders:', foldersError);
      } else {
        console.log('Refreshed folders:', foldersData);
        const loadedFolders: Folder[] = foldersData.map(folder => ({
          id: folder.id,
          name: folder.name,
          user_id: folder.user_id,
          parent_folder_id: folder.parent_folder_id,
          created_at: new Date(folder.created_at),
          updated_at: new Date(folder.updated_at),
        }));

        setFolders(loadedFolders);
      }
    };

    loadData();
  };

  const handleAssetUpdated = (updatedAsset: DigitalAsset) => {
    setAssets(prev => prev.map(asset => 
      asset.id === updatedAsset.id ? updatedAsset : asset
    ));
    setFilteredAssets(prev => prev.map(asset => 
      asset.id === updatedAsset.id ? updatedAsset : asset
    ));
  };

  const handleAssetDeleted = (assetId: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== assetId));
    setFilteredAssets(prev => prev.filter(asset => asset.id !== assetId));
  };

  const handleSmartSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    const filtered = performSmartSearch(assets, filters);
    setFilteredAssets(filtered);
  };

  const allTags = [...new Set(assets.flatMap(asset => asset.tags))];

  // Show loading state while authentication is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-slate-600">Loading your assets...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AssetHub</h1>
          <p className="text-slate-600 mb-6">AI-Powered Digital Asset Management</p>
          <p className="text-slate-600 mb-4">Please sign in to access your digital assets and see the enhanced metadata.</p>
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

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
            <SmartSearch 
              onSearch={handleSmartSearch}
              searchFilters={searchFilters}
              availableTags={allTags}
            />

            <div className="bg-card rounded-xl p-6 shadow-sm border">
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
            <div className="flex items-center justify-between">
              <FolderBreadcrumb
                currentFolder={currentFolder}
                folderPath={folderPath}
                onNavigateToFolder={handleNavigateToFolder}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateFolderModal(true)}
                className="text-slate-600 hover:text-slate-900"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </div>

            <FileUploadZone 
              onFilesUploaded={handleFilesUploaded}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
              currentFolderId={currentFolder?.id || null}
            />

            {/* Folders Grid */}
            {folders.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4">Folders ({folders.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onOpen={handleNavigateToFolder}
                      onDelete={handleDeleteFolder}
                      onRename={handleRenameFolder}
                    />
                  ))}
                </div>
              </div>
            )}

            
            <FileGallery 
              assets={filteredAssets}
              viewMode={viewMode}
              onAssetUpdated={handleAssetUpdated}
              onAssetDeleted={handleAssetDeleted}
              onAssetView={handleAssetView}
            />
          </div>
        </div>
      </div>

      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        parentFolderId={currentFolder?.id || null}
        onFolderCreated={handleFolderCreated}
      />
    </div>
  );
};

export default Index;
