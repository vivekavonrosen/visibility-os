// ============================================================
// Export Utilities
// Generates clean, reusable strategy documents
// ============================================================

import { MODULES } from '../data/modules.js';
import { getEffectiveOutput } from './storage.js';

export function generateMarkdownExport(state) {
  const ctx = state.businessContext || {};
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let md = '';

  // Cover
  md += `# VISIBILITY INFRASTRUCTURE OS\n`;
  md += `## Strategy Document — ${ctx.brandName || 'Your Business'}\n\n`;
  md += `Generated: ${dateStr}\n`;
  md += `*Turn your wisdom into traction.*\n\n`;
  md += `---\n\n`;

  // Business Context Summary
  md += `## BUSINESS CONTEXT\n\n`;
  const contextFields = [
    ['Brand', ctx.brandName],
    ['Niche', ctx.niche],
    ['Primary Offer', ctx.primaryOffer],
    ['Target Audience', ctx.targetAudience],
    ['Revenue Goal', ctx.revenueGoal],
    ['Platforms', ctx.platforms],
    ['Brand Voice', ctx.brandVoice],
    ['Unique Mechanism', ctx.uniqueMechanism],
  ];
  contextFields.forEach(([label, value]) => {
    if (value) md += `**${label}:** ${value}\n\n`;
  });
  md += `---\n\n`;

  // Module outputs
  MODULES.forEach((module, index) => {
    const output = getEffectiveOutput(state, module.id);
    if (!output) return;

    md += `## MODULE ${module.number}: ${module.title.toUpperCase()}\n`;
    md += `*${module.subtitle}*\n\n`;
    md += output;
    md += '\n\n---\n\n';
  });

  md += `\n*This document was generated using Visibility Infrastructure OS.*\n`;
  md += `*© ${now.getFullYear()} — Beyond the Dream Board™*\n`;

  return md;
}

export function downloadMarkdown(state) {
  const md = generateMarkdownExport(state);
  const brandName = (state.businessContext?.brandName || 'strategy').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  const filename = `vios-${brandName}-${date}.md`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text).then(() => true).catch(() => {
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand('copy');
    document.body.removeChild(el);
    return success;
  });
}

export function getCompletionStats(state) {
  const total = MODULES.length;
  const completed = MODULES.filter(m => getEffectiveOutput(state, m.id)).length;
  const percent = Math.round((completed / total) * 100);
  return { total, completed, percent };
}
