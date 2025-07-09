
import { pipeline } from '@huggingface/transformers';

let objectDetector: any = null;

export interface AnalysisResult {
  tags: string[];
  description: string;
}

export const analyzeImageContent = async (imageUrl: string): Promise<AnalysisResult> => {
  try {
    console.log('Starting AI analysis for image:', imageUrl);
    
    // Initialize the object detector if not already done
    if (!objectDetector) {
      console.log('Loading object detection model...');
      objectDetector = await pipeline(
        'object-detection',
        'Xenova/detr-resnet-50',
        { device: 'webgpu' }
      );
      console.log('Object detection model loaded successfully');
    }

    // Perform object detection
    const results = await objectDetector(imageUrl);
    console.log('Object detection results:', results);

    // Extract detected objects with confidence > 0.3
    const detectedObjects = results
      .filter((result: any) => result.score > 0.3)
      .map((result: any) => result.label.toLowerCase().replace(/_/g, ' '));

    // Get unique tags and limit to 15 for more comprehensive tagging
    const uniqueTags = [...new Set(detectedObjects as string[])].slice(0, 15);

    // Generate a detailed description
    const description = uniqueTags.length > 0 
      ? `This image contains: ${uniqueTags.join(', ')}. Detected ${results.length} objects total.`
      : 'Image analyzed - no specific objects detected with high confidence';

    return {
      tags: uniqueTags.length > 0 ? uniqueTags : ['image'],
      description
    };
  } catch (error) {
    console.error('Object detection failed, falling back to image classification:', error);
    
    // Fallback to image classification if object detection fails
    try {
      if (!objectDetector) {
        objectDetector = await pipeline(
          'image-classification',
          'microsoft/resnet-50',
          { device: 'webgpu' }
        );
      }

      const results = await objectDetector(imageUrl);
      const topResults = results.slice(0, 8);
      const tags = topResults
        .filter((result: any) => result.score > 0.1)
        .map((result: any) => result.label.toLowerCase().replace(/_/g, ' '));

      return {
        tags: tags.length > 0 ? tags : ['image'],
        description: 'Image classified using fallback method'
      };
    } catch (fallbackError) {
      console.error('All AI analysis methods failed:', fallbackError);
      
      return {
        tags: ['image', 'uploaded'],
        description: 'Image file uploaded successfully'
      };
    }
  }
};
