
export type Space = {
  id: string;
  title: string;
  description: string;
  status: 'live' | 'scheduled' | 'ended';
  scheduled_for?: string;
  host_id: string;
  created_at: string;
  tags?: string[];
};

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  updated_at: string;
};

export type SpaceParticipant = {
  id: string;
  space_id: string;
  user_id: string;
  role: 'host' | 'speaker' | 'listener';
  joined_at: string;
};
