-- ─── AI Images (under Graph module) ──────────────────────────
CREATE TABLE IF NOT EXISTS graph_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 255),
  description  text DEFAULT '',
  style        text NOT NULL DEFAULT 'photo-realistic'
    CHECK (style IN ('photo-realistic','illustration','3d-render','watercolor','pixel-art','abstract','flat-design','anime','logo','icon')),
  prompt       text DEFAULT '',
  negative_prompt text DEFAULT '',
  width        int DEFAULT 1024,
  height       int DEFAULT 1024,
  format       text DEFAULT 'png' CHECK (format IN ('png','jpg','webp','svg')),
  status       text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','generating','completed','failed')),
  image_url    text,
  thumbnail_url text,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  tags         text[] DEFAULT '{}',
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE graph_images ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_graph_images_workspace ON graph_images(workspace_id);
CREATE INDEX idx_graph_images_status    ON graph_images(workspace_id, status);

CREATE POLICY graph_images_workspace_policy ON graph_images
FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

-- ─── AI Videos (under Graph module) ──────────────────────────
CREATE TABLE IF NOT EXISTS graph_videos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 255),
  description  text DEFAULT '',
  style        text NOT NULL DEFAULT 'marketing'
    CHECK (style IN ('marketing','explainer','product-demo','social-reel','animation','cinematic','tutorial','testimonial')),
  prompt       text DEFAULT '',
  duration_seconds int DEFAULT 30,
  resolution   text DEFAULT '1080p' CHECK (resolution IN ('720p','1080p','4k')),
  format       text DEFAULT 'mp4' CHECK (format IN ('mp4','webm','mov')),
  status       text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','generating','completed','failed')),
  video_url    text,
  thumbnail_url text,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  tags         text[] DEFAULT '{}',
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE graph_videos ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_graph_videos_workspace ON graph_videos(workspace_id);
CREATE INDEX idx_graph_videos_status    ON graph_videos(workspace_id, status);

CREATE POLICY graph_videos_workspace_policy ON graph_videos
FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);

-- ─── AI Music (under Tracks module) ─────────────────────────
CREATE TABLE IF NOT EXISTS tracks_music (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 255),
  description  text DEFAULT '',
  genre        text NOT NULL DEFAULT 'ambient'
    CHECK (genre IN ('pop','rock','electronic','ambient','jazz','classical','hip-hop','lo-fi','cinematic','jingle','podcast-intro','sound-effect')),
  prompt       text DEFAULT '',
  duration_seconds int DEFAULT 30,
  bpm          int DEFAULT 120,
  key_signature text DEFAULT 'C' CHECK (key_signature IN ('C','C#','D','D#','E','F','F#','G','G#','A','A#','B')),
  format       text DEFAULT 'mp3' CHECK (format IN ('mp3','wav','ogg','flac')),
  status       text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','generating','completed','failed')),
  audio_url    text,
  waveform_json jsonb DEFAULT '[]'::jsonb,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  tags         text[] DEFAULT '{}',
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tracks_music ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tracks_music_workspace ON tracks_music(workspace_id);
CREATE INDEX idx_tracks_music_status    ON tracks_music(workspace_id, status);
CREATE INDEX idx_tracks_music_genre     ON tracks_music(workspace_id, genre);

CREATE POLICY tracks_music_workspace_policy ON tracks_music
FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
);
