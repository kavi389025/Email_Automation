const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');
const AIActivity = require('../models/AIActivity');

/**
 * Universal AI caller with fallback chain:
 * 1. OpenRouter API
 * 2. Google Gemini API
 * 3. Deterministic / Extractive Rule Engine
 */
async function callAI({
  userId,
  emailId = null,
  type = 'summary',
  systemPrompt = '',
  userPrompt = '',
  deterministicFallbackFn,
}) {
  const startTime = Date.now();
  let result = null;
  let providerUsed = 'deterministic';
  let modelUsed = 'rule-engine-v1';
  let tokensUsed = 0;

  // 1. Try OpenRouter if configured
  if (env.ai.openRouterApiKey && env.ai.openRouterApiKey.trim() !== '') {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2.0-flash-001',
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${env.ai.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': env.clientUrl,
            'X-Title': 'MailSense AI',
          },
          timeout: 15000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (content) {
        result = content;
        providerUsed = 'openrouter';
        modelUsed = response.data?.model || 'openrouter-gemini-2.0-flash';
        tokensUsed = response.data?.usage?.total_tokens || 0;
      }
    } catch (openRouterErr) {
      console.warn(`[AIService] OpenRouter failed: ${openRouterErr.message}. Falling back to next provider...`);
    }
  }

  // 2. Try Google Gemini if OpenRouter didn't succeed
  if (!result && env.ai.geminiApiKey && env.ai.geminiApiKey.trim() !== '') {
    try {
      const genAI = new GoogleGenerativeAI(env.ai.geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt || undefined,
      });

      const geminiRes = await model.generateContent(userPrompt);
      const content = geminiRes.response.text();
      if (content) {
        result = content;
        providerUsed = 'gemini';
        modelUsed = 'gemini-1.5-flash';
        tokensUsed = Math.ceil((userPrompt.length + content.length) / 4);
      }
    } catch (geminiErr) {
      console.warn(`[AIService] Gemini API failed: ${geminiErr.message}. Falling back to deterministic engine...`);
    }
  }

  // 3. Deterministic Fallback
  if (!result && typeof deterministicFallbackFn === 'function') {
    result = deterministicFallbackFn();
    providerUsed = 'deterministic';
    modelUsed = 'extractive-rule-engine';
    tokensUsed = Math.ceil((userPrompt.length) / 4);
  }

  const executionTimeMs = Date.now() - startTime;

  // Record AI activity in database for audit history
  if (userId) {
    try {
      await AIActivity.create({
        owner: userId,
        emailId,
        type,
        prompt: userPrompt.substring(0, 500),
        output: result,
        provider: providerUsed,
        model: modelUsed,
        tokensUsed,
        executionTimeMs,
      });
    } catch (logErr) {
      console.error('[AIService] Failed to record AIActivity:', logErr.message);
    }
  }

  return {
    output: result,
    provider: providerUsed,
    model: modelUsed,
    executionTimeMs,
  };
}

module.exports = {
  callAI,
};
