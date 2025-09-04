import OpenAI from "openai";
import fs from "fs";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

export async function transcribeAudio(audioFilePath: string, originalFilename?: string): Promise<{ text: string, duration?: number }> {
  try {
    console.log(`Starting transcription for file: ${audioFilePath}`, originalFilename ? `original: ${originalFilename}` : '');
    
    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    const audioReadStream = fs.createReadStream(audioFilePath);
    
    // If we have original filename, create a File-like object with proper extension
    let fileInput: any = audioReadStream;
    if (originalFilename) {
      // Set the path property on the stream to help OpenAI detect format
      (audioReadStream as any).path = originalFilename;
    }

    const transcription = await openai.audio.transcriptions.create({
      file: fileInput,
      model: "whisper-1",
      response_format: "json"
    });

    console.log(`Transcription completed successfully`);
    return {
      text: transcription.text,
      duration: undefined, // Duration not available in basic response format
    };
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio: " + (error as Error).message);
  }
}

export async function generateSummary(transcriptionText: string): Promise<{
  summary: string;
  keywords: string[];
}> {
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert content summarizer. Analyze the provided transcript and create a concise summary highlighting the key points, themes, and insights. Also extract important keywords and topics. Respond with JSON in this format: { 'summary': string, 'keywords': string[] }",
        },
        {
          role: "user",
          content: `Please summarize this audio transcript and extract key topics:\n\n${transcriptionText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      summary: result.summary || "Summary could not be generated",
      keywords: Array.isArray(result.keywords) ? result.keywords : [],
    };
  } catch (error) {
    console.error("Summary generation error:", error);
    throw new Error("Failed to generate summary: " + (error as Error).message);
  }
}

export async function extractKeyPoints(transcriptionText: string): Promise<string[]> {
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting key points from content. Analyze the transcript and identify the most important points, insights, and takeaways. Return as a JSON array of strings with each key point being concise but meaningful. Respond with JSON in this format: { 'keyPoints': string[] }",
        },
        {
          role: "user",
          content: `Extract the key points from this transcript:\n\n${transcriptionText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return Array.isArray(result.keyPoints) ? result.keyPoints : [];
  } catch (error) {
    console.error("Key points extraction error:", error);
    throw new Error("Failed to extract key points: " + (error as Error).message);
  }
}
