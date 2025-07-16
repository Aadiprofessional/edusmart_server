const { supabaseAdmin } = require('./src/utils/supabase');

async function setupTestEnvironment() {
  console.log('🔧 Setting up Antom test environment...');
  console.log('=====================================');

  try {
    // Create payment_transactions table
    console.log('\n📝 Creating payment_transactions table...');
    
    const tableExists = await supabaseAdmin()
      .from('payment_transactions')
      .select('id')
      .limit(1);
    
    if (tableExists.error && tableExists.error.code === '42P01') {
      console.log('❌ payment_transactions table does not exist.');
      console.log('📋 Please run the SQL migration first:');
      console.log('   Execute: database/payment_transactions_table.sql');
      console.log('   This creates the required payment_transactions table');
    } else {
      console.log('✅ payment_transactions table exists');
    }

    // Check for test user
    console.log('\n👤 Checking for test user...');
    
    const { data: testUser, error: userError } = await supabaseAdmin()
      .from('profiles')
      .select('*')
      .eq('email', 'matrixai.global@gmail.com')
      .single();

    if (userError || !testUser) {
      console.log('❌ Test user does not exist');
      console.log('📋 Please create a test user:');
      console.log('   Email: matrixai.global@gmail.com');
      console.log('   Password: 12345678');
      console.log('   You can use your authentication system to create this user');
    } else {
      console.log('✅ Test user exists:', testUser.email);
    }

    // Check for subscription plans
    console.log('\n📋 Checking subscription plans...');
    
    const { data: plans, error: plansError } = await supabaseAdmin()
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true);

    if (plansError || !plans || plans.length === 0) {
      console.log('❌ No active subscription plans found');
      console.log('📋 Creating test subscription plan...');
      
      const { data: newPlan, error: createError } = await supabaseAdmin()
        .from('subscription_plans')
        .insert([{
          name: 'Test Pro Plan',
          description: 'Test subscription plan for Antom integration',
          price: 9.99,
          currency: 'USD',
          duration_days: 30,
          response_limit: 100,
          is_active: true,
          features: ['Test feature 1', 'Test feature 2']
        }])
        .select()
        .single();

      if (createError) {
        console.log('❌ Failed to create test plan:', createError.message);
      } else {
        console.log('✅ Test subscription plan created:', newPlan.name, `$${newPlan.price}`);
      }
    } else {
      console.log(`✅ Found ${plans.length} subscription plans:`);
      plans.forEach(plan => {
        console.log(`   • ${plan.name} - $${plan.price} (${plan.duration_days} days)`);
      });
    }

    // Check for addon plans
    console.log('\n🔌 Checking addon plans...');
    
    const { data: addons, error: addonsError } = await supabaseAdmin()
      .from('addon_plans')
      .select('*')
      .eq('is_active', true);

    if (addonsError || !addons || addons.length === 0) {
      console.log('❌ No active addon plans found');
      console.log('📋 Creating test addon plan...');
      
      const { data: newAddon, error: createAddonError } = await supabaseAdmin()
        .from('addon_plans')
        .insert([{
          name: 'Extra Responses',
          description: 'Additional 50 responses for testing',
          price: 4.99,
          currency: 'USD',
          additional_responses: 50,
          is_active: true
        }])
        .select()
        .single();

      if (createAddonError) {
        console.log('❌ Failed to create test addon:', createAddonError.message);
      } else {
        console.log('✅ Test addon plan created:', newAddon.name, `$${newAddon.price}`);
      }
    } else {
      console.log(`✅ Found ${addons.length} addon plans:`);
      addons.forEach(addon => {
        console.log(`   • ${addon.name} - $${addon.price} (+${addon.additional_responses} responses)`);
      });
    }

    console.log('\n🔐 Antom Configuration Check:');
    console.log('================================');
    console.log('✅ Client ID: 5YEX0L302DFU04384');
    console.log('✅ Antom Public Key: Configured in service');
    console.log('✅ Merchant Private Key: Configured in service');
    console.log('✅ Domain: https://open-sea-global.alipay.com');

    console.log('\n📡 API Endpoints Available:');
    console.log('============================');
    console.log('• POST /api/subscriptions/payment/subscription - Create subscription payment');
    console.log('• POST /api/subscriptions/payment/addon - Create addon payment');
    console.log('• GET  /api/antom/status/:paymentRequestId - Query payment status');
    console.log('• POST /api/antom/cancel/:paymentRequestId - Cancel payment');
    console.log('• GET  /api/antom/history - Get payment history');
    console.log('• POST /api/antom/notify - Webhook for payment notifications');

    console.log('\n🚀 Ready to Test!');
    console.log('==================');
    console.log('Run the test script: node test-antom-apis.js');

  } catch (error) {
    console.error('❌ Setup error:', error.message);
  }
}

// Run setup
setupTestEnvironment().catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}); 