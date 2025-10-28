import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import type { Feedback } from '../../types/dashboard';

interface FeedbackFormProps {
  onSubmit: (feedback: Omit<Feedback, 'id' | 'timestamp'>) => void;
}

export function FeedbackForm({ onSubmit }: FeedbackFormProps) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || !category) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    onSubmit({
      content,
      category,
      anonymous: true,
    });

    setContent('');
    setCategory('');

    toast({
      title: 'Feedback Submitted',
      description: 'Thank you for your anonymous feedback!',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anonymous Feedback</CardTitle>
        <CardDescription>
          Share your thoughts anonymously to help improve leadership
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="direction">Direction & Vision</SelectItem>
                <SelectItem value="support">Support & Mentorship</SelectItem>
                <SelectItem value="processes">Processes & Workflow</SelectItem>
                <SelectItem value="culture">Team Culture</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Your Feedback
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, suggestions, or concerns..."
              rows={5}
            />
          </div>

          <Button type="submit" className="w-full">
            Submit Anonymously
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
