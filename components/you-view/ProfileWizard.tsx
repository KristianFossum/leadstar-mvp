import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { X } from 'lucide-react';
import type { PersonalProfile } from '../../types/you-view';

interface ProfileWizardProps {
  profile: PersonalProfile;
  onComplete: (profile: PersonalProfile, template?: string) => void;
  onSkip?: () => void;
}

interface PersonalizationTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  suggestedValues: string[];
  focusArea: string;
}

const templates: PersonalizationTemplate[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Just beginning your growth journey',
    emoji: '🌱',
    suggestedValues: ['Curiosity', 'Learning', 'Growth', 'Authenticity'],
    focusArea: 'Building small wins daily'
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Leading teams and driving results',
    emoji: '👔',
    suggestedValues: ['Collaboration', 'Accountability', 'Empathy', 'Innovation'],
    focusArea: 'Team impact and KPIs'
  },
  {
    id: 'entrepreneur',
    name: 'Entrepreneur',
    description: 'Building ventures and chasing big goals',
    emoji: '🚀',
    suggestedValues: ['Innovation', 'Resilience', 'Vision', 'Impact'],
    focusArea: 'Big goals and rapid iteration'
  }
];

export function ProfileWizard({ profile, onComplete, onSkip }: ProfileWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: profile.name || '',
    role: profile.role || '',
    template: '',
    values: profile.values || [],
    personalityType: profile.personalityType || '',
    currentValue: '',
  });

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handleAddValue = () => {
    if (formData.currentValue.trim() && formData.values.length < 6) {
      setFormData({
        ...formData,
        values: [...formData.values, formData.currentValue.trim()],
        currentValue: '',
      });
    }
  };

  const handleRemoveValue = (valueToRemove: string) => {
    setFormData({
      ...formData,
      values: formData.values.filter((v) => v !== valueToRemove),
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        template: templateId,
        values: template.suggestedValues,
      });
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete({
        ...profile,
        name: formData.name,
        role: formData.role,
        values: formData.values,
        personalityType: formData.personalityType,
        onboardingCompleted: true,
      }, formData.template);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.role.trim().length > 0;
      case 3:
        return formData.template.length > 0;
      case 4:
        return formData.values.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Welcome to Your Personal Growth Hub 🌟</CardTitle>
        <CardDescription>
          Let's set up your profile to personalize your experience
        </CardDescription>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">What's your name?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This helps us personalize your experience
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">What's your role?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Help us understand your professional context
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Current Role</Label>
              <Input
                id="role"
                placeholder="e.g., Engineering Team Lead, Product Manager"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose your template</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select the template that best describes your current stage
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all hover:scale-105 ${
                    formData.template === template.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-4xl mb-2">{template.emoji}</div>
                  <h4 className="font-semibold mb-1">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                  <p className="text-xs font-medium">Focus: {template.focusArea}</p>
                </button>
              ))}
            </div>
            {formData.template && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Your suggested values:</p>
                <div className="flex flex-wrap gap-2">
                  {templates.find(t => t.id === formData.template)?.suggestedValues.map((value) => (
                    <Badge key={value} variant="secondary">{value}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  You can customize these in the next step
                </p>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Customize your values</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Edit, add, or remove values to make them your own
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Add a Value</Label>
              <div className="flex gap-2">
                <Input
                  id="value"
                  placeholder="Enter a core value"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddValue();
                    }
                  }}
                  autoFocus
                />
                <Button onClick={handleAddValue} disabled={formData.values.length >= 6}>
                  Add
                </Button>
              </div>
            </div>
            {formData.values.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.values.map((value) => (
                  <Badge key={value} variant="secondary" className="text-sm">
                    {value}
                    <button
                      onClick={() => handleRemoveValue(value)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Almost done! 🎉</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You can take a personality test later to get personalized insights
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div>
                <span className="font-medium">Name:</span> {formData.name}
              </div>
              <div>
                <span className="font-medium">Role:</span> {formData.role}
              </div>
              <div>
                <span className="font-medium">Template:</span>{' '}
                {templates.find(t => t.id === formData.template)?.emoji}{' '}
                {templates.find(t => t.id === formData.template)?.name}
              </div>
              <div>
                <span className="font-medium">Values:</span>{' '}
                {formData.values.join(', ')}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {onSkip && step === 1 && (
              <Button variant="ghost" onClick={onSkip}>
                Skip Setup
              </Button>
            )}
            <Button onClick={handleNext} disabled={!canProceed()}>
              {step === totalSteps ? 'Complete' : 'Next'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
