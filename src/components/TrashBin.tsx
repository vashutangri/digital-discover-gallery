import { useState, useEffect } from 'react';
import { Trash2, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeletedAsset {
  id: string;
  name: string;
  thumbnail: string;
  size: number;
  deleted_at: string;
  type: string;
}

interface TrashBinProps {
  userId: string;
}

const TrashBin = ({ userId }: TrashBinProps) => {
  const [deletedAssets, setDeletedAssets] = useState<DeletedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadDeletedAssets();
  }, [userId]);

  const loadDeletedAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('digital_assets')
        .select('id, name, thumbnail, size, deleted_at, type')
        .eq('user_id', userId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setDeletedAssets(data || []);
    } catch (error) {
      console.error('Error loading deleted assets:', error);
      toast({
        title: "Error",
        description: "Failed to load deleted assets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const restoreAsset = async (assetId: string) => {
    try {
      const { error } = await supabase
        .from('digital_assets')
        .update({ deleted_at: null })
        .eq('id', assetId);

      if (error) throw error;

      setDeletedAssets(prev => prev.filter(asset => asset.id !== assetId));
      toast({
        title: "Success",
        description: "Asset restored successfully",
      });
    } catch (error) {
      console.error('Error restoring asset:', error);
      toast({
        title: "Error",
        description: "Failed to restore asset",
        variant: "destructive",
      });
    }
  };

  const permanentlyDeleteAsset = async (assetId: string) => {
    try {
      // Delete from storage first
      const asset = deletedAssets.find(a => a.id === assetId);
      if (asset) {
        // Extract file path from URL
        const urlParts = asset.thumbnail.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        await supabase.storage
          .from('digital-assets')
          .remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('digital_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      setDeletedAssets(prev => prev.filter(asset => asset.id !== assetId));
      toast({
        title: "Success",
        description: "Asset permanently deleted",
      });
    } catch (error) {
      console.error('Error permanently deleting asset:', error);
      toast({
        title: "Error",
        description: "Failed to permanently delete asset",
        variant: "destructive",
      });
    }
  };

  const emptyTrash = async () => {
    try {
      // Delete all files from storage
      const fileNames = deletedAssets.map(asset => {
        const urlParts = asset.thumbnail.split('/');
        return urlParts[urlParts.length - 1];
      });

      if (fileNames.length > 0) {
        await supabase.storage
          .from('digital-assets')
          .remove(fileNames);
      }

      // Delete all from database
      const { error } = await supabase
        .from('digital_assets')
        .delete()
        .eq('user_id', userId)
        .not('deleted_at', 'is', null);

      if (error) throw error;

      setDeletedAssets([]);
      toast({
        title: "Success",
        description: "Trash emptied successfully",
      });
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast({
        title: "Error",
        description: "Failed to empty trash",
        variant: "destructive",
      });
    }
  };

  const restoreSelected = async () => {
    try {
      const { error } = await supabase
        .from('digital_assets')
        .update({ deleted_at: null })
        .in('id', selectedAssets);

      if (error) throw error;

      setDeletedAssets(prev => prev.filter(asset => !selectedAssets.includes(asset.id)));
      setSelectedAssets([]);
      toast({
        title: "Success",
        description: `${selectedAssets.length} assets restored`,
      });
    } catch (error) {
      console.error('Error restoring assets:', error);
      toast({
        title: "Error",
        description: "Failed to restore assets",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading trash...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Trash ({deletedAssets.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Deleted assets are kept for 30 days before permanent deletion
          </p>
        </div>
        
        {deletedAssets.length > 0 && (
          <div className="flex gap-2">
            {selectedAssets.length > 0 && (
              <Button onClick={restoreSelected} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Restore Selected ({selectedAssets.length})
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Empty Trash
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Empty Trash</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {deletedAssets.length} assets in trash. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={emptyTrash} className="bg-destructive hover:bg-destructive/90">
                    Permanently Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {deletedAssets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Trash is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {deletedAssets.map(asset => (
            <Card 
              key={asset.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedAssets.includes(asset.id) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => toggleAssetSelection(asset.id)}
            >
              <CardHeader className="p-3">
                <div className="relative">
                  <img
                    src={asset.thumbnail}
                    alt={asset.name}
                    className="w-full h-32 object-cover rounded"
                  />
                  {selectedAssets.includes(asset.id) && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                      ✓
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-2">
                  <p className="font-medium text-sm truncate">{asset.name}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(asset.size)}</span>
                    <Badge variant="outline" className="text-xs">
                      {asset.type.split('/')[0]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deleted {new Date(asset.deleted_at).toLocaleDateString()}
                  </p>
                  
                  <div className="flex gap-1 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreAsset(asset.id);
                      }}
                      className="flex-1"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Permanently Delete</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{asset.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => permanentlyDeleteAsset(asset.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Permanently Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashBin;