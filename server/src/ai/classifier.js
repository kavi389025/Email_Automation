const { callAI } = require('../services/aiService');

/**
 * Classifies email category, priority, and spam flags
 */
async function classifyEmail({ userId, email }) {
  const systemPrompt = `You are an email classification AI. Analyze the email and respond ONLY with a valid JSON object:
{
  "category": "work" | "personal" | "promotions" | "updates",
  "priority": "high" | "medium" | "low",
  "isSpam": false,
  "confidence": 0.95,
  "reason": "Short explanation of classification"
}`;

  const userPrompt = `From: ${email.from?.name || ''} <${email.from?.email || ''}>
Subject: ${email.subject}
Body: ${email.bodyText || email.snippet}`;

  const deterministicFallback = () => {
    const combined = `${email.subject} ${email.bodyText || email.snippet} ${email.from?.email || ''}`.toLowerCase();
    
    let category = 'inbox';
    let priority = 'medium';
    let isSpam = false;
    let reason = 'General correspondence';

    if (/promotion|coupon|discount|deal|flash sale|unsubscribe|off\b|shop now/i.test(combined)) {
      category = 'promotions';
      priority = 'low';
      reason = 'Contains marketing keywords and discount offers';
    } else if (/security alert|login detected|sign-in|verification code|password reset|digest|invoice|receipt/i.test(combined)) {
      category = 'updates';
      priority = /security|alert|fraud/i.test(combined) ? 'high' : 'medium';
      reason = 'Automated service or account update';
    } else if (/migration|sprint|deploy|architecture|q[1-4]|deadline|approval|sign-off|contract|client|meeting|team/i.test(combined)) {
      category = 'work';
      priority = /urgent|critical|sign-off|deadline/i.test(combined) ? 'high' : 'medium';
      reason = 'Contains work-related planning and operational keywords';
    } else {
      category = 'personal';
      priority = 'medium';
      reason = 'Direct personal communication';
    }

    if (/win \$|lottery|free bitcoin|wire money|inheritance/i.test(combined)) {
      isSpam = true;
      priority = 'low';
      reason = 'Suspicious spam indicators detected';
    }

    return {
      category,
      priority,
      isSpam,
      confidence: 0.9,
      reason,
    };
  };

  const aiResult = await callAI({
    userId,
    emailId: email._id,
    type: 'classification',
    systemPrompt,
    userPrompt,
    deterministicFallbackFn: deterministicFallback,
  });

  let parsedOutput = aiResult.output;
  if (typeof parsedOutput === 'string') {
    try {
      const cleaned = parsedOutput.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      parsedOutput = JSON.parse(cleaned);
    } catch (parseErr) {
      parsedOutput = deterministicFallback();
    }
  }

  return {
    ...parsedOutput,
    provider: aiResult.provider,
    model: aiResult.model,
    executionTimeMs: aiResult.executionTimeMs,
  };
}

module.exports = {
  classifyEmail,
};
