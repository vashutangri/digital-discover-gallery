
import { useState } from 'react';
import { Calendar, Tag, Image as ImageIcon, Video, Eye, Download, MoreHorizontal } from 'lucide-react';
import { DigitalAsset } from '../pages/Index';
import FilePreviewModal from './FilePreviewModal';
import { FileActions } from './FileActions';

interface FileGalleryProps {
  assets: DigitalAsset[];
  viewMode: 'grid' | 'list';
  onAssetUpdated: (updatedAsset: DigitalAsset) => void;
  onAssetDeleted: (assetId: string) => void;
}

const FileGallery = ({ assets, viewMode, onAssetUpdated, onAssetDeleted }: FileGalleryProps) => {
  const [selectedAsset, setSelectedAsset] = useState<DigitalAsset | null>(null);

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
      month: 'short',
      day: 'numeric'
    });
  };

  if (assets.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No assets yet</h3>
        <p className="text-slate-600">Upload some images or videos to get started with AI-powered content analysis.</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-900">Assets ({assets.length})</h2>
          </div>
          
          <div className="divide-y divide-slate-200">
            {assets.map(asset => (
              <div key={asset.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={asset.thumbnail}
                      alt={asset.name}
                      className="w-16 h-16 object-cover rounded-lg bg-slate-100"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {asset.type === 'video' ? (
                        <Video className="h-4 w-4 text-purple-600" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-blue-600" />
                      )}
                      <h3 className="font-medium text-slate-900 truncate">{asset.name}</h3>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-2">{asset.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span>{formatFileSize(asset.size)}</span>
                      <span>{formatDate(asset.uploadDate)}</span>
                      {asset.metadata.width && asset.metadata.height && (
                        <span>{asset.metadata.width} × {asset.metadata.height}</span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {asset.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {asset.tags.length > 3 && (
                        <span className="text-xs text-slate-500">+{asset.tags.length - 3} more</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedAsset(asset)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <FileActions 
                      asset={asset} 
                      onAssetUpdated={onAssetUpdated}
                      onAssetDeleted={onAssetDeleted}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedAsset && (
          <FilePreviewModal
            asset={selectedAsset}
            onClose={() => setSelectedAsset(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {assets.map(asset => (
          <div
            key={asset.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.02] group"
          >
            <div className="relative aspect-square bg-slate-100">
              <img
                src={asset.thumbnail}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
              
              <div className="absolute top-2 left-2">
                {asset.type === 'video' ? (
                  <div className="bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1">
                    <Video className="h-3 w-3" />
                    <span>Video</span>
                  </div>
                ) : (
                  <div className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1">
                    <ImageIcon className="h-3 w-3" />
                    <span>Image</span>
                  </div>
                )}
              </div>
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setSelectedAsset(asset)}
                  className="bg-white/90 backdrop-blur-sm text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-white transition-colors flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-medium text-slate-900 mb-2 truncate">{asset.name}</h3>
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{asset.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {asset.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {asset.tags.length > 2 && (
                  <span className="text-xs text-slate-500 px-2 py-1">+{asset.tags.length - 2}</span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-slate-500 space-x-2">
                  <span>{formatFileSize(asset.size)}</span>
                  <span>{formatDate(asset.uploadDate)}</span>
                </div>
                <FileActions 
                  asset={asset} 
                  onAssetUpdated={onAssetUpdated}
                  onAssetDeleted={onAssetDeleted}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedAsset && (
        <FilePreviewModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </>
  );
};

export default FileGallery;
