-- Migration: Add file_path column to songs table for local audio file storage
-- PLAYX Music Platform

ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_path TEXT NULL AFTER cover_art;
