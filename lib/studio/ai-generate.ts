import "server-only";

import OpenAI from "openai";
import { logger } from "@/lib/logging";

/* ------------------------------------------------------------------ */
/*  OpenAI client (lazy singleton)                                     */
/* ------------------------------------------------------------------ */

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

/* ------------------------------------------------------------------ */
/*  1. Office – Generate Document Content from AI Prompt               */
/* ------------------------------------------------------------------ */

export type GeneratedDocument = {
  title: string;
  sections: Array<{ heading: string; body: string }>;
  summary: string;
};

const CATEGORY_PROMPTS: Record<string, string> = {
  document:
    "You are a professional document writer. Create a well-structured document with clear sections, headings, and professional language.",
  spreadsheet:
    "You are a data analyst. Create a structured data report with clear headers, key metrics, analysis sections, and recommendations.",
  presentation:
    "You are a presentation designer. Create slide content with a compelling narrative, clear headlines, concise bullet points, and speaker notes.",
  invoice:
    "You are a financial document specialist. Create a professional invoice template with line items, terms, and proper formatting.",
  report:
    "You are a business report writer. Create a comprehensive report with executive summary, findings, analysis, and recommendations.",
};

export async function generateDocumentContent(
  prompt: string,
  category: string,
  title: string
): Promise<GeneratedDocument> {
  const openai = getOpenAI();
  const systemPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.document;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `${systemPrompt}

IMPORTANT: Return ONLY valid JSON in exactly this format (no markdown, no code blocks):
{
  "title": "Document Title",
  "sections": [
    { "heading": "Section Heading", "body": "Section content..." }
  ],
  "summary": "Brief one-line summary of the document"
}

Create 3-6 sections with rich, professional content. Each body should be 2-4 paragraphs.`,
      },
      {
        role: "user",
        content: `Title: "${title}"\nCategory: ${category}\n\nUser Request: ${prompt}`,
      },
    ],
    max_tokens: 2000,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(raw) as GeneratedDocument;
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error("Invalid document structure");
    }
    return parsed;
  } catch (err) {
    logger.error("Failed to parse AI document response", { error: err, raw });
    return {
      title,
      sections: [{ heading: "Generated Content", body: raw }],
      summary: "AI-generated content",
    };
  }
}

/* ------------------------------------------------------------------ */
/*  2. Graph – Generate Image with DALL-E 3                            */
/* ------------------------------------------------------------------ */

export type GeneratedImage = {
  image_url: string;
  revised_prompt: string;
};

export async function generateImage(
  prompt: string,
  style: string,
  width: number,
  height: number
): Promise<GeneratedImage> {
  const openai = getOpenAI();

  // Map dimensions to DALL-E supported sizes
  const size = mapToDalleSize(width, height);

  const styleMap: Record<string, string> = {
    "photo-realistic": "photorealistic, ultra-detailed, professional photography",
    illustration: "digital illustration, vibrant colors, artistic style",
    "3d-render": "3D rendered, cinema 4D style, octane render, realistic lighting",
    watercolor: "watercolor painting style, soft edges, artistic blending",
    "pixel-art": "pixel art style, retro gaming aesthetic, 8-bit",
    abstract: "abstract art, geometric shapes, modern art style",
    "flat-design": "flat design, minimal, clean vector illustration",
    anime: "anime art style, Japanese animation, vibrant",
    logo: "professional logo design, clean, minimal, brand identity",
    icon: "app icon design, clean, flat, modern UI icon",
  };

  const styledPrompt = `${prompt}. Style: ${styleMap[style] || style}`;

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: styledPrompt,
    n: 1,
    size,
    quality: "standard",
    response_format: "url",
  });

  const imageData = response.data?.[0];
  return {
    image_url: imageData?.url ?? "",
    revised_prompt: imageData?.revised_prompt ?? prompt,
  };
}

function mapToDalleSize(
  width: number,
  height: number
): "1024x1024" | "1024x1792" | "1792x1024" {
  const ratio = width / height;
  if (ratio > 1.3) return "1792x1024"; // landscape
  if (ratio < 0.77) return "1024x1792"; // portrait
  return "1024x1024"; // square
}

/* ------------------------------------------------------------------ */
/*  3. Graph – Generate Chart Config from AI                           */
/* ------------------------------------------------------------------ */

export type GeneratedChart = {
  chart_type: string;
  config_json: Record<string, unknown>;
  data_json: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
    }>;
  };
};

export async function generateChartFromPrompt(
  prompt: string,
  chartType?: string
): Promise<GeneratedChart> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a data visualization expert. Generate chart data based on the user's request.

Return ONLY valid JSON in this exact format:
{
  "chart_type": "bar" | "line" | "pie" | "area" | "radar" | "scatter",
  "config_json": {
    "title": "Chart Title",
    "x_axis": "X Axis Label",
    "y_axis": "Y Axis Label",
    "show_legend": true,
    "show_grid": true,
    "animation": true
  },
  "data_json": {
    "labels": ["Label1", "Label2", ...],
    "datasets": [
      {
        "label": "Dataset Label",
        "data": [10, 20, ...],
        "backgroundColor": ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"],
        "borderColor": "#8b5cf6"
      }
    ]
  }
}

Generate realistic-looking sample data (6-12 data points). Use professional color palettes.${chartType ? `\nPreferred chart type: ${chartType}` : ""}`,
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 1000,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(raw) as GeneratedChart;
    return parsed;
  } catch (err) {
    logger.error("Failed to parse AI chart response", { error: err });
    return {
      chart_type: chartType || "bar",
      config_json: { title: "Chart", show_legend: true, show_grid: true },
      data_json: {
        labels: ["Q1", "Q2", "Q3", "Q4"],
        datasets: [
          {
            label: "Data",
            data: [30, 50, 40, 60],
            backgroundColor: ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"],
            borderColor: "#8b5cf6",
          },
        ],
      },
    };
  }
}

/* ------------------------------------------------------------------ */
/*  4. Tracks – Generate Video Storyboard with AI                      */
/* ------------------------------------------------------------------ */

export type GeneratedVideoMeta = {
  storyboard: Array<{
    scene: number;
    description: string;
    duration_seconds: number;
    visual_notes: string;
  }>;
  script: string;
  music_suggestion: string;
};

export async function generateVideoStoryboard(
  prompt: string,
  style: string,
  durationSeconds: number
): Promise<GeneratedVideoMeta> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a professional video production assistant. Create a detailed video storyboard and script.

Return ONLY valid JSON:
{
  "storyboard": [
    { "scene": 1, "description": "...", "duration_seconds": 5, "visual_notes": "..." }
  ],
  "script": "Full narration script...",
  "music_suggestion": "Suggested background music style and tempo"
}

Create 3-8 scenes that fit within the total duration. Be specific and visual in descriptions.`,
      },
      {
        role: "user",
        content: `Create a ${style} video storyboard (total: ${durationSeconds}s):\n${prompt}`,
      },
    ],
    max_tokens: 1500,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(raw) as GeneratedVideoMeta;
  } catch (err) {
    logger.error("Failed to parse AI video response", { error: err });
    return {
      storyboard: [
        {
          scene: 1,
          description: prompt,
          duration_seconds: durationSeconds,
          visual_notes: "Main scene based on prompt",
        },
      ],
      script: prompt,
      music_suggestion: "Background music matching the style",
    };
  }
}

/* ------------------------------------------------------------------ */
/*  5. Tracks – Generate Music Composition Metadata with AI            */
/* ------------------------------------------------------------------ */

export type GeneratedMusicMeta = {
  composition: {
    structure: string;
    instruments: string[];
    mood: string;
    tempo_description: string;
  };
  waveform_json: number[];
  lyrics?: string;
};

export async function generateMusicComposition(
  prompt: string,
  genre: string,
  bpm: number,
  keySignature: string,
  durationSeconds: number
): Promise<GeneratedMusicMeta> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a professional music composer and producer. Create a detailed music composition plan.

Return ONLY valid JSON:
{
  "composition": {
    "structure": "e.g., Intro (8 bars) → Verse (16 bars) → Chorus (8 bars) → ...",
    "instruments": ["instrument1", "instrument2", ...],
    "mood": "Describe the mood and feel",
    "tempo_description": "e.g., Moderate 120 BPM with swung eighth notes"
  },
  "waveform_json": [0.1, 0.3, 0.5, ...],
  "lyrics": "Optional lyrics if applicable"
}

For waveform_json: generate an array of ${Math.max(50, Math.floor(durationSeconds * 2))} float values between 0.0 and 1.0 representing a realistic audio waveform visualization. Start quiet, build up, have dynamic variation.`,
      },
      {
        role: "user",
        content: `Genre: ${genre}\nBPM: ${bpm}\nKey: ${keySignature}\nDuration: ${durationSeconds}s\n\nRequest: ${prompt}`,
      },
    ],
    max_tokens: 1200,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(raw) as GeneratedMusicMeta;
  } catch (err) {
    logger.error("Failed to parse AI music response", { error: err });
    // Generate basic waveform
    const points = Math.max(50, Math.floor(durationSeconds * 2));
    const waveform = Array.from({ length: points }, (_, i) => {
      const t = i / points;
      return Math.min(1, Math.max(0, 0.3 + 0.4 * Math.sin(t * Math.PI) + Math.random() * 0.2));
    });
    return {
      composition: {
        structure: "Intro → Main Section → Outro",
        instruments: ["Synth", "Drums", "Bass"],
        mood: genre,
        tempo_description: `${bpm} BPM in ${keySignature}`,
      },
      waveform_json: waveform,
    };
  }
}

/* ------------------------------------------------------------------ */
/*  6. Dashboard – Generate Layout from AI                             */
/* ------------------------------------------------------------------ */

export type GeneratedDashboard = {
  widgets: Array<{
    title: string;
    type: "chart" | "stat" | "table" | "text";
    chart_type?: string;
    data?: {
      labels?: string[];
      datasets?: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string;
      }>;
    };
    value?: string;
    description?: string;
    w: number;
    h: number;
  }>;
};

export async function generateDashboardLayout(
  prompt: string,
  title: string
): Promise<GeneratedDashboard> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a business intelligence dashboard designer. Create a dashboard layout with widgets.

Return ONLY valid JSON:
{
  "widgets": [
    {
      "title": "Widget Title",
      "type": "stat",
      "value": "1,234",
      "description": "Total users this month",
      "w": 1,
      "h": 1
    },
    {
      "title": "Revenue Trend",
      "type": "chart",
      "chart_type": "line",
      "data": {
        "labels": ["Jan", "Feb", "Mar"],
        "datasets": [{ "label": "Revenue", "data": [100, 200, 300], "borderColor": "#8b5cf6" }]
      },
      "w": 2,
      "h": 1
    },
    {
      "title": "Notes",
      "type": "text",
      "value": "Key insight or note text here",
      "w": 1,
      "h": 1
    }
  ]
}

Create 4-8 widgets. Mix stat cards, charts, and text widgets. Use professional colors.
Widget sizes: w (1-3 columns), h (1-2 rows). Stats are usually 1x1, charts 2x1, tables 2x1.`,
      },
      {
        role: "user",
        content: `Dashboard: "${title}"\nRequest: ${prompt}`,
      },
    ],
    max_tokens: 1500,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(raw) as GeneratedDashboard;
  } catch (err) {
    logger.error("Failed to parse AI dashboard response", { error: err });
    return {
      widgets: [
        { title: "Getting Started", type: "text", value: "Add widgets to your dashboard", w: 2, h: 1 },
      ],
    };
  }
}
