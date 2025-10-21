import { createClient } from '@/lib/supabase/client';
import { OverlayItem } from '@/lib/types/widget';

export const widgetsService = {
  async saveWidget(widget: OverlayItem, userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('widgets')
      .insert({
        user_id: userId,
        name: widget.name,
        type: widget.type,
        config: {
          link: widget.link,
          ...widget.config
        },
        state: widget.state || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save widget:', error);
      throw error;
    }

    return data;
  },

  async updateWidget(widgetId: string, updates: { name?: string; config?: any }) {
    const supabase = createClient();

    const { error } = await supabase
      .from('widgets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', widgetId);

    if (error) {
      console.error('Failed to update widget:', error);
      throw error;
    }
  },

  async updateWidgetState(widgetId: string, state: any) {
    const supabase = createClient();

    const { error } = await supabase
      .from('widgets')
      .update({ state, updated_at: new Date().toISOString() })
      .eq('id', widgetId);

    if (error) {
      console.error('Failed to update widget state:', error);
      throw error;
    }
  },

  async deleteWidget(widgetId: string) {
    const supabase = createClient();

    const { error } = await supabase
      .from('widgets')
      .delete()
      .eq('id', widgetId);

    if (error) {
      console.error('Failed to delete widget:', error);
      throw error;
    }
  },

  async getWidgets(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('widgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch widgets:', error);
      throw error;
    }

    return data || [];
  }
};