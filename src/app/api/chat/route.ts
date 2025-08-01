import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo'

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are an AI learning assistant for a Teacher Education College (TEC) Learning Management System. 
Your role is to help students and instructors with:
- Understanding course content and educational concepts
- Providing study tips and learning strategies
- Explaining pedagogical theories and teaching methods
- Assisting with homework and assignments (guidance, not direct answers)
- Technical help with using the LMS platform
- General academic support

Be helpful, encouraging, and educational. Adapt your language to be clear and accessible.
For technical questions about the platform, you can explain features like course enrollment, 
accessing materials, taking assessments, and using the e-library.

Important guidelines:
- Always encourage learning and understanding over memorization
- Provide examples when explaining concepts
- Break down complex topics into manageable parts
- Suggest additional resources when appropriate
- Be supportive and patient with learners`

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, sessionId, context } = await req.json()

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: "Message and session ID are required" },
        { status: 400 }
      )
    }

    // Store user message
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        sessionId,
        role: "USER",
        content: message,
        metadata: context
      }
    })

    // Get conversation history for context
    const history = await prisma.chatMessage.findMany({
      where: {
        userId: session.user.id,
        sessionId
      },
      orderBy: { createdAt: 'asc' },
      take: 10 // Last 10 messages for context
    })

    // Prepare messages for OpenRouter
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map(msg => ({
        role: msg.role === "USER" ? "user" : "assistant",
        content: msg.content
      })),
      { role: "user", content: message }
    ]

    let aiResponse: string

    // Check if OpenRouter API key is configured
    if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'your-openrouter-api-key') {
      try {
        // Call OpenRouter API
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "TEC LMS",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 500,
          })
        })

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.statusText}`)
        }

        const data = await response.json()
        aiResponse = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."
      } catch (error) {
        console.error("OpenRouter API error:", error)
        aiResponse = "I'm having trouble connecting to my knowledge base. Please try again later."
      }
    } else {
      // Fallback response when OpenRouter is not configured
      aiResponse = generateFallbackResponse(message)
    }

    // Store AI response
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        sessionId,
        role: "ASSISTANT",
        content: aiResponse,
      }
    })

    // Generate suggestions based on the conversation
    const suggestions = generateSuggestions(message, aiResponse)

    return NextResponse.json({
      response: aiResponse,
      sessionId,
      suggestions
    })

  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    )
  }
}

// GET endpoint for chat history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        userId: session.user.id,
        sessionId
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching chat history:", error)
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    )
  }
}

// DELETE endpoint to clear chat history
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    await prisma.chatMessage.deleteMany({
      where: {
        userId: session.user.id,
        sessionId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing chat history:", error)
    return NextResponse.json(
      { error: "Failed to clear chat history" },
      { status: 500 }
    )
  }
}

// Fallback responses when OpenRouter is not available
function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('constructivism')) {
    return "Constructivism is a learning theory that suggests learners actively construct their own understanding and knowledge through experiences and reflection. Key principles include:\n\n1. Learning is an active process\n2. Knowledge is constructed, not transmitted\n3. Prior knowledge influences new learning\n4. Social interaction is crucial for learning\n\nWould you like me to explain how to apply constructivism in teaching?"
  }

  if (lowerMessage.includes('classroom management')) {
    return "Effective classroom management strategies include:\n\n1. Establish clear rules and expectations\n2. Build positive relationships with students\n3. Use positive reinforcement\n4. Be consistent and fair\n5. Create engaging lessons\n6. Address disruptions promptly and calmly\n\nWhich aspect would you like to explore further?"
  }

  if (lowerMessage.includes('lesson plan')) {
    return "Creating engaging lesson plans involves:\n\n1. Clear learning objectives\n2. Engaging introduction/hook\n3. Varied teaching methods\n4. Interactive activities\n5. Assessment strategies\n6. Closure and reflection\n\nWould you like a template or specific examples?"
  }

  if (lowerMessage.includes('assessment')) {
    return "Best practices for student assessment include:\n\n1. Use varied assessment types (formative and summative)\n2. Align assessments with learning objectives\n3. Provide clear rubrics\n4. Offer timely feedback\n5. Allow for student self-assessment\n6. Use assessment data to improve teaching\n\nWhat type of assessment are you planning?"
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return "I'm here to help! I can assist with:\n\n• Understanding educational concepts\n• Study strategies and tips\n• Course content questions\n• Using the LMS platform\n• Assignment guidance\n\nWhat specific topic would you like help with?"
  }

  return "I'd be happy to help you with that topic. Could you provide more specific details about what you'd like to know? For example, are you looking for theoretical understanding, practical applications, or study strategies?"
}

function generateSuggestions(message: string, response: string): string[] {
  const suggestions = []
  
  if (response.includes('constructivism')) {
    suggestions.push("How is constructivism different from behaviorism?")
    suggestions.push("Can you give examples of constructivist teaching methods?")
  }
  
  if (response.includes('classroom')) {
    suggestions.push("What are strategies for managing difficult behaviors?")
    suggestions.push("How do I create a positive classroom environment?")
  }
  
  if (response.includes('assessment')) {
    suggestions.push("What's the difference between formative and summative assessment?")
    suggestions.push("How do I create effective rubrics?")
  }

  // Default suggestions if none match
  if (suggestions.length === 0) {
    suggestions.push("Tell me more about this topic")
    suggestions.push("Can you provide practical examples?")
    suggestions.push("What are the best resources to learn more?")
  }

  return suggestions.slice(0, 3)
}