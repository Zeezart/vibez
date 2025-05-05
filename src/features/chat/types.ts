
export interface Message {
  id: string;
  user_id: string;
  space_id: string;
  text: string;
  created_at: string;
  user: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}
