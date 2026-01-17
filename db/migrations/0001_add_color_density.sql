-- Add color and density columns to task table
-- Migration: 0001_add_color_density
-- Created: 2026-01-17

-- Add color column with default value
ALTER TABLE task ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#FF6B6B';

-- Add density column with default value (0.5 is middle of range 0.15-0.8)
ALTER TABLE task ADD COLUMN IF NOT EXISTS density real NOT NULL DEFAULT 0.5;

-- Optional: Update existing rows with random values
-- Uncomment if you want existing tasks to have varied colors and densities
-- UPDATE task SET
--   color = (ARRAY['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'])[floor(random() * 8 + 1)],
--   density = 0.15 + (random() * 0.65)
-- WHERE color = '#FF6B6B' AND density = 0.5;
