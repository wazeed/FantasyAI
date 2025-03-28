const { createClient } = require('@supabase/supabase-js');
const logger = require('./mockLoggingService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

function generateTestUser(index = 1) {
  // Use a domain that bypasses email validation
  return {
    email: `testuser${index}@supamail.com`,  
    password: `TestPassword${index}!`,
    profile: {
      username: `testuser${index}`,
      display_name: `Test User ${index}`
    }
  };
}

async function waitForCondition(condition, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return true;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
}

module.exports = {
  supabase,
  logger,
  generateTestUser,
  waitForCondition
};