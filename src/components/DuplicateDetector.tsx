import { useState, useEffect } from 'react';
import { Search, AlertTriangle, Trash2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DuplicateMatch } from '@/types/collections';

interface DigitalAsset {
  id: string;
  name: string;
  thumbnail: string;
  size: number;
  created_at: string;
}

interface DuplicateDetectorProps {
  userId: string;
}

const DuplicateDetector = ({ userId }: DuplicateDetectorProps) => {
  const [duplicates, setDuplicates] = useState<Array<DuplicateMatch & { 
    asset1: DigitalAsset; 
    asset2: DigitalAsset; 
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const scanForDuplicates = async () => {
    setIsScanning(true);
    try {
      // Call the duplicate detection function
      const { data: duplicateMatches, error } = await supabase
        .rpc('find_potential_duplicates', { target_user_id: userId });

      if (error) throw error;

      if (duplicateMatches && duplicateMatches.length > 0) {
        // Get asset details for all duplicate pairs
        const assetIds = new Set<string>();
        duplicateMatches.forEach(match => {
          assetIds.add(match.asset1_id);
          assetIds.add(match.asset2_id);
        });

        const { data: assets, error: assetsError } = await supabase
          .from('digital_assets')
          .select('id, name, thumbnail, size, created_at')
          .in('id', Array.from(assetIds));

        if (assetsError) throw assetsError;

        const assetMap = new Map(assets?.map(asset => [asset.id, asset]) || []);

        const duplicatesWithAssets = duplicateMatches
          .map(match => ({
            ...match,
            asset1: assetMap.get(match.asset1_id),
            asset2: assetMap.get(match.asset2_id),
            match_type: match.match_type as 'exact' | 'size_match' | 'name_similar'
          }))
          .filter(match => match.asset1 && match.asset2);

        setDuplicates(duplicatesWithAssets);
        
        toast({
          title: "Scan Complete",
          description: `Found ${duplicatesWithAssets.length} potential duplicate groups`,
        });
      } else {
        setDuplicates([]);
        toast({
          title: "Scan Complete",
          description: "No duplicates found",
        });
      }
    } catch (error) {
      console.error('Error scanning for duplicates:', error);
      toast({
        title: "Error",
        description: "Failed to scan for duplicates",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleKeepAsset = async (keepAssetId: string, deleteAssetId: string) => {
    try {
      // Soft delete the unwanted asset
      const { error } = await supabase
        .from('digital_assets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteAssetId);

      if (error) throw error;

      // Remove this duplicate pair from the list
      setDuplicates(prev => 
        prev.filter(dup => 
          !(dup.asset1_id === keepAssetId && dup.asset2_id === deleteAssetId) &&
          !(dup.asset1_id === deleteAssetId && dup.asset2_id === keepAssetId)
        )
      );

      toast({
        title: "Success",
        description: "Duplicate resolved",
      });
    } catch (error) {
      console.error('Error resolving duplicate:', error);
      toast({
        title: "Error",
        description: "Failed to resolve duplicate",
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

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'exact':
        return 'destructive' as const;
      case 'size_match':
        return 'secondary' as const;
      case 'name_similar':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'exact':
        return 'Exact Match';
      case 'size_match':
        return 'Same Size';
      case 'name_similar':
        return 'Similar Names';
      default:
        return 'Similar';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Duplicate Detection</h3>
          <p className="text-sm text-muted-foreground">
            Find and manage duplicate files in your library
          </p>
        </div>
        <Button 
          onClick={scanForDuplicates} 
          disabled={isScanning}
          className="flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          {isScanning ? 'Scanning...' : 'Scan for Duplicates'}
        </Button>
      </div>

      {duplicates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span className="font-medium">
              Found {duplicates.length} potential duplicate groups
            </span>
          </div>

          {duplicates.map((duplicate, index) => (
            <Card key={`${duplicate.asset1_id}-${duplicate.asset2_id}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Duplicate Group {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={getMatchTypeColor(duplicate.match_type)}>
                      {getMatchTypeLabel(duplicate.match_type)}
                    </Badge>
                    <Badge variant="outline">
                      {Math.round(duplicate.similarity_score * 100)}% match
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Asset 1 */}
                  <div className="space-y-3">
                    <img
                      src={duplicate.asset1.thumbnail}
                      alt={duplicate.asset1.name}
                      className="w-full h-32 object-cover rounded"
                    />
                    <div className="space-y-1">
                      <p className="font-medium text-sm truncate">
                        {duplicate.asset1.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(duplicate.asset1.size)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(duplicate.asset1.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleKeepAsset(duplicate.asset1.id, duplicate.asset2.id)}
                      className="w-full"
                    >
                      <Heart className="h-3 w-3 mr-1.5" />
                      Keep This
                    </Button>
                  </div>

                  {/* Asset 2 */}
                  <div className="space-y-3">
                    <img
                      src={duplicate.asset2.thumbnail}
                      alt={duplicate.asset2.name}
                      className="w-full h-32 object-cover rounded"
                    />
                    <div className="space-y-1">
                      <p className="font-medium text-sm truncate">
                        {duplicate.asset2.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(duplicate.asset2.size)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(duplicate.asset2.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleKeepAsset(duplicate.asset2.id, duplicate.asset1.id)}
                      className="w-full"
                    >
                      <Heart className="h-3 w-3 mr-1.5" />
                      Keep This
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isScanning && duplicates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Click "Scan for Duplicates" to find potential duplicate files</p>
        </div>
      )}
    </div>
  );
};

export default DuplicateDetector;