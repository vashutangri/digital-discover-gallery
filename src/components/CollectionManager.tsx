import { useState, useEffect } from 'react';
import { Plus, Folder, Calendar, Brain, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Collection, SmartCollectionCriteria } from '@/types/collections';

interface CollectionManagerProps {
  userId: string;
  onCollectionSelect?: (collection: Collection) => void;
}

const CollectionManager = ({ userId, onCollectionSelect }: CollectionManagerProps) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    type: 'manual' as Collection['type']
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCollections();
  }, [userId]);

  const loadCollections = async () => {
    try {
      // Load collections with asset counts
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          collection_assets(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data as Collection[] || []);
    } catch (error) {
      console.error('Error loading collections:', error);
      toast({
        title: "Error",
        description: "Failed to load collections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createCollection = async () => {
    if (!newCollection.name.trim()) return;

    try {
      const collectionData = {
        user_id: userId,
        name: newCollection.name,
        description: newCollection.description,
        type: newCollection.type,
        criteria: newCollection.type === 'smart' ? {} : null
      };

      const { data, error } = await supabase
        .from('collections')
        .insert([collectionData])
        .select()
        .single();

      if (error) throw error;

      setCollections(prev => [data as Collection, ...prev]);
      setNewCollection({ name: '', description: '', type: 'manual' });
      setIsCreating(false);

      toast({
        title: "Success",
        description: `Collection "${data.name}" created`,
      });
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: "Error",
        description: "Failed to create collection",
        variant: "destructive",
      });
    }
  };

  const deleteCollection = async (collectionId: string) => {
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;

      setCollections(prev => prev.filter(c => c.id !== collectionId));
      toast({
        title: "Success",
        description: "Collection deleted",
      });
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast({
        title: "Error",
        description: "Failed to delete collection",
        variant: "destructive",
      });
    }
  };

  const generateSmartCollections = async () => {
    try {
      // Generate date-based collections
      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

      const smartCollections = [
        {
          name: "This Month",
          description: "Assets uploaded this month",
          type: 'date' as const,
          criteria: {
            dateRange: {
              start: thisMonth.toISOString(),
              end: today.toISOString()
            }
          }
        },
        {
          name: "Last Month",
          description: "Assets uploaded last month",
          type: 'date' as const,
          criteria: {
            dateRange: {
              start: lastMonth.toISOString(),
              end: thisMonth.toISOString()
            }
          }
        }
      ];

      for (const collection of smartCollections) {
        // Create collection
        const { data: newCollection, error: collectionError } = await supabase
          .from('collections')
          .insert([{
            user_id: userId,
            ...collection
          }])
          .select()
          .single();

        if (collectionError) throw collectionError;

        // Find and add matching assets to the collection
        if (collection.type === 'date' && collection.criteria?.dateRange) {
          const { data: matchingAssets, error: assetsError } = await supabase
            .from('digital_assets')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', collection.criteria.dateRange.start)
            .lt('created_at', collection.criteria.dateRange.end)
            .is('deleted_at', null);

          if (assetsError) throw assetsError;

          // Add assets to collection
          if (matchingAssets && matchingAssets.length > 0) {
            const collectionAssets = matchingAssets.map(asset => ({
              collection_id: newCollection.id,
              asset_id: asset.id
            }));

            const { error: insertError } = await supabase
              .from('collection_assets')
              .insert(collectionAssets);

            if (insertError) throw insertError;
          }
        }
      }

      await loadCollections();
      toast({
        title: "Success",
        description: "Smart collections generated with assets",
      });
    } catch (error) {
      console.error('Error generating smart collections:', error);
      toast({
        title: "Error",
        description: "Failed to generate smart collections",
        variant: "destructive",
      });
    }
  };

  const getCollectionIcon = (type: Collection['type']) => {
    switch (type) {
      case 'date':
        return <Calendar className="h-4 w-4" />;
      case 'ai':
        return <Brain className="h-4 w-4" />;
      case 'smart':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Folder className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Collections</h3>
        <div className="flex gap-2">
          <Button onClick={generateSmartCollections} variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-1.5" />
            Generate Smart
          </Button>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                New Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Collection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newCollection.name}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Collection name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCollection.description}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={newCollection.type} 
                    onValueChange={(value: Collection['type']) => 
                      setNewCollection(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="smart">Smart</SelectItem>
                      <SelectItem value="date">Date-based</SelectItem>
                      <SelectItem value="ai">AI-generated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createCollection} disabled={!newCollection.name.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading collections...</div>
      ) : collections.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No collections yet. Create your first collection to organize your assets.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(collection => (
            <Card 
              key={collection.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onCollectionSelect?.(collection)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    {getCollectionIcon(collection.type)}
                    <span className="truncate">{collection.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCollection(collection.id);
                    }}
                    className="h-6 w-6 p-0 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {collection.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {collection.type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {(collection as any).collection_assets?.[0]?.count || 0} assets
                    </Badge>
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

export default CollectionManager;