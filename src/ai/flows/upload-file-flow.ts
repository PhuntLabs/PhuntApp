'use server';
/**
 * @fileOverview A flow to handle uploading files to Gofile.
 * This acts as a secure proxy to keep the API key on the server.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

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

    const formData = new FormData();
    // Use the Buffer directly. The `fetch` implementation in Node.js can handle this.
    formData.append('file', new Blob([fileBuffer], { type: fileType }), fileName);

    const response = await fetch('https://upload.gofile.io/uploadFile', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gofile API Error:", response.status, errorText);
        throw new Error(`Gofile upload failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (result.status !== 'ok' || !result.data?.directLink) {
        console.error("Gofile API Error:", result);
        throw new Error(result.message || 'Gofile upload failed. The response structure might have changed.');
    }

    return { directLink: result.data.directLink };
  }
);
