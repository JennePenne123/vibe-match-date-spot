import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { messages, conversationId } = await req.json();
    console.log('Received request from user:', user.id, 'conversation:', conversationId);

    // Load conversation history if conversationId provided
    let fullHistory = messages || [];
    if (conversationId) {
      const { data: historyData } = await supabase
        .from('coding_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (historyData && historyData.length > 0) {
        fullHistory = [...historyData, ...messages];
      }
    }

    const systemPrompt = `You are an advanced AI coding assistant specialized in React, TypeScript, and modern web development.

**Your Capabilities:**
1. **Code Generation**: Create high-quality, well-documented code with best practices
2. **Code Analysis**: Review code for quality, security, performance, and maintainability
3. **Debugging**: Diagnose bugs and provide clear, actionable solutions
4. **Multi-Step Tasks**: Break down complex requirements into manageable steps
5. **Teaching**: Explain concepts clearly with examples and context

**Technical Context:**
- React 18+ with TypeScript
- Supabase backend (PostgreSQL + Edge Functions)
- TailwindCSS for styling
- React Router for navigation
- Dating app domain (venues, user matching, invitations)

**Guidelines:**
- Provide complete, runnable code examples
- Include TypeScript types and interfaces
- Add clear comments explaining logic
- Follow React best practices (hooks, component patterns)
- Consider performance and security
- Ask clarifying questions when requirements are unclear
- Suggest multiple approaches when appropriate
- Format code blocks with proper syntax highlighting

**Response Format:**
- Use markdown for structure
- Use code blocks with language tags (\`\`\`typescript, \`\`\`jsx, etc.)
- Break complex answers into sections
- Provide "Why" explanations alongside "How"`;

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_code",
          description: "Generate complete, production-ready code with proper structure, types, and documentation",
          parameters: {
            type: "object",
            properties: {
              language: { 
                type: "string",
                enum: ["typescript", "javascript", "tsx", "jsx", "sql", "css"],
                description: "Programming language for the code"
              },
              description: { 
                type: "string",
                description: "What the code should do"
              },
              includeTests: { 
                type: "boolean",
                description: "Whether to include test cases"
              },
              includeComments: { 
                type: "boolean",
                description: "Whether to include inline comments"
              }
            },
            required: ["language", "description"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_code",
          description: "Perform comprehensive code analysis for quality, security, and performance",
          parameters: {
            type: "object",
            properties: {
              code: { 
                type: "string",
                description: "The code to analyze"
              },
              language: { 
                type: "string",
                description: "Programming language of the code"
              },
              focusAreas: { 
                type: "array",
                items: { 
                  type: "string",
                  enum: ["quality", "security", "performance", "readability", "best-practices"]
                },
                description: "Specific areas to focus on during analysis"
              }
            },
            required: ["code", "language"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "debug_issue",
          description: "Analyze errors and provide step-by-step debugging solutions",
          parameters: {
            type: "object",
            properties: {
              errorMessage: { 
                type: "string",
                description: "The error message or description"
              },
              codeSnippet: { 
                type: "string",
                description: "Relevant code where the error occurs"
              },
              stackTrace: { 
                type: "string",
                description: "Full stack trace if available"
              }
            },
            required: ["errorMessage"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_task_plan",
          description: "Break down complex coding tasks into clear, actionable steps",
          parameters: {
            type: "object",
            properties: {
              taskDescription: { 
                type: "string",
                description: "The task to break down"
              },
              complexity: { 
                type: "string",
                enum: ["simple", "moderate", "complex"],
                description: "Estimated complexity level"
              }
            },
            required: ["taskDescription"]
          }
        }
      }
    ];

    // Call Lovable AI with streaming
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...fullHistory
        ],
        tools,
        tool_choice: 'auto',
        stream: true,
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required. Please add credits to your Lovable workspace.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Stream the response back to client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Coding assistant error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
