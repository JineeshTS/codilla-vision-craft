/**
 * Base component for all phase task components
 * Provides common functionality for loading, saving, and error handling
 */

import { useState, useEffect, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { getPhaseArtifacts, saveTaskArtifact } from '@/lib/phaseUtils';
import { logError } from '@/lib/errorTracking';
import type { BaseTaskProps } from '@/types';

interface BaseTaskComponentProps<T> extends BaseTaskProps {
  title: string;
  description?: string;
  initialData: T;
  children: (data: T, updateData: (field: keyof T, value: T[keyof T]) => void) => ReactNode;
  validateData?: (data: T) => string | null;
}

export function BaseTaskComponent<T extends Record<string, unknown>>({
  projectId,
  phaseNumber,
  taskId,
  title,
  description,
  initialData,
  children,
  validateData,
}: BaseTaskComponentProps<T>) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getPhaseArtifacts(projectId, phaseNumber);
        
        if (result.success && result.data) {
          const taskArtifact = result.data.find((artifact: any) => artifact.task_id === taskId);
          if (taskArtifact?.artifact_data) {
            setData(taskArtifact.artifact_data as T);
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load data');
        setError(error);
        logError(error, { projectId, phaseNumber, taskId });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, phaseNumber, taskId]);

  // Update a specific field
  const updateField = (field: keyof T, value: T[keyof T]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Save data
  const handleSave = async () => {
    // Validate data if validator provided
    if (validateData) {
      const validationError = validateData(data);
      if (validationError) {
        toast({
          title: 'Validation Error',
          description: validationError,
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);
    try {
      const result = await saveTaskArtifact(projectId, phaseNumber, taskId, 'task_data', data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save');
      }
      toast({
        title: 'Success',
        description: 'Your changes have been saved.',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save');
      logError(error, { projectId, phaseNumber, taskId, data });
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const retry = () => {
    setError(null);
    setLoading(true);
    // Trigger reload by changing a dependency
    window.location.reload();
  };

  if (loading) {
    return <LoadingState variant="skeleton" />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={retry} variant="inline" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children(data, updateField)}
        
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  );
}
