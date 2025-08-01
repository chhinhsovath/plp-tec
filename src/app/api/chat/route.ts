import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chatMessageSchema } from "@/lib/validations";
import { chatRateLimit } from "@/lib/rate-limit";
import { canAccessChat } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-3-27b-it:free';

const SYSTEM_PROMPT = `You are an AI learning assistant for a Teacher Education College (TEC) Learning Management System. 
Your role is to help students and instructors with:
- Understanding course content and educational concepts
- Providing study tips and learning strategies
- Explaining pedagogical theories and teaching methods
- Assisting with homework and assignments (guidance, not direct answers)
- Technical help with using the LMS platform
- General academic support

Be helpful, encouraging, and educational. Adapt your language to be clear and accessible.`;

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to access chat
    const hasAccess = await canAccessChat(session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have permission to access the chat feature" },
        { status: 403 }
      );
    }

    // Apply rate limiting
    const rateLimitResult = chatRateLimit.check(req, session.user?.id);
    if (!rateLimitResult.success) {
      return rateLimitResult.error!;
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = chatMessageSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          errors: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { message, sessionId } = validationResult.data;

    let aiResponse: string;

    // Check if OpenRouter API key is configured
    if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'your-openrouter-api-key') {
      try {
        // Call OpenRouter API
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
              { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 500,
          })
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.statusText}`);
        }

        const data = await response.json();
        aiResponse = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      } catch (error) {
        console.error("OpenRouter API error:", error);
        aiResponse = generateFallbackResponse(message);
      }
    } else {
      // Fallback response when OpenRouter is not configured
      aiResponse = generateFallbackResponse(message);
    }

    // Store chat message in database
    await prisma.chatMessage.createMany({
      data: [
        {
          userId: session.user.id,
          sessionId: sessionId || generateSessionId(),
          role: 'USER',
          content: message,
        },
        {
          userId: session.user.id,
          sessionId: sessionId || generateSessionId(),
          role: 'ASSISTANT',
          content: aiResponse,
        }
      ]
    });

    return NextResponse.json({
      response: aiResponse,
      sessionId: sessionId || generateSessionId(),
      suggestions: generateSuggestions(message, aiResponse)
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

// Fallback responses when OpenRouter is not available
function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your AI learning assistant. How can I help you with your studies today?";
  }

  if (lowerMessage.includes('constructivism')) {
    return "Constructivism is a learning theory that suggests learners actively construct their own understanding and knowledge through experiences and reflection. Key principles include:\n\n1. Learning is an active process\n2. Knowledge is constructed, not transmitted\n3. Prior knowledge influences new learning\n4. Social interaction is crucial for learning\n\nWould you like me to explain how to apply constructivism in teaching?";
  }

  if (lowerMessage.includes('help')) {
    return "I'm here to help! I can assist with:\n\n• Understanding educational concepts\n• Study strategies and tips\n• Course content questions\n• Using the LMS platform\n• Assignment guidance\n\nWhat specific topic would you like help with?";
  }

  return "I'd be happy to help you with that topic. Could you provide more specific details about what you'd like to know?";
}

function generateSuggestions(message: string, response: string): string[] {
  const suggestions = [];
  
  if (response.includes('constructivism')) {
    suggestions.push("How is constructivism different from behaviorism?");
    suggestions.push("Can you give examples of constructivist teaching methods?");
  } else {
    suggestions.push("Tell me more about this topic");
    suggestions.push("Can you provide practical examples?");
    suggestions.push("What are the best resources to learn more?");
  }

  return suggestions.slice(0, 3);
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}