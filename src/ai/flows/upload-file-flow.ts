
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

// Temporarily change output to a string to return the raw response
const UploadFileOutputSchema = z.object({
  rawResponse: z.string(),
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
      // This part is fine, the token is present.
      throw new Error("Gofile API token is not configured on the server.");
    }
    
    const fileBuffer = Buffer.from(fileContent, 'base64');
    const boundary = `----WebKitFormBoundary${uuidv4().replace(/-/g, '')}`;
    
    const bodyParts: (string | Buffer)[] = [];
    bodyParts.push(`--${boundary}`);
    bodyParts.push(`Content-Disposition: form-data; name="file"; filename="${fileName}"`);
    bodyParts.push(`Content-Type: ${fileType}`);
    bodyParts.push('');
    bodyParts.push(fileBuffer);
    bodyParts.push(`--${boundary}--`);
    bodyParts.push('');

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
    
    const responseText = await response.text();

    // Instead of trying to parse it and crashing, just return the raw text.
    return { rawResponse: responseText };
  }
);
