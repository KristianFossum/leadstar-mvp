import { supabase } from '@/lib/supabase';

const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

interface AgentAction {
  type: 'journal' | 'task' | 'goal' | 'xp' | 'energy' | 'impact';
  data: any;
}

interface AgentResult {
  actions: AgentAction[];
  message: string;
  xp: number;
}

async function fetchUserContext(userId: string) {
  try {
    const [journalsRes, personalityRes, tasksRes, goalsRes, gamificationRes] = await Promise.all([
      supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(3),
      supabase.from('personality_results').select('*').eq('user_id', userId).single(),
      supabase.from('tasks').select('*').eq('user_id', userId).limit(10),
      supabase.from('goals').select('*').eq('user_id', userId).limit(5),
      supabase.from('gamification').select('*').eq('user_id', userId).single(),
    ]);

    return {
      journals: journalsRes.data || [],
      personality: personalityRes.data || null,
      tasks: tasksRes.data || [],
      goals: goalsRes.data || [],
      gamification: gamificationRes.data || null,
    };
  } catch (error) {
    console.error('Error fetching user context:', error);
    return { journals: [], personality: null, tasks: [], goals: [], gamification: null };
  }
}

async function callGrokAPI(prompt: string): Promise<any> {
  if (!XAI_API_KEY) {
    console.warn('xAI API key not configured, using fallback');
    throw new Error('No API key');
  }

  try {
    console.log('🤖 Grok Agent Request:', { promptLength: prompt.length });

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
            content: `You are an AI Agent that processes user inputs and generates structured actions.

CRITICAL: You MUST respond ONLY with valid JSON in this exact format:
{
  "actions": [
    {"type": "journal", "data": {"wins": ["win1"], "struggles": ["struggle1"], "mood": "happy", "reflections": "text"}},
    {"type": "task", "data": {"title": "Task name", "desc": "Description", "date": "YYYY-MM-DD"}},
    {"type": "xp", "data": {"amount": 50}}
  ],
  "message": "Updated journal and goals! Great work!",
  "xp": 50
}

Action types:
- journal: Add journal entry (wins, struggles, mood, reflections)
- task: Add task to calendar (title, desc, date)
- goal: Update goal progress (goal_id, progress)
- xp: Award XP (amount)
- energy: Update mood (mood, energy_level)

Parse user input and generate appropriate actions. Be encouraging!`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    console.log('🤖 Grok Agent Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🤖 Grok Agent Error:', errorText);
      throw new Error(`xAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('🤖 Grok Agent Response:', data);

    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error('No content in response');

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('🤖 Grok Agent Error:', error);
    throw error;
  }
}

async function executeActions(userId: string, actions: AgentAction[]): Promise<void> {
  console.log('🤖 Executing actions:', actions);

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'journal':
          const today = new Date().toISOString().split('T')[0];
          // Check if journal exists for today
          const { data: existingJournal } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

          if (existingJournal) {
            // Update existing journal
            await supabase
              .from('journal_entries')
              .update({
                wins: [...(existingJournal.wins || []), ...(action.data.wins || [])],
                struggles: [
                  ...(existingJournal.struggles || []),
                  ...(action.data.struggles || []),
                ],
                mood: action.data.mood || existingJournal.mood,
                reflections: action.data.reflections
                  ? `${existingJournal.reflections || ''}\n${action.data.reflections}`
                  : existingJournal.reflections,
              })
              .eq('id', existingJournal.id);
          } else {
            // Create new journal
            await supabase.from('journal_entries').insert([
              {
                user_id: userId,
                date: today,
                wins: action.data.wins || [],
                struggles: action.data.struggles || [],
                mood: action.data.mood || 'neutral',
                reflections: action.data.reflections || '',
                linked_goals: [],
              },
            ]);
          }
          console.log('✅ Journal updated');
          break;

        case 'task':
          const taskDate = action.data.date || new Date().toISOString().split('T')[0];
          await supabase.from('tasks').insert([
            {
              user_id: userId,
              title: action.data.title,
              desc: action.data.desc || '',
              date: taskDate,
              repeat_type: 'none',
              repeat_interval: 0,
              reminder: true,
              completed: false,
            },
          ]);
          console.log('✅ Task added');
          break;

        case 'goal':
          if (action.data.goal_id && action.data.progress !== undefined) {
            await supabase
              .from('goals')
              .update({ current_value: action.data.progress })
              .eq('id', action.data.goal_id);
            console.log('✅ Goal updated');
          }
          break;

        case 'xp':
          const { data: gamification } = await supabase
            .from('gamification')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (gamification) {
            const newXP = gamification.total_xp + (action.data.amount || 50);
            const newLevel = Math.floor(newXP / 500) + 1;

            await supabase
              .from('gamification')
              .update({
                total_xp: newXP,
                current_level: newLevel,
              })
              .eq('user_id', userId);
            console.log('✅ XP awarded');
          }
          break;

        case 'energy':
          // Update mood tracking (could be separate table)
          console.log('✅ Energy updated');
          break;

        default:
          console.warn('Unknown action type:', action.type);
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
    }
  }
}

export async function processAgentInput(userId: string, input: string): Promise<AgentResult> {
  try {
    const context = await fetchUserContext(userId);

    const prompt = `User said: "${input}"

User context:
- Recent journals: ${context.journals.length}
- Tasks: ${context.tasks.length} (${context.tasks.filter((t) => t.completed).length} done)
- Goals: ${context.goals.length}
- XP: ${context.gamification?.total_xp || 0}
- Streak: ${context.gamification?.streak_count || 0}

Parse this input and generate actions to update their data. Be smart about context:
- "Workout 5km" → journal win + xp
- "Schedule journaling" → add task
- "Felt tired" → journal struggle + energy update
- "Completed project X" → journal win + goal progress + xp

Respond with JSON only.`;

    const result = await callGrokAPI(prompt);

    // Execute all actions in Supabase
    if (result.actions && result.actions.length > 0) {
      await executeActions(userId, result.actions);
    }

    return {
      actions: result.actions || [],
      message: result.message || 'Got it! Changes saved!',
      xp: result.xp || 50,
    };
  } catch (error) {
    console.error('🤖 Agent processing error:', error);

    // Fallback: simple processing
    const fallbackActions: AgentAction[] = [];
    const lowerInput = input.toLowerCase();

    // Detect workout/exercise
    if (lowerInput.includes('workout') || lowerInput.includes('run') || lowerInput.includes('exercise')) {
      fallbackActions.push({
        type: 'journal',
        data: {
          wins: [input],
          struggles: [],
          mood: 'energized',
          reflections: 'Completed physical activity',
        },
      });
      fallbackActions.push({ type: 'xp', data: { amount: 50 } });
    }

    // Detect scheduling
    if (lowerInput.includes('schedule') || lowerInput.includes('plan')) {
      const taskTitle = input.replace(/schedule|plan/gi, '').trim();
      fallbackActions.push({
        type: 'task',
        data: {
          title: taskTitle || 'New task',
          desc: `From AI Agent: ${input}`,
          date: new Date().toISOString().split('T')[0],
        },
      });
    }

    // Execute fallback actions
    if (fallbackActions.length > 0) {
      await executeActions(userId, fallbackActions);
    }

    return {
      actions: fallbackActions,
      message: 'Got it! Logged your update.',
      xp: 50,
    };
  }
}
