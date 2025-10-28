import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { BarChart, LineChart, TrendingUp, TrendingDown, Activity, Target, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  history: { date: string; value: number }[];
}

export function KPIPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [newMetric, setNewMetric] = useState({ name: '', value: 0, target: 0, unit: '' });
  const [aiInsight, setAIInsight] = useState<string>('');
  const [template, setTemplate] = useState<string>('Starter');

  useEffect(() => {
    if (user) {
      loadKPIs();
      loadTemplate();
    }
  }, [user]);

  const loadTemplate = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_settings')
      .select('template')
      .eq('user_id', user.id)
      .single();

    if (data?.template) {
      setTemplate(data.template);
    }
  };

  const loadKPIs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('kpi_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setMetrics(data.map((m: any) => ({
          id: m.id,
          name: m.name,
          value: m.value,
          target: m.target,
          unit: m.unit,
          trend: m.trend || 'stable',
          history: m.history || [],
        })));
      }

      // Generate AI insight
      await generateAIInsight(data || []);
    } catch (error) {
      console.error('Error loading KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsight = async (kpis: any[]) => {
    const apiKey = import.meta.env.VITE_XAI_API_KEY;
    if (!apiKey || kpis.length === 0) {
      setAIInsight(getTemplateInsight());
      return;
    }

    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a leadership KPI analyst. Provide brief, actionable insights for ${template} template users.`,
            },
            {
              role: 'user',
              content: `Template: ${template}. KPIs: ${JSON.stringify(kpis.map(k => ({ name: k.name, value: k.value, target: k.target, unit: k.unit })))}. Provide 1-2 sentence insight with one action tip. Be optimistic and motivating.`,
            },
          ],
          model: 'grok-beta',
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        setAIInsight(content || getTemplateInsight());
      } else {
        setAIInsight(getTemplateInsight());
      }
    } catch (error) {
      console.error('Error generating AI insight:', error);
      setAIInsight(getTemplateInsight());
    }
  };

  const getTemplateInsight = () => {
    const insights = {
      Starter: 'Your daily wins are building momentum! 🌱 Focus on consistency over perfection.',
      Manager: 'Your team metrics show strong potential. 👔 Consider a 1-on-1 to boost engagement.',
      Entrepreneur: 'Your growth trajectory is solid! 🚀 Time to experiment with one new channel.',
    };
    return insights[template as keyof typeof insights] || insights.Starter;
  };

  const addMetric = async () => {
    if (!user || !newMetric.name || !newMetric.unit) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const { error } = await supabase.from('kpi_metrics').insert({
        user_id: user.id,
        name: newMetric.name,
        value: newMetric.value,
        target: newMetric.target,
        unit: newMetric.unit,
        trend: 'stable',
        history: [{ date: new Date().toISOString(), value: newMetric.value }],
      });

      if (error) throw error;

      toast.success('Metric added! 📊');
      setShowAddMetric(false);
      setNewMetric({ name: '', value: 0, target: 0, unit: '' });
      await loadKPIs();
    } catch (error: any) {
      console.error('Error adding metric:', error);
      toast.error(error.message || 'Failed to add metric');
    }
  };

  const deleteMetric = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('kpi_metrics').delete().eq('id', id).eq('user_id', user.id);

      if (error) throw error;

      toast.success('Metric removed');
      await loadKPIs();
    } catch (error: any) {
      console.error('Error deleting metric:', error);
      toast.error(error.message || 'Failed to delete metric');
    }
  };

  const getTemplateTitle = () => {
    const titles = {
      Starter: 'Daily Wins Dashboard',
      Manager: 'Team Impact Dashboard',
      Entrepreneur: 'Vision Scale Dashboard',
    };
    return titles[template as keyof typeof titles] || 'KPI Dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-white">Loading KPIs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {getTemplateTitle()}
            </h1>
            <p className="text-gray-400 mt-2">Track your progress with custom metrics</p>
          </div>
          <Button
            onClick={() => setShowAddMetric(!showAddMetric)}
            className="bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Metric
          </Button>
        </div>

        {/* AI Insight Card */}
        <Card className="bg-[#1e1e1e] border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-purple-400" />
              AI Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed">{aiInsight}</p>
          </CardContent>
        </Card>

        {/* Add Metric Form */}
        {showAddMetric && (
          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Add New Metric</CardTitle>
              <CardDescription className="text-gray-400">Create a custom KPI to track</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Metric Name</Label>
                  <Input
                    placeholder="e.g., Daily Steps"
                    value={newMetric.name}
                    onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                    className="bg-[#121212] border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Unit</Label>
                  <Input
                    placeholder="e.g., steps, tasks, $"
                    value={newMetric.unit}
                    onChange={(e) => setNewMetric({ ...newMetric, unit: e.target.value })}
                    className="bg-[#121212] border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Current Value</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newMetric.value}
                    onChange={(e) => setNewMetric({ ...newMetric, value: Number(e.target.value) })}
                    className="bg-[#121212] border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Target</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newMetric.target}
                    onChange={(e) => setNewMetric({ ...newMetric, target: Number(e.target.value) })}
                    className="bg-[#121212] border-gray-700 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={addMetric} className="bg-purple-600 hover:bg-purple-700">
                  Add Metric
                </Button>
                <Button onClick={() => setShowAddMetric(false)} variant="outline" className="border-gray-700 text-gray-300">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics Grid */}
        {metrics.length === 0 ? (
          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardContent className="py-12 text-center">
              <BarChart className="h-16 w-16 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">No metrics yet. Add your first KPI to get started!</p>
              <Button
                onClick={() => setShowAddMetric(true)}
                className="bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Metric
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => {
              const progress = (metric.value / metric.target) * 100;
              const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Activity;
              const trendColor = metric.trend === 'up' ? 'text-green-400' : metric.trend === 'down' ? 'text-red-400' : 'text-gray-400';

              return (
                <Card key={metric.id} className="bg-[#1e1e1e] border-gray-800 relative">
                  <button
                    onClick={() => deleteMetric(metric.id)}
                    className="absolute top-3 right-3 p-1 rounded hover:bg-red-500/20 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500 hover:text-red-400" />
                  </button>
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-400" />
                      {metric.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-white">{metric.value}</span>
                        <span className="text-gray-400">/ {metric.target}</span>
                        <span className="text-gray-500 text-sm">{metric.unit}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                        <span className="text-sm text-gray-400">{progress.toFixed(0)}% of target</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
