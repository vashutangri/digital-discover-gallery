import { Folder as FolderIcon, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Folder } from '@/types/folder';

interface FolderCardProps {
  folder: Folder;
  onOpen: (folderId: string) => void;
  onDelete: (folderId: string) => void;
  onRename: (folderId: string, currentName: string) => void;
}

export const FolderCard = ({ folder, onOpen, onDelete, onRename }: FolderCardProps) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent opening folder when clicking dropdown
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]')) {
      return;
    }
    onOpen(folder.id);
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white border-slate-200">
      <CardContent className="p-4" onClick={handleCardClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 truncate">{folder.name}</h3>
              <p className="text-sm text-slate-600">
                {new Date(folder.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-dropdown-trigger>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-slate-200">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onRename(folder.id, folder.name);
                }}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(folder.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};