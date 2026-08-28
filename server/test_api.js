const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting MailSense AI API verification tests...\n');

  try {
    // 1. Health check
    console.log('1. Testing GET /api/health...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health status:', healthRes.data.status);

    // 2. Register
    console.log('\n2. Testing POST /api/auth/register...');
    const testUser = {
      name: 'Sarah Connor',
      email: `sarah_${Date.now()}@example.com`,
      password: 'Password123!',
    };
    const regRes = await axios.post(`${BASE_URL}/auth/register`, testUser);
    const token = regRes.data.data.token;
    console.log('✅ Registered user:', regRes.data.data.user.email, 'Token received');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Login
    console.log('\n3. Testing POST /api/auth/login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    console.log('✅ Login successful for:', loginRes.data.data.user.name);

    // 4. Me endpoint
    console.log('\n4. Testing GET /api/auth/me...');
    const meRes = await axios.get(`${BASE_URL}/auth/me`, { headers: authHeaders });
    console.log('✅ Profile fetched:', meRes.data.data.name);

    // 5. Connect Sandbox Gmail Account
    console.log('\n5. Testing POST /api/email-accounts/sandbox...');
    const sandboxRes = await axios.post(
      `${BASE_URL}/email-accounts/sandbox`,
      { customEmail: 'sarah.c@sandbox.mailsense.ai' },
      { headers: authHeaders }
    );
    console.log('✅ Sandbox account created:', sandboxRes.data.data.emailAddress);

    // 6. List accounts
    console.log('\n6. Testing GET /api/email-accounts...');
    const accountsRes = await axios.get(`${BASE_URL}/email-accounts`, { headers: authHeaders });
    console.log('✅ Connected accounts count:', accountsRes.data.data.accounts.length);

    // 7. List emails
    console.log('\n7. Testing GET /api/emails...');
    const emailsRes = await axios.get(`${BASE_URL}/emails`, { headers: authHeaders });
    const emails = emailsRes.data.data.emails;
    console.log(`✅ Fetched ${emails.length} seeded emails from inbox.`);

    const targetEmail = emails[0];
    console.log('   Target Email Subject:', targetEmail.subject);

    // 8. Test AI Summarization
    console.log('\n8. Testing POST /api/ai/summarize...');
    const summaryRes = await axios.post(
      `${BASE_URL}/ai/summarize`,
      { emailId: targetEmail._id },
      { headers: authHeaders }
    );
    console.log('✅ AI Summary generated:');
    console.log('   Summary:', summaryRes.data.data.summary);
    console.log('   Sender Intent:', summaryRes.data.data.senderIntent);
    console.log('   Urgency:', summaryRes.data.data.urgency);
    console.log('   Action Items:', JSON.stringify(summaryRes.data.data.actionItems));
    console.log('   Provider used:', summaryRes.data.data.provider);

    // 9. Test AI Reply Generation
    console.log('\n9. Testing POST /api/ai/generate-reply (Professional tone)...');
    const replyRes = await axios.post(
      `${BASE_URL}/ai/generate-reply`,
      {
        emailId: targetEmail._id,
        tone: 'professional',
        userInstructions: 'Confirm that DevOps team has scheduled the Thursday rehearsal.',
      },
      { headers: authHeaders }
    );
    console.log('✅ AI Draft Reply generated:');
    console.log('   Subject:', replyRes.data.data.subject);
    console.log('   Draft Preview:\n' + replyRes.data.data.body);

    // 10. Test AI Classification
    console.log('\n10. Testing POST /api/ai/classify...');
    const classifyRes = await axios.post(
      `${BASE_URL}/ai/classify`,
      { emailId: targetEmail._id },
      { headers: authHeaders }
    );
    console.log('✅ Classification:', classifyRes.data.data.category, '| Priority:', classifyRes.data.data.priority);

    // 11. Test Sending Reply
    console.log('\n11. Testing POST /api/emails/send...');
    const sendRes = await axios.post(
      `${BASE_URL}/emails/send`,
      {
        to: targetEmail.from.email,
        subject: replyRes.data.data.subject,
        bodyText: replyRes.data.data.body,
        inReplyTo: targetEmail.gmailMessageId,
        threadId: targetEmail.threadId,
      },
      { headers: authHeaders }
    );
    console.log('✅ Email sent successfully:', sendRes.data.data.subject);

    // 12. Test Stats
    console.log('\n12. Testing GET /api/emails/stats...');
    const statsRes = await axios.get(`${BASE_URL}/emails/stats`, { headers: authHeaders });
    console.log('✅ Dashboard Stats:', statsRes.data.data);

    // 13. Test Activity & Notifications
    console.log('\n13. Testing GET /api/activity & GET /api/notifications...');
    const actRes = await axios.get(`${BASE_URL}/activity`, { headers: authHeaders });
    const notifRes = await axios.get(`${BASE_URL}/notifications`, { headers: authHeaders });
    console.log(`✅ Activity items: ${actRes.data.data.length}, Notifications: ${notifRes.data.data.length}`);

    console.log('\n🎉 ALL BACKEND APIS AND AI WORKFLOWS VERIFIED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
