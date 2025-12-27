import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlag {
  flag_key: string;
  is_enabled: boolean;
}

export const useFeatureFlags = () => {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('flag_key, is_enabled');
      
      if (error) throw error;
      
      // Convert to a map for O(1) lookups
      const flagMap: Record<string, boolean> = {};
      data?.forEach((flag: FeatureFlag) => {
        flagMap[flag.flag_key] = flag.is_enabled;
      });
      
      return flagMap;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useFeatureFlag = (flagKey: string, defaultValue = false): boolean => {
  const { data: flags } = useFeatureFlags();
  return flags?.[flagKey] ?? defaultValue;
};

export const useIsFeatureEnabled = (flagKey: string): { 
  isEnabled: boolean; 
  isLoading: boolean;
} => {
  const { data: flags, isLoading } = useFeatureFlags();
  return {
    isEnabled: flags?.[flagKey] ?? false,
    isLoading,
  };
};
