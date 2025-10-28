import { supabase } from '@/lib/supabase';

const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

export interface UserData {
  journal?: any[];
  personality?: any;
  tasks?: any[];
  goals?: any[];
  gamification?: any;
  mood?: any[];
  kpis?: any[];
  values?: any;
}

export interface AgentAction {
  type: 'journal' | 'goal' | 'task' | 'energy' | 'impact' | 'growth' | 'values' | 'vibe' | 'question';
  data?: any;
  message?: string;
  xp?: number;
  badge?: string;
}

export interface AgentResponse {
  actions: AgentAction[];
  response: string;
  followUp?: string;
}

export async function analyzeUserInput(
  userId: string,
  input: string,
  userData: UserData
): Promise<AgentResponse> {
  if (!XAI_API_KEY) {
    console.warn('🤖 xAI API key not configured, using fallback');
    return generateFallbackResponse(input);
  }

  const systemPrompt = `You are an AI coach agent that helps users track their personal growth.
Analyze the user's input and their current data to determine what actions to take.

User Data Context:
- Journal Entries: ${JSON.stringify(userData.journal?.slice(0, 5) || [])}
- Personality: ${JSON.stringify(userData.personality || {})}
- Active Tasks: ${JSON.stringify(userData.tasks?.slice(0, 10) || [])}
- Goals: ${JSON.stringify(userData.goals || [])}
- Gamification: ${JSON.stringify(userData.gamification || {})}
- Recent Moods: ${JSON.stringify(userData.mood?.slice(0, 7) || [])}

Instructions:
1. Parse the user's input to identify what they're sharing (workout, reflection, goal update, task completion, etc.)
2. Determine which data to update (journal, goals, tasks, energy, impact, growth, values, vibe)
3. Generate specific actions with data
4. Calculate XP rewards (50 for journal, 30 for tasks, 100 for goals, etc.)
5. Suggest badges if milestones hit
6. Ask follow-up questions if unclear
7. Provide encouraging, motivating responses

Return JSON format:
{
  "actions": [
    {
      "type": "journal|goal|task|energy|impact|growth|values|vibe|question",
      "data": {...},
      "message": "Update message",
      "xp": 50,
      "badge": "Badge name if earned"
    }
  ],
  "response": "Encouraging response to user",
  "followUp": "Optional follow-up question"
}

Example Input: "Finished workout — 5km run, felt strong"
Example Output:
{
  "actions": [
    {
      "type": "journal",
      "data": {
        "wins": ["Completed 5km run"],
        "mood": "energized",
        "reflections": "Felt strong during workout"
      },
      "xp": 50
    },
    {
      "type": "impact",
      "data": {
        "exercise": "5km run",
        "distance": 5
      },
      "xp": 30
    },
    {
      "type": "task",
      "data": {
        "title": "Recovery walk tomorrow",
        "date": "tomorrow"
      },
      "xp": 30
    }
  ],
  "response": "Amazing! 5km run is a solid win. You're building serious momentum. 🔥",
  "followUp": "How many calories did you burn? I can track that too!"
}

Example Input: "Schedule journaling today"
Example Output:
{
  "actions": [
    {
      "type": "task",
      "data": {
        "title": "Daily journaling",
        "description": "Take time to reflect on wins, struggles, and growth",
        "date": "today",
        "emoji": "📓"
      },
      "xp": 30
    }
  ],
  "response": "Great! I've added journaling to your calendar for today. +30 XP when you complete it! 📓",
  "followUp": null
}`;

  try {
    console.log('🤖 AI Agent Request:', {
      url: XAI_API_URL,
      hasApiKey: !!XAI_API_KEY,
      inputLength: input.length,
      userDataKeys: Object.keys(userData)
    });

    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.7,
      }),
    });

    console.log('🤖 AI Agent Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🤖 AI Agent Error Response:', errorText);
      throw new Error(`xAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🤖 AI Agent Raw Response:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      contentPreview: data.choices?.[0]?.message?.content?.substring(0, 100)
    });

    const content = data.choices[0].message.content;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('🤖 AI Agent Invalid Format:', content);
      throw new Error('Invalid response format from Grok');
    }

    const agentResponse: AgentResponse = JSON.parse(jsonMatch[0]);
    console.log('🤖 AI Agent Parsed Response:', {
      actionsCount: agentResponse.actions?.length,
      hasResponse: !!agentResponse.response,
      hasFollowUp: !!agentResponse.followUp
    });

    // Save conversation to coach_history
    await saveCoachHistory(userId, input, agentResponse);

    return agentResponse;
  } catch (error) {
    console.error('🤖 AI Agent Error:', error);
    return generateFallbackResponse(input);
  }
}

function generateFallbackResponse(input: string): AgentResponse {
  // Fallback response with smart parsing
  const fallbackActions: AgentAction[] = [];
  const lowerInput = input.toLowerCase();

  // Simple pattern matching for common inputs
  if (lowerInput.includes('schedule') || lowerInput.includes('add task') || lowerInput.includes('remind')) {
    // Extract task info
    const taskTitle = input.replace(/schedule|add task|remind me|to|today|tomorrow/gi, '').trim();
    const date = lowerInput.includes('tomorrow') ? 'tomorrow' : 'today';

    fallbackActions.push({
      type: 'task',
      data: {
        title: taskTitle || 'Task from AI Agent',
        description: input,
        date: date,
        emoji: '📅'
      },
      xp: 30
    });
  } else if (lowerInput.includes('workout') || lowerInput.includes('run') || lowerInput.includes('exercise')) {
    fallbackActions.push({
      type: 'journal',
      data: {
        wins: [input],
        mood: 'energized',
        reflections: 'Completed workout'
      },
      xp: 50
    });
  } else if (lowerInput.includes('tired') || lowerInput.includes('stressed')) {
    fallbackActions.push({
      type: 'journal',
      data: {
        mood: 'tired',
        reflections: input
      },
      xp: 30
    });
  } else {
    fallbackActions.push({
      type: 'journal',
      data: {
        reflections: input,
        mood: 'neutral'
      },
      xp: 30
    });
  }

  const totalXP = fallbackActions.reduce((sum, a) => sum + (a.xp || 0), 0);

  return {
    actions: fallbackActions,
    response: `Got it! Logged: ${input}. +${totalXP} XP`,
    followUp: undefined
  };
}

async function saveCoachHistory(
  userId: string,
  input: string,
  response: AgentResponse
) {
  try {
    await supabase.from('coach_history').insert({
      user_id: userId,
      input,
      response: response.response,
      actions: response.actions,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving coach history:', error);
  }
}

export async function getUserData(userId: string): Promise<UserData> {
  try {
    const [
      { data: journal },
      { data: personality },
      { data: tasks },
      { data: goals },
      { data: gamification },
    ] = await Promise.all([
      supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(5),
      supabase
        .from('personality_results')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('task_date', { ascending: true })
        .limit(10),
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('gamification')
        .select('*')
        .eq('user_id', userId)
        .single(),
    ]);

    return {
      journal: journal || [],
      personality: personality || null,
      tasks: tasks || [],
      goals: goals || [],
      gamification: gamification || null,
      mood: journal?.map(e => ({ mood: e.mood, date: e.date })) || [],
      kpis: [],
      values: null,
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {};
  }
}
