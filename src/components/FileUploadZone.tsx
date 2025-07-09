
import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, Video, FileText, Loader } from 'lucide-react';
import { DigitalAsset } from '../pages/Index';
import { analyzeImageContent } from '../utils/aiAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FileUploadZoneProps {
  onFilesUploaded: (assets: DigitalAsset[]) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  currentFolderId: string | null;
}

const FileUploadZone = ({ onFilesUploaded, isAnalyzing, setIsAnalyzing, currentFolderId }: FileUploadZoneProps) => {
  const { user } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFiles = async (files: FileList, preserveFolderStructure = false) => {
    if (!user) {
      alert('Please sign in to upload files');
      return;
    }

    const fileArray = Array.from(files);
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    const validFiles = fileArray.filter(file => supportedTypes.includes(file.type));

    if (validFiles.length === 0) {
      alert('Please select supported image or video files (JPEG, PNG, WebP, GIF, MP4, WebM)');
      return;
    }

    setIsAnalyzing(true);
    const newAssets: DigitalAsset[] = [];
    const folderCache = new Map<string, string>(); // path -> folder_id

    // Helper function to create folders from path
    const createFoldersFromPath = async (filePath: string) => {
      const pathParts = filePath.split('/').slice(0, -1); // Remove filename
      if (pathParts.length === 0) return currentFolderId;

      let currentParentId = currentFolderId;
      let currentPath = '';

      for (const folderName of pathParts) {
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
        
        if (folderCache.has(currentPath)) {
          currentParentId = folderCache.get(currentPath)!;
          continue;
        }

        // Create folder
        const { data: folderData, error: folderError } = await supabase
          .from('folders')
          .insert({
            name: folderName,
            user_id: user.id,
            parent_folder_id: currentParentId,
          })
          .select()
          .single();

        if (folderError) {
          console.error('Error creating folder:', folderError);
          return currentFolderId;
        }

        folderCache.set(currentPath, folderData.id);
        currentParentId = folderData.id;
      }

      return currentParentId;
    };

    for (const file of validFiles) {
      const fileId = crypto.randomUUID();
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        const isVideo = file.type.startsWith('video/');
        
        // Determine target folder based on file path
        let targetFolderId = currentFolderId;
        if (preserveFolderStructure && (file as any).webkitRelativePath) {
          targetFolderId = await createFoldersFromPath((file as any).webkitRelativePath);
        }
        
        // Upload file to Supabase storage
        const fileName = `${user.id}/${fileId}-${file.name}`;
        setUploadProgress(prev => ({ ...prev, [fileId]: 20 }));
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('digital-assets')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        setUploadProgress(prev => ({ ...prev, [fileId]: 60 }));

        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('digital-assets')
          .getPublicUrl(fileName);

        let tags: string[] = [];
        let description = '';
        let metadata = {
          format: file.type,
          width: undefined as number | undefined,
          height: undefined as number | undefined,
          duration: undefined as number | undefined,
        };

        // Create object URL for analysis
        const tempUrl = URL.createObjectURL(file);

        if (!isVideo) {
          // Analyze image content with AI
          try {
            const analysis = await analyzeImageContent(tempUrl);
            tags = analysis.tags;
            description = analysis.description;
          } catch (error) {
            console.error('AI analysis failed:', error);
            tags = ['image'];
            description = 'Image file';
          }

          // Get image dimensions
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = () => {
              metadata.width = img.width;
              metadata.height = img.height;
              resolve(true);
            };
            img.src = tempUrl;
          });
        } else {
          // Basic video handling
          tags = ['video'];
          description = 'Video file';
          
          // Get video metadata
          const video = document.createElement('video');
          await new Promise((resolve) => {
            video.onloadedmetadata = () => {
              metadata.width = video.videoWidth;
              metadata.height = video.videoHeight;
              metadata.duration = video.duration;
              resolve(true);
            };
            video.src = tempUrl;
          });
        }

        // Clean up temporary URL
        URL.revokeObjectURL(tempUrl);

        setUploadProgress(prev => ({ ...prev, [fileId]: 80 }));

        // Save asset metadata to database
        const { data: assetData, error: dbError } = await supabase
          .from('digital_assets')
          .insert({
            id: fileId,
            user_id: user.id,
            name: file.name,
            type: isVideo ? 'video' : 'image',
            size: file.size,
            url: publicUrl,
            thumbnail: publicUrl,
            folder_id: targetFolderId,
            tags,
            description,
            metadata,
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          continue;
        }

        const asset: DigitalAsset = {
          id: assetData.id,
          name: assetData.name,
          type: assetData.type as 'image' | 'video',
          size: assetData.size,
          url: assetData.url,
          thumbnail: assetData.thumbnail,
          uploadDate: new Date(assetData.upload_date),
          tags: assetData.tags || [],
          description: assetData.description || '',
          metadata: typeof assetData.metadata === 'object' && assetData.metadata !== null ? 
            assetData.metadata as { width?: number; height?: number; duration?: number; format: string } : 
            { format: file.type },
        };

        newAssets.push(asset);
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }

    setIsAnalyzing(false);
    setUploadProgress({});
    onFilesUploaded(newAssets);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFiles(files);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const preserveFolderStructure = e.target.hasAttribute('webkitdirectory');
      await processFiles(files, preserveFolderStructure);
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(files, true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors">
      <div
        className={`p-8 text-center transition-all duration-200 ${
          isDragOver ? 'bg-blue-50 border-blue-400' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isAnalyzing ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Loader className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Analyzing Content...
              </h3>
              <p className="text-slate-600">
                AI is processing your files to extract content information
              </p>
            </div>
            
            {Object.entries(uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-teal-100 rounded-full flex items-center justify-center mx-auto">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Upload Your Media Files
              </h3>
              <p className="text-slate-600 mb-4">
                Drag and drop your images and videos here, or click to browse
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-slate-500">
                <div className="flex items-center space-x-1">
                  <ImageIcon className="h-4 w-4" />
                  <span>Images</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Video className="h-4 w-4" />
                  <span>Videos</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <label className="inline-block">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 transition-all cursor-pointer inline-block">
                  Choose Files
                </div>
              </label>
              
              <label className="inline-block">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  {...({ webkitdirectory: "" } as any)}
                  onChange={handleFolderSelect}
                  className="hidden"
                />
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all cursor-pointer inline-block">
                  Upload Folder
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadZone;
