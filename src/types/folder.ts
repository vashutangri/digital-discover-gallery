export interface Folder {
  id: string;
  name: string;
  user_id: string;
  parent_folder_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface FolderWithAssets extends Folder {
  assets: any[];
  subfolders: Folder[];
}