
import { X, Download, Tag, Calendar, HardDrive, Image as ImageIcon, Video, Eye, Camera, Aperture, Clock, Globe } from 'lucide-react';
import { DigitalAsset } from '../pages/Index';

interface FilePreviewModalProps {
  asset: DigitalAsset;
  onClose: () => void;
  onAssetView?: (assetId: string) => void;
}

const FilePreviewModal = ({ asset, onClose, onAssetView }: FilePreviewModalProps) => {
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
          <div className="w-full lg:w-96 p-6 border-l border-slate-200 overflow-y-auto">
            <div className="space-y-6">
              {/* File Details Header */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 text-lg">File Details</h3>
              </div>

              {/* Basic File Information */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">File Name:</span>
                    <span className="font-medium text-right break-all">{asset.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Image Location:</span>
                    <span className="font-medium text-right">Home &gt; Assets &gt; {asset.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Size:</span>
                    <span className="font-medium">{formatFileSize(asset.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Added to AssetHub:</span>
                    <span className="font-medium">{formatDate(asset.uploadDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Last Modified:</span>
                    <span className="font-medium">{formatDate(asset.lastModified)}</span>
                  </div>
                </div>
              </div>

              {/* View Statistics */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3 flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>View Statistics</span>
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">View count:</span>
                    <span className="font-medium">{asset.viewCount}</span>
                  </div>
                  {asset.lastViewed && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Last viewed:</span>
                      <span className="font-medium">{formatDate(asset.lastViewed)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* EXIF Data for Images */}
              {asset.type === 'image' && asset.exifData && Object.keys(asset.exifData).length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center space-x-2">
                    <Camera className="h-4 w-4" />
                    <span>EXIF Data</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    {asset.exifData.dateTaken && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Date taken:</span>
                        <span className="font-medium">{asset.exifData.dateTaken}</span>
                      </div>
                    )}
                    {asset.metadata.width && asset.metadata.height && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Width x Height:</span>
                        <span className="font-medium">{asset.metadata.width} x {asset.metadata.height}</span>
                      </div>
                    )}
                    {asset.exifData.cameraMaker && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Camera maker:</span>
                        <span className="font-medium">{asset.exifData.cameraMaker}</span>
                      </div>
                    )}
                    {asset.exifData.cameraModel && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Camera model:</span>
                        <span className="font-medium">{asset.exifData.cameraModel}</span>
                      </div>
                    )}
                    {asset.exifData.fNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">F-Number:</span>
                        <span className="font-medium">f/{asset.exifData.fNumber}</span>
                      </div>
                    )}
                    {asset.exifData.iso && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">ISO:</span>
                        <span className="font-medium">{asset.exifData.iso}</span>
                      </div>
                    )}
                    {asset.exifData.exposureTime && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Exposure:</span>
                        <span className="font-medium">{asset.exifData.exposureTime}</span>
                      </div>
                    )}
                    {asset.exifData.aperture && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Aperture:</span>
                        <span className="font-medium">{asset.exifData.aperture}</span>
                      </div>
                    )}
                    {asset.exifData.flashFired !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Flash fired:</span>
                        <span className="font-medium">{asset.exifData.flashFired ? 'yes' : 'no'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Video Duration for Videos */}
              {asset.type === 'video' && asset.metadata.duration && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center space-x-2">
                    <Video className="h-4 w-4" />
                    <span>Video Details</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Duration:</span>
                      <span className="font-medium">
                        {Math.floor(asset.metadata.duration / 60)}:
                        {String(Math.floor(asset.metadata.duration % 60)).padStart(2, '0')}
                      </span>
                    </div>
                    {asset.metadata.width && asset.metadata.height && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Resolution:</span>
                        <span className="font-medium">{asset.metadata.width} × {asset.metadata.height}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {asset.description && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Description</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">{asset.description}</p>
                </div>
              )}

              {/* Tags */}
              {asset.tags && asset.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span>Tags</span>
                  </h4>
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
              )}

              {/* AI-Generated Description */}
              {asset.aiDescription && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>AI-Generated Description</span>
                  </h4>
                  <p className="text-slate-700 text-sm leading-relaxed">{asset.aiDescription}</p>
                </div>
              )}

              {/* AI-Recognized Objects */}
              {asset.aiObjects && asset.aiObjects.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">AI-Recognized Objects</h4>
                  <div className="flex flex-wrap gap-1">
                    {asset.aiObjects.map((object, index) => (
                      <span
                        key={index}
                        className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs"
                      >
                        {object}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI-Recognized Text (OCR) */}
              {asset.aiTextContent && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Recognized Text (OCR)</h4>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-slate-700 text-sm font-mono leading-relaxed whitespace-pre-wrap">
                      {asset.aiTextContent}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
