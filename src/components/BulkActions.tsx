import { useState } from 'react';
import { Trash2, Tag, FolderInput, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BulkActionsProps {
  selectedAssets: string[];
  onClearSelection: () => void;
  onAssetsUpdated: () => void;
  availableFolders: Array<{ id: string; name: string }>;
}

const BulkActions = ({ selectedAssets, onClearSelection, onAssetsUpdated, availableFolders }: BulkActionsProps) => {
  const [isTagging, setIsTagging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [newTags, setNewTags] = useState('');
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (selectedAssets.length === 0) return null;

  const handleBulkTag = async () => {
    if (!newTags.trim()) return;
    
    setIsLoading(true);
    try {
      const tags = newTags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      // Get current tags for each asset and merge with new tags
      const { data: assets } = await supabase
        .from('digital_assets')
        .select('id, tags')
        .in('id', selectedAssets);

      if (assets) {
        // Update each asset individually
        for (const asset of assets) {
          const updatedTags = [...new Set([...(asset.tags || []), ...tags])];
          
          const { error } = await supabase
            .from('digital_assets')
            .update({ tags: updatedTags })
            .eq('id', asset.id);

          if (error) throw error;
        }

        toast({
          title: "Success",
          description: `Added tags to ${selectedAssets.length} assets`,
        });

        onAssetsUpdated();
        onClearSelection();
        setNewTags('');
        setIsTagging(false);
      }
    } catch (error) {
      console.error('Error adding tags:', error);
      toast({
        title: "Error",
        description: "Failed to add tags to assets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkMove = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('digital_assets')
        .update({ folder_id: targetFolderId })
        .in('id', selectedAssets);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Moved ${selectedAssets.length} assets`,
      });

      onAssetsUpdated();
      onClearSelection();
      setTargetFolderId(null);
      setIsMoving(false);
    } catch (error) {
      console.error('Error moving assets:', error);
      toast({
        title: "Error",
        description: "Failed to move assets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('digital_assets')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', selectedAssets);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Moved ${selectedAssets.length} assets to trash`,
      });

      onAssetsUpdated();
      onClearSelection();
    } catch (error) {
      console.error('Error deleting assets:', error);
      toast({
        title: "Error",
        description: "Failed to delete assets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-card border rounded-lg shadow-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-medium">
              {selectedAssets.length} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Tag */}
            <Dialog open={isTagging} onOpenChange={setIsTagging}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-1.5" />
                  Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Tags to {selectedAssets.length} Assets</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="work, project, important"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsTagging(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkTag} disabled={isLoading || !newTags.trim()}>
                      {isLoading ? 'Adding...' : 'Add Tags'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Bulk Move */}
            <Dialog open={isMoving} onOpenChange={setIsMoving}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderInput className="h-4 w-4 mr-1.5" />
                  Move
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Move {selectedAssets.length} Assets</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="folder">Target Folder</Label>
                    <Select onValueChange={setTargetFolderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="root">Root Folder</SelectItem>
                        {availableFolders.map(folder => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsMoving(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkMove} disabled={isLoading || !targetFolderId}>
                      {isLoading ? 'Moving...' : 'Move Assets'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Bulk Delete */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;