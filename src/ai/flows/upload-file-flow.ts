
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

const GofileResponseSchema = z.object({
  status: z.string(),
  data: z.object({
    downloadPage: z.string(),
    code: z.string().optional(), // Marking as optional
    id: z.string(),
    name: z.string(),
    mimetype: z.string(),
    size: z.number(),
  }),
});

const UploadFileOutputSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  url: z.string(),
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

    try {
        const parsedJson = JSON.parse(responseText);
        const validatedData = GofileResponseSchema.parse(parsedJson);

        if (validatedData.status === 'ok') {
            return {
                name: validatedData.data.name,
                size: validatedData.data.size,
                type: validatedData.data.mimetype,
                url: validatedData.data.downloadPage,
            };
        } else {
            throw new Error(`Gofile API returned status: ${validatedData.status}`);
        }
    } catch (e: any) {
        console.error("Failed to parse Gofile response. Raw text:", responseText);
        throw new Error(`Failed to process Gofile response: ${e.message}`);
    }
  }
);
