require('dotenv').config();
const SystemTest = require('./e2e/systemTest');

// Verify required environment variables
const requiredVars = ['SUPABASE_URL', 'SUPABASE_KEY'];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

// Run the system test
new SystemTest().run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Test run failed:', err);
    process.exit(1);
  });