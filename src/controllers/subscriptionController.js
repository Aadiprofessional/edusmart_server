import { supabaseAdmin } from '../utils/supabase.js';

// Get all subscription plans
const getSubscriptionPlans = async (req, res) => {
  try {
    const { data: plans, error } = await supabaseAdmin()
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans',
      error: error.message
    });
  }
};

// Get addon plans
const getAddonPlans = async (req, res) => {
  try {
    const { data: addons, error } = await supabaseAdmin()
      .from('addon_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: addons
    });
  } catch (error) {
    console.error('Error fetching addon plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addon plans',
      error: error.message
    });
  }
};

// Buy subscription
const buySubscription = async (req, res) => {
  try {
    const userId = req.userId;
    const { planId, paymentMethod, transactionId, amount } = req.body;

    if (!planId || !paymentMethod || !transactionId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID, payment method, transaction ID, and amount are required'
      });
    }

    // Get the subscription plan
    const { data: plan, error: planError } = await supabaseAdmin()
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabaseAdmin()
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription'
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Create subscription
    const { data: subscription, error: subscriptionError } = await supabaseAdmin()
      .from('user_subscriptions')
      .insert([{
        user_id: userId,
        plan_id: planId,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        responses_remaining: plan.response_limit,
        responses_total: plan.response_limit,
        is_pro: true
      }])
      .select()
      .single();

    if (subscriptionError) throw subscriptionError;

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseAdmin()
      .from('subscription_transactions')
      .insert([{
        user_id: userId,
        subscription_id: subscription.id,
        plan_id: planId,
        transaction_type: 'purchase',
        amount: amount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        status: 'completed'
      }])
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Log the response addition
    await supabaseAdmin()
      .from('response_usage_logs')
      .insert([{
        user_id: userId,
        subscription_id: subscription.id,
        action: 'added',
        responses_count: plan.response_limit,
        remaining_responses: plan.response_limit,
        description: `Subscription purchased: ${plan.name}`,
        metadata: { plan_id: planId, transaction_id: transactionId }
      }]);

    res.status(201).json({
      success: true,
      message: 'Subscription purchased successfully',
      data: {
        subscription,
        transaction,
        plan
      }
    });
  } catch (error) {
    console.error('Error buying subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase subscription',
      error: error.message
    });
  }
};

// Buy addon
const buyAddon = async (req, res) => {
  try {
    const userId = req.userId;
    const { addonId, paymentMethod, transactionId, amount } = req.body;

    if (!addonId || !paymentMethod || !transactionId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Addon ID, payment method, transaction ID, and amount are required'
      });
    }

    // Check if user has an active subscription
    const { data: activeSubscription, error: subscriptionError } = await supabaseAdmin()
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subscriptionError || !activeSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Active subscription required to purchase addons'
      });
    }

    // Get the addon plan
    const { data: addon, error: addonError } = await supabaseAdmin()
      .from('addon_plans')
      .select('*')
      .eq('id', addonId)
      .eq('is_active', true)
      .single();

    if (addonError || !addon) {
      return res.status(404).json({
        success: false,
        message: 'Addon plan not found'
      });
    }

    // Create addon record
    const { data: userAddon, error: userAddonError } = await supabaseAdmin()
      .from('user_addons')
      .insert([{
        user_id: userId,
        subscription_id: activeSubscription.id,
        addon_id: addonId,
        responses_added: addon.additional_responses,
        status: 'active'
      }])
      .select()
      .single();

    if (userAddonError) throw userAddonError;

    // Update user subscription responses
    const newResponsesRemaining = activeSubscription.responses_remaining + addon.additional_responses;
    const { error: updateError } = await supabaseAdmin()
      .from('user_subscriptions')
      .update({ 
        responses_remaining: newResponsesRemaining,
        updated_at: new Date().toISOString()
      })
      .eq('id', activeSubscription.id);

    if (updateError) throw updateError;

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseAdmin()
      .from('subscription_transactions')
      .insert([{
        user_id: userId,
        subscription_id: activeSubscription.id,
        plan_id: activeSubscription.plan_id,
        transaction_type: 'addon',
        amount: amount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        status: 'completed'
      }])
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Log the response addition
    await supabaseAdmin()
      .from('response_usage_logs')
      .insert([{
        user_id: userId,
        subscription_id: activeSubscription.id,
        addon_id: userAddon.id,
        action: 'added',
        responses_count: addon.additional_responses,
        remaining_responses: newResponsesRemaining,
        description: `Addon purchased: ${addon.name}`,
        metadata: { addon_id: addonId, transaction_id: transactionId }
      }]);

    res.status(201).json({
      success: true,
      message: 'Addon purchased successfully',
      data: {
        addon: userAddon,
        transaction,
        newResponsesRemaining
      }
    });
  } catch (error) {
    console.error('Error buying addon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase addon',
      error: error.message
    });
  }
};

// Get user subscription status
const getUserSubscription = async (req, res) => {
  try {
    const userId = req.userId;

    // Get active subscription with plan details
    const { data: subscription, error } = await supabaseAdmin()
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Get active addons
    const { data: addons, error: addonsError } = await supabaseAdmin()
      .from('user_addons')
      .select(`
        *,
        addon_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (addonsError) throw addonsError;

    // Check if subscription exists and is not expired
    let isActive = false;
    let isPro = false;
    
    if (subscription) {
      const now = new Date();
      const endDate = new Date(subscription.end_date);
      isActive = endDate > now;
      isPro = subscription.is_pro && isActive;
      
      // Update status if expired
      if (!isActive && subscription.status === 'active') {
        await supabaseAdmin()
          .from('user_subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.id);
      }
    }

    res.json({
      success: true,
      data: {
        hasActiveSubscription: isActive,
        isPro: isPro,
        subscription: subscription || null,
        addons: addons || [],
        responsesRemaining: subscription?.responses_remaining || 0,
        totalResponses: subscription?.responses_total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription status',
      error: error.message
    });
  }
};

// Use response (deduct from user's remaining responses)
const useResponse = async (req, res) => {
  try {
    const userId = req.userId;
    const { responseType, queryData, responsesUsed = 1 } = req.body;

    if (!responseType) {
      return res.status(400).json({
        success: false,
        message: 'Response type is required'
      });
    }

    // Get active subscription
    const { data: subscription, error: subscriptionError } = await supabaseAdmin()
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subscriptionError || !subscription) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Check if user has enough responses
    if (subscription.responses_remaining < responsesUsed) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient responses remaining'
      });
    }

    // Check if subscription is not expired
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    if (endDate <= now) {
      // Update subscription status
      await supabaseAdmin()
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscription.id);

      return res.status(400).json({
        success: false,
        message: 'Subscription has expired'
      });
    }

    // Deduct responses
    const newResponsesRemaining = subscription.responses_remaining - responsesUsed;
    const { error: updateError } = await supabaseAdmin()
      .from('user_subscriptions')
      .update({ 
        responses_remaining: newResponsesRemaining,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) throw updateError;

    // Record response usage
    const { data: responseRecord, error: responseError } = await supabaseAdmin()
      .from('user_responses')
      .insert([{
        user_id: userId,
        subscription_id: subscription.id,
        response_type: responseType,
        query_data: queryData,
        responses_used: responsesUsed
      }])
      .select()
      .single();

    if (responseError) throw responseError;

    // Log the usage
    await supabaseAdmin()
      .from('response_usage_logs')
      .insert([{
        user_id: userId,
        subscription_id: subscription.id,
        action: 'used',
        responses_count: responsesUsed,
        remaining_responses: newResponsesRemaining,
        description: `Response used: ${responseType}`,
        metadata: { response_type: responseType, query_data: queryData }
      }]);

    res.json({
      success: true,
      message: 'Response used successfully',
      data: {
        responsesUsed,
        responsesRemaining: newResponsesRemaining,
        responseRecord
      }
    });
  } catch (error) {
    console.error('Error using response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to use response',
      error: error.message
    });
  }
};

// Get user's response usage history
const getResponseHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, responseType } = req.query;

    const offset = (page - 1) * limit;

    let query = supabaseAdmin()
      .from('user_responses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (responseType) {
      query = query.eq('response_type', responseType);
    }

    const { data: responses, error } = await query;

    if (error) throw error;

    // Get total count
    let countQuery = supabaseAdmin()
      .from('user_responses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (responseType) {
      countQuery = countQuery.eq('response_type', responseType);
    }

    const { count, error: countError } = await countQuery;

    if (countError) throw countError;

    res.json({
      success: true,
      data: {
        responses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching response history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch response history',
      error: error.message
    });
  }
};

// Get user's transaction history
const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, transactionType } = req.query;

    const offset = (page - 1) * limit;

    let query = supabaseAdmin()
      .from('subscription_transactions')
      .select(`
        *,
        subscription_plans(name, description)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (transactionType) {
      query = query.eq('transaction_type', transactionType);
    }

    const { data: transactions, error } = await query;

    if (error) throw error;

    // Get total count
    let countQuery = supabaseAdmin()
      .from('subscription_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (transactionType) {
      countQuery = countQuery.eq('transaction_type', transactionType);
    }

    const { count, error: countError } = await countQuery;

    if (countError) throw countError;

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error.message
    });
  }
};

// Get detailed usage logs
const getUsageLogs = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, action } = req.query;

    const offset = (page - 1) * limit;

    let query = supabaseAdmin()
      .from('response_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) {
      query = query.eq('action', action);
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    // Get total count
    let countQuery = supabaseAdmin()
      .from('response_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (action) {
      countQuery = countQuery.eq('action', action);
    }

    const { count, error: countError } = await countQuery;

    if (countError) throw countError;

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching usage logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage logs',
      error: error.message
    });
  }
};

// Admin: Get all subscriptions
const getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin()
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans(name, description, price),
        profiles(email, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: subscriptions, error } = await query;

    if (error) throw error;

    // Get total count
    let countQuery = supabaseAdmin()
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) throw countError;

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
};

// Refresh responses for yearly subscriptions (manual trigger for testing)
const refreshResponses = async (req, res) => {
  try {
    // Get yearly subscriptions that need refresh
    const { data: subscriptions, error } = await supabaseAdmin()
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .gt('end_date', new Date().toISOString())
      .or('last_response_refresh.is.null,last_response_refresh.lte.' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    let refreshedCount = 0;

    for (const subscription of subscriptions) {
      // Check if it's a yearly subscription (duration > 30 days)
      const { data: plan } = await supabaseAdmin()
        .from('subscription_plans')
        .select('duration_days')
        .eq('id', subscription.plan_id)
        .single();

      if (plan && plan.duration_days > 30) {
        // Refresh responses
        await supabaseAdmin()
          .from('user_subscriptions')
          .update({
            responses_remaining: subscription.responses_total,
            last_response_refresh: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        // Expire addons
        await supabaseAdmin()
          .from('user_addons')
          .update({
            status: 'expired',
            expires_at: new Date().toISOString()
          })
          .eq('subscription_id', subscription.id)
          .eq('status', 'active');

        // Log the refresh
        await supabaseAdmin()
          .from('response_usage_logs')
          .insert([{
            user_id: subscription.user_id,
            subscription_id: subscription.id,
            action: 'renewed',
            responses_count: subscription.responses_total,
            remaining_responses: subscription.responses_total,
            description: 'Monthly response refresh for yearly subscription'
          }]);

        refreshedCount++;
      }
    }

    res.json({
      success: true,
      message: `Refreshed responses for ${refreshedCount} yearly subscriptions`,
      data: { refreshedCount }
    });
  } catch (error) {
    console.error('Error refreshing responses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh responses',
      error: error.message
    });
  }
};

export {
  getSubscriptionPlans,
  getAddonPlans,
  buySubscription,
  buyAddon,
  getUserSubscription,
  useResponse,
  getResponseHistory,
  getTransactionHistory,
  getUsageLogs,
  getAllSubscriptions,
  refreshResponses
}; 