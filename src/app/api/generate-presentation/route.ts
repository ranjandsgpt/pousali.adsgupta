import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  PRESENTATION_GENERATION_PROMPT,
  PRESENTATION_GENERATION_USER_PREFIX,
} from '@/lib/geminiPromptRegistry';
import { logGeminiResponse } from '@/lib/geminiResponseLogger';

/**
 * Mode 3 — Presentation Generation.
 * Input: raw report files + optional normalized summary.
 * Output: Python code only. No JSON, no markdown, no explanation.
 * Backend may execute the script (e.g. in a sandbox) and store generated files;
 * for now this route returns the generated script and logs the response.
 */

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function getMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
  return 'text/csv';
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured', script: null },
      { status: 503 }
    );
  }

  const contentType = request.headers.get('content-type') || '';
  let payload: { summary?: string; fileNames?: string[] } = {};
  const rawFiles: { blob: Blob; name: string }[] = [];

  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      const payloadStr = formData.get('payload') as string | null;
      if (payloadStr) payload = JSON.parse(payloadStr) as { summary?: string; fileNames?: string[] };
      const files = formData.getAll('files') as (Blob | File)[];
      for (const f of files) {
        if (f != null && typeof (f as Blob).arrayBuffer === 'function') {
          const name = f instanceof File ? f.name : 'report.csv';
          rawFiles.push({ blob: f as Blob, name });
        }
      }
    } catch {
      return NextResponse.json({ error: 'Invalid multipart/form-data', script: null }, { status: 400 });
    }
  } else {
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body', script: null }, { status: 400 });
    }
  }

  const fileNames = rawFiles.length > 0 ? rawFiles.map((f) => f.name).join(', ') : payload.fileNames?.join(', ') ?? 'none';
  const userText = `${PRESENTATION_GENERATION_USER_PREFIX}${fileNames}.\n\n${payload.summary ?? 'No summary provided.'}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    let parts: { text?: string; fileData?: { fileUri?: string; mimeType?: string } }[] = [];

    if (rawFiles.length > 0) {
      for (const { blob, name } of rawFiles) {
        const mimeType = getMimeType(name);
        const file = await ai.files.upload({
          file: blob as globalThis.Blob,
          config: { mimeType },
        });
        parts.push({ fileData: { fileUri: (file as { name?: string }).name, mimeType } });
      }
      parts.push({ text: userText });
    } else {
      parts = [{ text: userText }];
    }

    const fileParts = parts.filter((x) => x.fileData?.fileUri);
    const result = await ai.models.generateContent({
      model,
      config: { systemInstruction: PRESENTATION_GENERATION_PROMPT },
      contents: [
        {
          role: 'user',
          parts:
            fileParts.length > 0
              ? ([...fileParts.map((x) => ({ fileData: x.fileData })), { text: userText }] as const)
              : [{ text: userText }],
        },
      ],
    });

    const text =
      result.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? '')
        .join('\n')
        .trim() || '';

    await logGeminiResponse({
      mode: 'presentation',
      rawResponse: text.slice(0, 8000),
      outcome: text ? 'python_script' : 'empty',
    });

    if (!text) {
      return NextResponse.json({ script: null, error: 'No response from model' }, { status: 200 });
    }

    let script = text;
    const codeBlockMatch = text.match(/```(?:python)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      script = codeBlockMatch[1].trim();
    }

    return NextResponse.json({ script, executed: false }, { status: 200 });
  } catch (e) {
    console.error('generate-presentation error', e);
    return NextResponse.json(
      { script: null, error: e instanceof Error ? e.message : 'Generation failed' },
      { status: 200 }
    );
  }
}
