
import { X, Download, Tag, Calendar, HardDrive, Image as ImageIcon, Video } from 'lucide-react';
import { DigitalAsset } from '../pages/Index';

interface FilePreviewModalProps {
  asset: DigitalAsset;
  onClose: () => void;
}

const FilePreviewModal = ({ asset, onClose }: FilePreviewModalProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            {asset.type === 'video' ? (
              <Video className="h-6 w-6 text-purple-600" />
            ) : (
              <ImageIcon className="h-6 w-6 text-blue-600" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{asset.name}</h2>
              <p className="text-sm text-slate-600">{asset.metadata.format}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
          {/* Preview */}
          <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
            {asset.type === 'video' ? (
              <video
                src={asset.url}
                controls
                className="max-w-full max-h-full rounded-lg shadow-lg"
              />
            ) : (
              <img
                src={asset.url}
                alt={asset.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            )}
          </div>

          {/* Details */}
          <div className="w-full lg:w-80 p-6 border-l border-slate-200 overflow-y-auto">
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{asset.description}</p>
              </div>

              {/* Tags */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <span>Tags</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* File Info */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">File Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-600">Size:</span>
                    <span className="font-medium">{formatFileSize(asset.size)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-600">Uploaded:</span>
                    <span className="font-medium">{formatDate(asset.uploadDate)}</span>
                  </div>
                  
                  {asset.metadata.width && asset.metadata.height && (
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">Dimensions:</span>
                      <span className="font-medium">
                        {asset.metadata.width} × {asset.metadata.height}
                      </span>
                    </div>
                  )}
                  
                  {asset.metadata.duration && (
                    <div className="flex items-center space-x-2">
                      <Video className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">Duration:</span>
                      <span className="font-medium">
                        {Math.floor(asset.metadata.duration / 60)}:
                        {String(Math.floor(asset.metadata.duration % 60)).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
