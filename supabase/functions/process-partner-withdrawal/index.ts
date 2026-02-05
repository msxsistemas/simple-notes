import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const wooviApiKey = Deno.env.get('WOOVI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, fee } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing withdrawal for user ${user.id}, amount: ${amount}, fee: ${fee}`);

    // Get the partner profile linked to this user
    const { data: partnerProfile, error: partnerError } = await supabase
      .from('split_partners')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (partnerError || !partnerProfile) {
      console.error('Partner profile not found:', partnerError);
      return new Response(
        JSON.stringify({ error: 'Partner profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Partner profile found: ${partnerProfile.name}, pix_key: ${partnerProfile.pix_key}`);

    const netAmount = amount - fee;
    
    // Create withdrawal record in pending status first
    const { data: withdrawal, error: insertError } = await supabase
      .from('withdrawals')
      .insert({
        partner_id: partnerProfile.id,
        user_id: partnerProfile.user_id,
        recipient_name: partnerProfile.name,
        document: partnerProfile.document || '',
        pix_key: partnerProfile.pix_key,
        amount,
        fee,
        total: netAmount,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating withdrawal record:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create withdrawal record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Withdrawal record created: ${withdrawal.id}`);

    // Call Woovi API to withdraw from subaccount
    // API: POST /api/v1/subaccount/{pix_key}/withdraw
    const pixKey = encodeURIComponent(partnerProfile.pix_key);
    const wooviResponse = await fetch(
      `https://api.woovi.com/api/v1/subaccount/${pixKey}/withdraw`,
      {
        method: 'POST',
        headers: {
          'Authorization': wooviApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const wooviResult = await wooviResponse.json();
    console.log('Woovi API response:', JSON.stringify(wooviResult));

    if (!wooviResponse.ok) {
      console.error('Woovi API error:', wooviResult);
      
      // Update withdrawal to failed
      await supabase
        .from('withdrawals')
        .update({ status: 'failed' })
        .eq('id', withdrawal.id);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to process withdrawal with payment provider',
          details: wooviResult 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update withdrawal to completed
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({ status: 'completed' })
      .eq('id', withdrawal.id);

    if (updateError) {
      console.error('Error updating withdrawal status:', updateError);
    }

    console.log(`Withdrawal ${withdrawal.id} completed successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        withdrawal: { ...withdrawal, status: 'completed' },
        transaction: wooviResult.transaction 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
