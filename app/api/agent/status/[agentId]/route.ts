import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: Request,
  { params }: { params: { agentId: string } }
) {
  try {
    const { data, error } = await supabase
      .from('agent_configs')
      .select('creation_progress')
      .eq('id', params.agentId)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      progress: data.creation_progress
    });

  } catch (error) {
    console.error('Failed to get agent status:', error);
    return NextResponse.json(
      { success: false, message: "Failed to get agent status" },
      { status: 500 }
    );
  }
}
