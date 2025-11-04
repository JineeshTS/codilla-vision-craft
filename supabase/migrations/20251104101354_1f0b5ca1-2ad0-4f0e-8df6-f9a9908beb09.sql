-- Fix the function search path security issue by recreating with proper settings
DROP TRIGGER IF EXISTS update_ui_templates_updated_at_trigger ON ui_templates;
DROP FUNCTION IF EXISTS update_ui_templates_updated_at();

CREATE OR REPLACE FUNCTION update_ui_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER update_ui_templates_updated_at_trigger
  BEFORE UPDATE ON ui_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_ui_templates_updated_at();