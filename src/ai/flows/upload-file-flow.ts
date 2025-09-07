'use server';
/**
 * @fileOverview A flow to handle uploading files to Gofile.
 * This acts as a secure proxy to keep the API key on the server.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const UploadFileInputSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileContent: z.string().describe("The base64-encoded content of the file."),
});
export type UploadFileInput = z.infer<typeof UploadFileInputSchema>;

const UploadFileOutputSchema = z.object({
  directLink: z.string().url(),
});
export type UploadFileOutput = z.infer<typeof UploadFileOutputSchema>;


export async function uploadFile(input: UploadFileInput): Promise<UploadFileOutput> {
  return uploadFileFlow(input);
}


const uploadFileFlow = ai.defineFlow(
  {
    name: 'uploadFileFlow',
    inputSchema: UploadFileInputSchema,
    outputSchema: UploadFileOutputSchema,
  },
  async ({ fileName, fileType, fileContent }) => {
    const apiToken = process.env.NEXT_PUBLIC_GOFILE_API_TOKEN;
    if (!apiToken) {
      throw new Error("Gofile API token is not configured on the server.");
    }
    
    // Convert base64 back to a Buffer
    const fileBuffer = Buffer.from(fileContent, 'base64');
    
    // Manually construct the multipart/form-data payload
    const boundary = `----WebKitFormBoundary${uuidv4().replace(/-/g, '')}`;
    
    const bodyParts: (string | Buffer)[] = [];
    bodyParts.push(`--${boundary}`);
    bodyParts.push(`Content-Disposition: form-data; name="file"; filename="${fileName}"`);
    bodyParts.push(`Content-Type: ${fileType}`);
    bodyParts.push('');
    bodyParts.push(fileBuffer);
    bodyParts.push(`--${boundary}--`);
    bodyParts.push('');

    // Combine parts into a single buffer
    const body = bodyParts.reduce((acc, part) => {
        const bufferPart = (typeof part === 'string') ? Buffer.from(part + '\r\n', 'utf-8') : Buffer.concat([part, Buffer.from('\r\n')]);
        return Buffer.concat([acc, bufferPart]);
    }, Buffer.alloc(0));
    
    const response = await fetch('https://upload.gofile.io/uploadFile', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gofile API Error:", response.status, errorText);
        throw new Error(`Gofile upload failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (result.status !== 'ok' || !result.data?.directLink) {
        console.error("Gofile API Error - Unexpected Response Structure:", result);
        throw new Error(result.message || 'Gofile upload failed. The response from their server was not in the expected format.');
    }

    return { directLink: result.data.directLink };
  }
);
