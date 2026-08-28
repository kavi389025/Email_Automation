const { callAI } = require('../services/aiService');

/**
 * Generates an editable draft reply with tone selection and optional instructions
 */
async function generateReply({
  userId,
  email,
  tone = 'professional',
  userInstructions = '',
  threadMessages = [],
}) {
  const senderName = email.from?.name || email.from?.email?.split('@')[0] || 'there';
  const originalSubject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;

  const toneGuidelines = {
    professional: 'Polite, clear, business-appropriate, and solution-focused.',
    friendly: 'Warm, approachable, enthusiastic, and helpful.',
    formal: 'Strictly professional, respectful, structured, and diplomatic.',
    concise: 'Direct, brief, to the point, minimal pleasantries.',
  };

  const selectedTone = (tone || 'professional').toLowerCase();
  const toneDesc = toneGuidelines[selectedTone] || toneGuidelines.professional;

  const systemPrompt = `You are an intelligent email drafting assistant. Draft a complete, context-aware reply to the email provided.
Tone required: ${selectedTone.toUpperCase()} - ${toneDesc}
${userInstructions ? `Special Instructions from User: "${userInstructions}"` : ''}

Respond ONLY with a valid JSON object with the following structure:
{
  "subject": "${originalSubject}",
  "body": "Full body text of the reply formatted with proper paragraphs, greeting, and signoff"
}`;

  const userPrompt = `Incoming Email Context:
From: ${email.from?.name || ''} <${email.from?.email || ''}>
Subject: ${email.subject}
Received: ${new Date(email.receivedAt).toLocaleDateString()}

Email Body:
${email.bodyText || email.snippet}

Please draft a response in ${selectedTone} tone.`;

  // Deterministic Fallback Draft Generator
  const deterministicFallback = () => {
    let greeting = `Hi ${senderName},`;
    let signoff = 'Best regards,\n[Your Name]';
    let bodyIntro = `Thank you for reaching out regarding "${email.subject}".`;

    if (selectedTone === 'formal') {
      greeting = `Dear ${senderName},`;
      signoff = 'Sincerely,\n[Your Name]';
      bodyIntro = `Thank you for your correspondence concerning "${email.subject}".`;
    } else if (selectedTone === 'friendly') {
      greeting = `Hey ${senderName}!`;
      signoff = 'Cheers,\n[Your Name]';
      bodyIntro = `Thanks so much for reaching out about "${email.subject}"!`;
    } else if (selectedTone === 'concise') {
      greeting = `Hi ${senderName},`;
      signoff = 'Thanks,\n[Your Name]';
      bodyIntro = `Regarding "${email.subject}":`;
    }

    let coreResponse = '';
    const emailLower = (email.bodyText || email.snippet || '').toLowerCase();

    if (userInstructions && userInstructions.trim() !== '') {
      coreResponse = `Following up on your note: ${userInstructions.trim()}.\n\nPlease let me know if you need any additional information from my side.`;
    } else if (emailLower.includes('sign-off') || emailLower.includes('approval')) {
      coreResponse = `I have reviewed the details and everything looks aligned. I am happy to provide sign-off to proceed with the planned schedule.\n\nPlease keep me updated on the deployment progress.`;
    } else if (emailLower.includes('meeting') || emailLower.includes('sync') || emailLower.includes('discount')) {
      coreResponse = `I appreciate the update and the proposal details. The proposed timeline works well for me. Let's lock in the time and review the next steps.\n\nLooking forward to speaking soon.`;
    } else {
      coreResponse = `I have received your message and am looking into this. I will follow up with you as soon as possible with more details.\n\nFeel free to let me know if there are any urgent updates in the meantime.`;
    }

    const fullBody = `${greeting}\n\n${bodyIntro}\n\n${coreResponse}\n\n${signoff}`;

    return {
      subject: originalSubject,
      body: fullBody,
    };
  };

  const aiResult = await callAI({
    userId,
    emailId: email._id,
    type: 'reply',
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
      parsedOutput = {
        subject: originalSubject,
        body: parsedOutput,
      };
    }
  }

  return {
    subject: parsedOutput.subject || originalSubject,
    body: parsedOutput.body || '',
    tone: selectedTone,
    provider: aiResult.provider,
    model: aiResult.model,
    executionTimeMs: aiResult.executionTimeMs,
  };
}

module.exports = {
  generateReply,
};
