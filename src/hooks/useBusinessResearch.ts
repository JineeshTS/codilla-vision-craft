import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/errorTracking';

interface BusinessResearchData {
  executive_summary?: { content: string; edited_by_user: boolean };
  swot?: any;
  business_model_canvas?: any;
  lean_canvas?: any;
  value_proposition_canvas?: any;
  porters_five_forces?: any;
  blue_ocean_canvas?: any;
  gtm_strategy?: any;
  unit_economics?: any;
  risk_matrix?: any;
  market_research?: { content: string; edited_by_user: boolean };
  competitive_analysis?: { content: string; edited_by_user: boolean };
  [key: string]: any;
}

export const useBusinessResearch = (ideaId: string) => {
  const [data, setData] = useState<BusinessResearchData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [ideaId]);

  const fetchData = async () => {
    try {
      const { data: idea, error } = await supabase
        .from('ideas')
        .select('business_research_data, validation_summary')
        .eq('id', ideaId)
        .single();

      if (error) throw error;

      // Merge AI-generated content with saved data
      const savedData = (idea.business_research_data as any) || {};
      const aiData = (idea.validation_summary as any) || {};

      setData({
        executive_summary: savedData.executive_summary || {
          content: aiData.executive_summary || '',
          edited_by_user: false
        },
        market_research: savedData.market_research || {
          content: aiData.market_opportunity || '',
          edited_by_user: false
        },
        competitive_analysis: savedData.competitive_analysis || {
          content: aiData.competitive_landscape || '',
          edited_by_user: false
        },
        swot: savedData.swot || {},
        business_model_canvas: savedData.business_model_canvas || {},
        lean_canvas: savedData.lean_canvas || {},
        value_proposition_canvas: savedData.value_proposition_canvas || {},
        porters_five_forces: savedData.porters_five_forces || {},
        blue_ocean_canvas: savedData.blue_ocean_canvas || {},
        gtm_strategy: savedData.gtm_strategy || {},
        unit_economics: savedData.unit_economics || {},
        risk_matrix: savedData.risk_matrix || {},
      });
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error fetching business research'), { ideaId });
      toast({
        title: 'Error',
        description: 'Failed to load business research data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newData: Partial<BusinessResearchData>) => {
    setSaving(true);
    try {
      const updatedData = { ...data, ...newData };
      
      const { error } = await supabase
        .from('ideas')
        .update({ 
          business_research_data: updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', ideaId);

      if (error) throw error;

      setData(updatedData);
      
      toast({
        title: 'Saved',
        description: 'Changes saved successfully',
      });
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error saving business research'), { ideaId, newData });
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return { data, loading, saving, saveData, refetch: fetchData };
};
