import { supabase } from '@/lib/supabase';

const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

interface UserData {
  journals: any[];
  personality: any;
  tasks: any[];
  gamification: any;
  goals: any[];
}

async function fetchUserData(userId: string): Promise<UserData> {
  try {
    const [journalsRes, personalityRes, tasksRes, gamificationRes] = await Promise.all([
      supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(7),
      supabase.from('personality_results').select('*').eq('user_id', userId).single(),
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('gamification').select('*').eq('user_id', userId).single(),
    ]);

    return {
      journals: journalsRes.data || [],
      personality: personalityRes.data || null,
      tasks: tasksRes.data || [],
      gamification: gamificationRes.data || null,
      goals: [], // Goals are extracted from journal linked_goals
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return { journals: [], personality: null, tasks: [], gamification: null, goals: [] };
  }
}

async function callGrokAPI(prompt: string): Promise<string> {
  if (!XAI_API_KEY) {
    console.warn('xAI API key not configured, using fallback responses');
    return generateFallbackResponse(prompt);
  }

  try {
    console.log('🤖 Grok API Request:', {
      url: XAI_API_URL,
      promptLength: prompt.length,
      hasApiKey: !!XAI_API_KEY
    });

    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content:
              'You are an empathetic AI leadership coach. Be concise, motivating, and actionable. Use emojis sparingly.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    console.log('🤖 Grok API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🤖 Grok API Error Response:', errorText);
      throw new Error(`xAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🤖 Grok API Success:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasContent: !!data.choices?.[0]?.message?.content
    });

    return data.choices[0]?.message?.content || generateFallbackResponse(prompt);
  } catch (error) {
    console.error('🤖 Error calling Grok API:', error);
    return generateFallbackResponse(prompt);
  }
}

function generateFallbackResponse(context: string): string {
  // Simple fallback when API is unavailable
  if (context.includes('insight')) {
    return "You're making steady progress! Keep building on your wins.";
  }
  if (context.includes('question')) {
    return "That's a great question! Focus on small, consistent actions to build momentum.";
  }
  return 'Stay focused on your goals. Small steps lead to big wins!';
}

export async function generateCoachInsight(userId: string) {
  const userData = await fetchUserData(userId);

  const prompt = `Based on this user's data, generate a daily coaching insight:

Recent Journals: ${userData.journals.length} entries (last 7 days)
Latest Mood: ${userData.journals[0]?.mood || 'Unknown'}
Wins: ${userData.journals[0]?.wins?.slice(0, 3).join(', ') || 'None yet'}
Struggles: ${userData.journals[0]?.struggles?.slice(0, 2).join(', ') || 'None'}
Tasks: ${userData.tasks.length} total, ${userData.tasks.filter((t) => t.completed).length} completed
XP: ${userData.gamification?.total_xp || 0}
Streak: ${userData.gamification?.streak_count || 0} days

Generate:
1. A 1-sentence motivating insight (15 words max)
2. A micro-mission they can do today (e.g., "5-min walk" or "Call a mentor")
3. Progress score 0-100 (how close to "superhuman" today)

Format as JSON: {"insight": "...", "mission": "...", "progress": 75}`;

  const response = await callGrokAPI(prompt);

  try {
    const parsed = JSON.parse(response);
    return {
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      insight: parsed.insight || "You're on the right track. Keep going!",
      mission: parsed.mission || 'Journal your wins today',
      mission_xp: 50,
      superhuman_progress: parsed.progress || 50,
      scenario_json: {
        title: 'Leadership Challenge',
        description: 'Tomorrow: Team conflict. How do you respond?',
        options: [
          {
            label: 'A) Address directly',
            trait: 'Extraversion',
            outcome: 'Team respects your clarity and decisiveness.',
            xp: 100,
          },
          {
            label: 'B) Listen first',
            trait: 'Agreeableness',
            outcome: 'Both sides feel heard. Conflict de-escalates.',
            xp: 100,
          },
          {
            label: 'C) Analyze data',
            trait: 'Conscientiousness',
            outcome: 'You find the root cause. Team implements your solution.',
            xp: 100,
          },
        ],
      },
    };
  } catch (error) {
    // Fallback if API response isn't valid JSON
    return {
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      insight: response.substring(0, 100),
      mission: 'Take 5 minutes to reflect on your day',
      mission_xp: 50,
      superhuman_progress: 50,
      scenario_json: null,
    };
  }
}

export async function askCoachQuestion(userId: string, question: string): Promise<string> {
  const userData = await fetchUserData(userId);

  const prompt = `You're coaching this user. Answer their question using their data:

Question: "${question}"

Context:
- ${userData.journals.length} journal entries (last 7 days)
- Latest mood: ${userData.journals[0]?.mood || 'Unknown'}
- Recent wins: ${userData.journals[0]?.wins?.slice(0, 3).join(', ') || 'Building momentum'}
- Struggles: ${userData.journals[0]?.struggles?.slice(0, 2).join(', ') || 'Finding balance'}
- Personality traits: ${userData.personality ? 'Analyzed' : 'Pending analysis'}
- Tasks: ${userData.tasks.filter((t) => t.completed).length}/${userData.tasks.length} completed
- XP: ${userData.gamification?.total_xp || 0}, Streak: ${userData.gamification?.streak_count || 0}

Give a concise, empathetic, actionable answer (3-4 sentences max). Use their data to personalize it.`;

  return await callGrokAPI(prompt);
}
