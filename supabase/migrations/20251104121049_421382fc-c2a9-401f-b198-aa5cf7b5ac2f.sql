-- Add business_models column to ideas table to store AI-generated business validation models
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS business_models JSONB DEFAULT '{}'::jsonb;