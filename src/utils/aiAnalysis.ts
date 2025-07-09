
import { pipeline } from '@huggingface/transformers';

let imageClassifier: any = null;

export interface AnalysisResult {
  tags: string[];
  description: string;
}

export const analyzeImageContent = async (imageUrl: string): Promise<AnalysisResult> => {
  try {
    console.log('Starting AI analysis for image:', imageUrl);
    
    // Initialize the classifier if not already done
    if (!imageClassifier) {
      console.log('Loading AI model...');
      imageClassifier = await pipeline(
        'image-classification',
        'microsoft/resnet-50',
        { device: 'webgpu' }
      );
      console.log('AI model loaded successfully');
    }

    // Perform image classification
    const results = await imageClassifier(imageUrl);
    console.log('AI analysis results:', results);

    // Extract top predictions
    const topResults = results.slice(0, 5);
    const tags = topResults
      .filter((result: any) => result.score > 0.1) // Filter out low-confidence results
      .map((result: any) => result.label.toLowerCase().replace(/_/g, ' '))
      .slice(0, 8); // Limit to 8 tags

    // Generate a description based on the top result
    const topResult = topResults[0];
    const description = topResult 
      ? `This image appears to contain ${topResult.label.toLowerCase().replace(/_/g, ' ')} with ${Math.round(topResult.score * 100)}% confidence.`
      : 'Image content analyzed';

    return {
      tags: tags.length > 0 ? tags : ['image'],
      description
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    
    // Fallback to basic analysis
    return {
      tags: ['image', 'uploaded'],
      description: 'Image file uploaded successfully'
    };
  }
};
