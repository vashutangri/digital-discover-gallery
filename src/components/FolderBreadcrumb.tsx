import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Folder } from '@/types/folder';

interface FolderBreadcrumbProps {
  currentFolder: Folder | null;
  folderPath: Folder[];
  onNavigateToFolder: (folderId: string | null) => void;
}

export const FolderBreadcrumb = ({ 
  currentFolder, 
  folderPath, 
  onNavigateToFolder 
}: FolderBreadcrumbProps) => {
  return (
    <div className="flex items-center space-x-1 mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigateToFolder(null)}
        className="h-8 px-2"
      >
        <Home className="h-4 w-4" />
        <span className="ml-1">Root</span>
      </Button>
      
      {folderPath.map((folder) => (
        <div key={folder.id} className="flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToFolder(folder.id)}
            className="h-8 px-2"
          >
            {folder.name}
          </Button>
        </div>
      ))}
      
      {currentFolder && !folderPath.find(f => f.id === currentFolder.id) && (
        <div className="flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="px-2 py-1 text-sm font-medium">{currentFolder.name}</span>
        </div>
      )}
    </div>
  );
};