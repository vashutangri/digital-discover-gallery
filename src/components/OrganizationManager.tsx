import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square, Trash2, RotateCcw, Copy, Layers } from 'lucide-react';
import CollectionManager from './CollectionManager';
import DuplicateDetector from './DuplicateDetector';
import TrashBin from './TrashBin';
import BulkActions from './BulkActions';
import { Collection } from '@/types/collections';

interface OrganizationManagerProps {
  userId: string;
  isSelectionMode: boolean;
  selectedAssets: string[];
  onToggleSelectionMode: () => void;
  onClearSelection: () => void;
  onAssetsUpdated: () => void;
  availableFolders: Array<{ id: string; name: string }>;
  onCollectionSelect?: (collection: Collection) => void;
}

const OrganizationManager = ({ 
  userId, 
  isSelectionMode, 
  selectedAssets, 
  onToggleSelectionMode,
  onClearSelection,
  onAssetsUpdated,
  availableFolders,
  onCollectionSelect
}: OrganizationManagerProps) => {
  const [activeTab, setActiveTab] = useState('collections');

  return (
    <div className="space-y-6">
      {/* Selection Mode Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Organization & Management</h2>
        <div className="flex items-center gap-3">
          {selectedAssets.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              {selectedAssets.length} selected
            </Badge>
          )}
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            onClick={onToggleSelectionMode}
            className="flex items-center gap-2"
          >
            {isSelectionMode ? (
              <>
                <Square className="h-4 w-4" />
                Exit Selection
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4" />
                Select Mode
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedAssets.length > 0 && (
        <BulkActions
          selectedAssets={selectedAssets}
          onClearSelection={onClearSelection}
          onAssetsUpdated={onAssetsUpdated}
          availableFolders={availableFolders}
        />
      )}

      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="collections" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Collections
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Duplicates
          </TabsTrigger>
          <TabsTrigger value="trash" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Trash
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="mt-6">
          <CollectionManager 
            userId={userId} 
            onCollectionSelect={onCollectionSelect}
          />
        </TabsContent>

        <TabsContent value="duplicates" className="mt-6">
          <DuplicateDetector userId={userId} />
        </TabsContent>

        <TabsContent value="trash" className="mt-6">
          <TrashBin userId={userId} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
            <p>Detailed insights about your digital assets will be available here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationManager;