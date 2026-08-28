const { callAI } = require('../services/aiService');

/**
 * Summarizes an email or full thread
 */
async function summarizeEmail({ userId, email, threadMessages = [] }) {
  const contentToSummarize =
    threadMessages.length > 0
      ? threadMessages
          .map(
            (m, i) =>
              `[Message ${i + 1} from ${m.from.name || m.from.email} on ${new Date(m.receivedAt).toLocaleString()}]:\n${m.bodyText}`
          )
          .join('\n\n---\n\n')
      : `From: ${email.from.name || email.from.email} <${email.from.email}>\nSubject: ${email.subject}\nDate: ${new Date(email.receivedAt).toLocaleString()}\n\n${email.bodyText || email.snippet}`;

  const systemPrompt = `You are an expert executive email assistant. Analyze the email or thread provided and respond ONLY with a valid JSON object with the following structure:
{
  "summary": "Concise 2-3 sentence summary of the key message",
  "keyPoints": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
  "senderIntent": "Short description of what the sender wants",
  "actionItems": [
    { "task": "Task description", "assignee": "Person/Role", "deadline": "Date or timeframe if specified" }
  ],
  "urgency": "High" | "Medium" | "Low"
}`;

  const userPrompt = `Please analyze and summarize this email:\n\n${contentToSummarize}`;

  // Deterministic fallback function
  const deterministicFallback = () => {
    const text = email.bodyText || email.snippet || '';
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 10 && !l.startsWith('>') && !l.startsWith('From:'));

    // Extract sentences
    const sentences = text
      .replace(/([.?!])\s*(?=[A-Z])/g, '$1|')
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    const firstTwo = sentences.slice(0, 2).join(' ');
    const summary = firstTwo || email.snippet || email.subject;

    // Detect action items using keyword heuristic
    const actionKeywords = /(deadline|by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|tonight|[0-9]+)|sign-off|approve|review|please\s+(reply|confirm|send|provide)|action\s+required)/i;
    const actionItems = [];
    
    sentences.forEach((s) => {
      if (actionKeywords.test(s)) {
        actionItems.push({
          task: s.substring(0, 120),
          assignee: 'Recipient',
          deadline: (s.match(/by\s+([A-Za-z0-9\s,]+?(?=\.|$))/i) || [])[1] || 'As soon as possible',
        });
      }
    });

    let urgency = 'Medium';
    if (/urgent|asap|immediate|critical|blocking|today/i.test(email.subject + ' ' + text)) {
      urgency = 'High';
    } else if (/newsletter|digest|promotion|discount|sale|update/i.test(email.subject + ' ' + text)) {
      urgency = 'Low';
    }

    let senderIntent = 'Informative update';
    if (/sign-off|approval|approve/i.test(text)) senderIntent = 'Requesting sign-off and approval';
    else if (/meeting|sync|call|schedule/i.test(text)) senderIntent = 'Requesting a meeting / sync';
    else if (/discount|renewal|sale/i.test(text)) senderIntent = 'Offering plan renewal & discounts';

    const keyPoints = lines.slice(0, 3).map((l) => l.replace(/^[-*•0-9.]\s*/, ''));
    if (keyPoints.length === 0) {
      keyPoints.push(email.subject);
    }

    return {
      summary,
      keyPoints,
      senderIntent,
      actionItems,
      urgency,
    };
  };

  const aiResult = await callAI({
    userId,
    emailId: email._id,
    type: 'summary',
    systemPrompt,
    userPrompt,
    deterministicFallbackFn: deterministicFallback,
  });

  let parsedOutput = aiResult.output;
  if (typeof parsedOutput === 'string') {
    try {
      // Clean JSON markers if present
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
  summarizeEmail,
};
