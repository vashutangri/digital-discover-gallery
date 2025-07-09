
import { useCallback, useState } from 'react';
import { Upload, Image, Video, FileText, Loader } from 'lucide-react';
import { DigitalAsset } from '../pages/Index';
import { analyzeImageContent } from '../utils/aiAnalysis';

interface FileUploadZoneProps {
  onFilesUploaded: (assets: DigitalAsset[]) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
}

const FileUploadZone = ({ onFilesUploaded, isAnalyzing, setIsAnalyzing }: FileUploadZoneProps) => {
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

  const processFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    const validFiles = fileArray.filter(file => supportedTypes.includes(file.type));

    if (validFiles.length === 0) {
      alert('Please select supported image or video files (JPEG, PNG, WebP, GIF, MP4, WebM)');
      return;
    }

    setIsAnalyzing(true);
    const newAssets: DigitalAsset[] = [];

    for (const file of validFiles) {
      const fileId = Math.random().toString(36).substr(2, 9);
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        // Create object URL for preview
        const url = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video/');
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        let tags: string[] = [];
        let description = '';
        let metadata = {
          format: file.type,
          width: undefined as number | undefined,
          height: undefined as number | undefined,
          duration: undefined as number | undefined,
        };

        if (!isVideo) {
          // Analyze image content with AI
          try {
            const analysis = await analyzeImageContent(url);
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
            img.src = url;
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
            video.src = url;
          });
        }

        const asset: DigitalAsset = {
          id: fileId,
          name: file.name,
          type: isVideo ? 'video' : 'image',
          size: file.size,
          url,
          thumbnail: url,
          uploadDate: new Date(),
          tags,
          description,
          metadata,
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
      await processFiles(files);
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
                  <Image className="h-4 w-4" />
                  <span>Images</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Video className="h-4 w-4" />
                  <span>Videos</span>
                </div>
              </div>
            </div>
            
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
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadZone;
