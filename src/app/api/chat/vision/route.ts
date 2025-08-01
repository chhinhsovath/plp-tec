import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chatRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-3-27b-it:free';

const visionMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  imageUrl: z.string().url(),
  sessionId: z.string().optional(),
});

const SYSTEM_PROMPT = `You are an AI learning assistant for a Teacher Education College (TEC) Learning Management System. 
You are helping with visual content analysis for educational purposes.
Your role is to help students and instructors with:
- Analyzing educational diagrams, charts, and visual learning materials
- Explaining visual concepts in educational contexts
- Helping understand visual representations of pedagogical concepts
- Providing insights about classroom layouts, teaching setups, or educational environments shown in images
- Assisting with visual content for assignments and presentations

Be helpful, encouraging, and educational. Focus on the educational value and learning aspects of the visual content.`;

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = chatRateLimit.check(req, session.user?.id);
    if (!rateLimitResult.success) {
      return rateLimitResult.error!;
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = visionMessageSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          errors: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { message, imageUrl, sessionId } = validationResult.data;

    let aiResponse: string;

    // Check if OpenRouter API key is configured
    if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'your-openrouter-api-key') {
      try {
        // Call OpenRouter API with vision capabilities
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://tec.openplp.com",
            "X-Title": "PLP TEC",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { 
                role: "user", 
                content: [
                  {
                    type: "text",
                    text: message
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageUrl
                    }
                  }
                ]
              }
            ],
            temperature: 0.7,
            max_tokens: 800,
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("OpenRouter API error:", errorData);
          throw new Error(`OpenRouter API error: ${response.statusText}`);
        }

        const data = await response.json();
        aiResponse = data.choices[0]?.message?.content || "I'm sorry, I couldn't analyze the image. Please try again.";
      } catch (error) {
        console.error("OpenRouter API error:", error);
        aiResponse = "I'm unable to analyze images at the moment. Please ensure the image URL is valid and try again later.";
      }
    } else {
      // Fallback response when OpenRouter is not configured
      aiResponse = "Image analysis is not currently configured. Please contact your administrator to enable this feature.";
    }

    return NextResponse.json({
      response: aiResponse,
      sessionId: sessionId || generateSessionId(),
      isVision: true
    });

  } catch (error) {
    console.error("Vision Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process image analysis request" },
      { status: 500 }
    );
  }
}

function generateSessionId(): string {
  return `vision-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}