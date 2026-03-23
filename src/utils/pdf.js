// ============================================================
// PDF Generator — Visibility Infrastructure OS
// Uses jsPDF. Blob-based download for maximum browser compat.
// ============================================================

import { jsPDF } from 'jspdf';

// ── Brand colours (RGB arrays) ─────────────────────────────
const C = {
  purple:  [87,  31,  129],
  gold:    [223, 178, 74],
  teal:    [44,  151, 175],
  dark:    [26,  10,  46],
  text:    [30,  20,  50],
  muted:   [100, 90,  120],
  light:   [245, 242, 252],
  white:   [255, 255, 255],
  divider: [220, 212, 238],
};

const PW = 210;   // page width  (A4 mm)
const PH = 297;   // page height
const M  = 18;    // margin
const CW = PW - M * 2;  // content width
const FH = 14;    // footer height

// ── Trigger download from a jsPDF doc ──────────────────────
function savePDF(doc, filename) {
  const blob = doc.output('blob');
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

// ── Strip markdown inline syntax ───────────────────────────
function clean(text) {
  return (text || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .trim();
}

// ── Wrap text to width ─────────────────────────────────────
function wrap(doc, text, maxW) {
  return doc.splitTextToSize(text, maxW);
}

// ── Parse markdown to tokens ───────────────────────────────
function tokenize(text) {
  const tokens = [];
  for (const line of (text || '').split('\n')) {
    if      (line.startsWith('# '))  tokens.push({ t: 'h1', v: line.slice(2).trim() });
    else if (line.startsWith('## ')) tokens.push({ t: 'h2', v: line.slice(3).trim() });
    else if (line.startsWith('### '))tokens.push({ t: 'h3', v: line.slice(4).trim() });
    else if (/^[-*] /.test(line))    tokens.push({ t: 'li', v: line.replace(/^[-*] /, '').trim() });
    else if (/^\d+\. /.test(line))   tokens.push({ t: 'ol', v: line.replace(/^\d+\. /, '').trim(), n: line.match(/^(\d+)/)[1] });
    else if (line.startsWith('> '))  tokens.push({ t: 'bq', v: line.slice(2).trim() });
    else if (/^---/.test(line))      tokens.push({ t: 'hr' });
    else if (line.trim() === '')     tokens.push({ t: 'sp' });
    else {
      const last = tokens[tokens.length - 1];
      if (last && last.t === 'p') last.v += ' ' + line.trim();
      else tokens.push({ t: 'p', v: line.trim() });
    }
  }
  return tokens;
}

// ── Draw footer on current page ────────────────────────────
function footer(doc, pageNum, label) {
  doc.setFillColor(...C.dark);
  doc.rect(0, PH - FH, PW, FH, 'F');
  doc.setFillColor(...C.gold);
  doc.rect(0, PH - FH, PW, 0.7, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);

  doc.setTextColor(...C.gold);
  doc.text((label || '').toUpperCase().slice(0, 40), M, PH - 6);

  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.text('BEYOND THE DREAM BOARD\u2122', PW / 2, PH - 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.gold);
  doc.text(String(pageNum), PW - M, PH - 6, { align: 'right' });
}

// ── Draw a page header band ────────────────────────────────
function pageHeader(doc, label) {
  doc.setFillColor(...C.light);
  doc.rect(0, 0, PW, 11, 'F');
  doc.setFillColor(...C.purple);
  doc.rect(0, 11, PW, 0.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.purple);
  doc.text((label || '').toUpperCase().slice(0, 70), M, 7.5);
}

// ── Render token list onto pages ───────────────────────────
// Returns final page number
function renderContent(doc, tokens, label, startY, startPage) {
  let y    = startY;
  let page = startPage;

  function newPage() {
    footer(doc, page, label);
    doc.addPage();
    page++;
    pageHeader(doc, label);
    y = 18;
  }

  function need(h) {
    if (y + h > PH - FH - 6) newPage();
  }

  for (const tok of tokens) {
    switch (tok.t) {

      case 'h1': {
        need(16);
        if (y > 22) y += 3;
        doc.setFillColor(...C.purple);
        doc.rect(0, y - 5, PW, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...C.white);
        doc.text(clean(tok.v), M, y + 2.5);
        y += 12;
        break;
      }

      case 'h2': {
        need(14);
        if (y > 22) y += 4;
        doc.setFillColor(...C.gold);
        doc.rect(M, y - 3, 3, 9, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(...C.purple);
        doc.text(clean(tok.v), M + 6, y + 2);
        doc.setFillColor(...C.divider);
        doc.rect(M + 6, y + 5, CW - 6, 0.4, 'F');
        y += 11;
        break;
      }

      case 'h3': {
        need(10);
        if (y > 22) y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...C.teal);
        doc.text(clean(tok.v).toUpperCase(), M, y);
        y += 6;
        break;
      }

      case 'p': {
        const txt = clean(tok.v);
        if (!txt) break;
        const lines = wrap(doc, txt, CW);
        need(lines.length * 5 + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...C.text);
        doc.text(lines, M, y);
        y += lines.length * 5 + 3;
        break;
      }

      case 'li': {
        const txt = clean(tok.v);
        if (!txt) break;
        const lines = wrap(doc, txt, CW - 8);
        need(lines.length * 5 + 2);
        doc.setFillColor(...C.gold);
        doc.rect(M + 1, y - 1.5, 2, 2, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...C.text);
        doc.text(lines[0], M + 6, y);
        for (let i = 1; i < lines.length; i++) { y += 5; doc.text(lines[i], M + 6, y); }
        y += 5.5;
        break;
      }

      case 'ol': {
        const txt = clean(tok.v);
        if (!txt) break;
        const lines = wrap(doc, txt, CW - 10);
        need(lines.length * 5 + 2);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...C.purple);
        doc.text(`${tok.n}.`, M, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.text);
        doc.text(lines[0], M + 7, y);
        for (let i = 1; i < lines.length; i++) { y += 5; doc.text(lines[i], M + 7, y); }
        y += 5.5;
        break;
      }

      case 'bq': {
        const txt = clean(tok.v);
        if (!txt) break;
        const lines = wrap(doc, txt, CW - 10);
        need(lines.length * 5 + 8);
        y += 2;
        doc.setFillColor(...C.light);
        doc.rect(M, y - 3, CW, lines.length * 5 + 5, 'F');
        doc.setFillColor(...C.gold);
        doc.rect(M, y - 3, 2.5, lines.length * 5 + 5, 'F');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...C.text);
        doc.text(lines, M + 7, y);
        y += lines.length * 5 + 6;
        break;
      }

      case 'hr': {
        need(8);
        y += 3;
        doc.setFillColor(...C.divider);
        doc.rect(M, y, CW, 0.5, 'F');
        y += 5;
        break;
      }

      case 'sp': {
        y += 2;
        break;
      }
    }
  }

  footer(doc, page, label);
  return page;
}

// ============================================================
// SINGLE MODULE PDF
// ============================================================
export function downloadModulePDF(moduleTitle, moduleSubtitle, moduleNum, outputText, brandName = '') {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Cover page
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, PW, PH, 'F');
  doc.setFillColor(...C.purple);
  doc.rect(0, 0, PW, PH * 0.5, 'F');
  doc.setFillColor(...C.gold);
  doc.rect(0, 0, PW, 3, 'F');

  // Module badge
  doc.setFillColor(...C.gold);
  doc.rect(M, 22, 54, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...C.dark);
  doc.text(`MODULE ${moduleNum} OF 10`, M + 3, 27.5);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(...C.white);
  const titleLines = wrap(doc, moduleTitle.toUpperCase(), CW);
  doc.text(titleLines, M, 50);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...C.gold);
  doc.text(moduleSubtitle, M, 50 + titleLines.length * 11 + 4);

  if (brandName) {
    doc.setFontSize(10);
    doc.setTextColor(...C.white);
    doc.text(brandName, M, PH * 0.5 + 16);
  }

  // Bottom branding
  doc.setFillColor(...C.dark);
  doc.rect(0, PH - 20, PW, 20, 'F');
  doc.setFillColor(...C.gold);
  doc.rect(0, PH - 20, PW, 0.7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.gold);
  doc.text('BEYOND THE DREAM BOARD\u2122', PW / 2, PH - 11, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.muted);
  doc.text(`Generated ${date}  ·  Visibility Infrastructure OS`, PW / 2, PH - 5, { align: 'center' });

  // Content pages
  doc.addPage();
  pageHeader(doc, `Module ${moduleNum}: ${moduleTitle}`);
  const tokens = tokenize(outputText);
  renderContent(doc, tokens, `Module ${moduleNum}: ${moduleTitle}`, 18, 2);

  const slug    = moduleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const brand   = brandName ? `-${brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '';
  const dateStr = new Date().toISOString().slice(0, 10);
  savePDF(doc, `vios-module-${String(moduleNum).padStart(2,'0')}-${slug}${brand}-${dateStr}.pdf`);
}

// ============================================================
// FULL PLAYBOOK PDF
// ============================================================
export function downloadPlaybookPDF(state, executiveSummary = '') {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const ctx  = state.businessContext || {};
  const brand = ctx.brandName || '';
  const date  = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let   page  = 1;

  // ── PAGE 1: Master cover ────────────────────────────────────
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, PW, PH, 'F');
  doc.setFillColor(...C.purple);
  doc.rect(0, 0, PW, PH * 0.5, 'F');
  doc.setFillColor(...C.gold);
  doc.rect(0, 0, PW, 3, 'F');
  doc.setFillColor(...C.teal);
  doc.rect(0, 3, PW, 1.5, 'F');

  // Badge
  doc.setFillColor(...C.gold);
  doc.rect(M, 20, 72, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.dark);
  doc.text('VISIBILITY INFRASTRUCTURE OS', M + 3, 26.5);

  // Main title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(...C.white);
  doc.text('YOUR VISIBILITY', M, 54);
  doc.setTextColor(...C.gold);
  doc.text('INFRASTRUCTURE', M, 67);
  doc.setTextColor(...C.white);
  doc.text('OS PLAYBOOK', M, 80);

  // Divider lines
  doc.setFillColor(...C.gold);
  doc.rect(M, 88, 38, 0.8, 'F');
  doc.setFillColor(...C.teal);
  doc.rect(M + 41, 88, 18, 0.8, 'F');

  if (brand) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...C.white);
    doc.text(brand, M, 100);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  doc.text('Complete Strategy Document', M, 109);

  // Contents list
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.teal);
  doc.text("WHAT'S INSIDE", M, PH * 0.5 + 18);

  const contents = [
    'Executive Summary — ICP, pain point, USP, positioning statement',
    'Module 1: Business Context',
    'Module 2: Audience Psychology',
    'Module 3: Authority Positioning',
    'Module 4: Competitor White Space',
    'Module 5: Content Pillars',
    'Module 6: Platform Strategy',
    'Module 7: 30-Day Content Plan',
    'Module 8: Post Generator',
    'Module 9: Monetization Strategy',
    'Module 10: Revenue Acceleration',
  ];

  contents.forEach((item, i) => {
    const iy = PH * 0.5 + 28 + i * 7.5;
    doc.setFillColor(...C.gold);
    doc.rect(M + 1, iy - 1.5, 1.8, 1.8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.text(item, M + 6, iy);
  });

  // Cover footer
  doc.setFillColor(...C.dark);
  doc.rect(0, PH - 20, PW, 20, 'F');
  doc.setFillColor(...C.gold);
  doc.rect(0, PH - 20, PW, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.gold);
  doc.text('BEYOND THE DREAM BOARD\u2122', PW / 2, PH - 11, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.muted);
  doc.text(`Generated ${date}  ·  Women's words will change the world.`, PW / 2, PH - 5, { align: 'center' });

  // ── PAGE 2: Executive Summary ───────────────────────────────
  doc.addPage();
  page++;
  pageHeader(doc, 'Executive Summary');

  doc.setFillColor(...C.purple);
  doc.rect(0, 14, PW, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...C.white);
  doc.text('EXECUTIVE SUMMARY', M, 26);

  let y = 40;

  if (executiveSummary) {
    const lines = wrap(doc, executiveSummary, CW);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...C.text);
    doc.text(lines, M, y);
    y += lines.length * 5.5 + 10;
  }

  // At a glance
  doc.setFillColor(...C.gold);
  doc.rect(M, y - 3, 3, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...C.purple);
  doc.text('AT A GLANCE', M + 6, y + 2.5);
  doc.setFillColor(...C.divider);
  doc.rect(M + 6, y + 6, CW - 6, 0.4, 'F');
  y += 14;

  const fields = [
    ['Ideal Customer Profile', ctx.targetAudience],
    ['Core Audience Pain',     ctx.audienceProblem],
    ['Primary Offer',          ctx.primaryOffer],
    ['Unique Mechanism',       ctx.uniqueMechanism],
    ['Revenue Goal',           ctx.revenueGoal],
    ['Platforms',              ctx.platforms],
    ['Brand Voice',            ctx.brandVoice],
  ];

  fields.forEach(([label, value]) => {
    if (!value) return;
    const vlines = wrap(doc, value, CW - 52);
    const rowH   = Math.max(9, vlines.length * 4.8 + 4);
    doc.setFillColor(...C.light);
    doc.rect(M, y - 2.5, CW, rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.purple);
    doc.text(label, M + 2, y + 1.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.text);
    doc.text(vlines, M + 52, y + 1.5);
    y += rowH + 2;
  });

  footer(doc, page, 'Executive Summary');

  // ── MODULE SECTIONS ─────────────────────────────────────────
  const modules = [
    { number: 1,  id: 'business-context',     title: 'Business Context',     subtitle: 'Strategic Brand and Market Analysis' },
    { number: 2,  id: 'audience-psychology',  title: 'Audience Psychology',   subtitle: 'Messaging Intelligence' },
    { number: 3,  id: 'authority-positioning',title: 'Authority Positioning', subtitle: 'Differentiation System' },
    { number: 4,  id: 'competitor-whitespace',title: 'Competitor White Space',subtitle: 'Content Gap Analysis' },
    { number: 5,  id: 'content-pillars',      title: 'Content Pillars',       subtitle: 'Conversion-Oriented Strategy' },
    { number: 6,  id: 'platform-strategy',    title: 'Platform Strategy',     subtitle: 'LinkedIn & Substack Engine' },
    { number: 7,  id: 'content-plan',         title: '30-Day Content Plan',   subtitle: 'Strategic Visibility Calendar' },
    { number: 8,  id: 'post-generator',       title: 'Post Generator',        subtitle: 'Scroll-Stopping Content' },
    { number: 9,  id: 'monetization-strategy',title: 'Monetization Strategy', subtitle: 'Audience Conversion System' },
    { number: 10, id: 'revenue-acceleration', title: 'Revenue Acceleration',  subtitle: 'Monetization Clarity Engine' },
  ];

  for (const mod of modules) {
    const output = state.moduleData?.[mod.id]?.editedOutput
                || state.moduleData?.[mod.id]?.output
                || '';
    if (!output) continue;

    // Module divider page
    doc.addPage();
    page++;
    doc.setFillColor(...C.dark);
    doc.rect(0, 0, PW, PH, 'F');
    doc.setFillColor(...C.purple);
    doc.rect(0, 0, PW, 52, 'F');
    doc.setFillColor(...C.gold);
    doc.rect(0, 0, PW, 3, 'F');

    doc.setFillColor(...C.gold);
    doc.rect(M, 14, 38, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.dark);
    doc.text(`MODULE ${mod.number} OF 10`, M + 3, 19.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...C.white);
    doc.text(mod.title.toUpperCase(), M, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...C.gold);
    doc.text(mod.subtitle, M, 49);

    // List remaining content below on dark bg
    doc.setFillColor(...C.dark);
    doc.rect(0, 52, PW, PH - 52, 'F');

    footer(doc, page, `Module ${mod.number}: ${mod.title}`);

    // Content pages
    const label = `Module ${mod.number}: ${mod.title}`;
    doc.addPage();
    page++;
    pageHeader(doc, label);
    page = renderContent(doc, tokenize(output), label, 18, page);
  }

  // ── FINAL PAGE: Next Steps ──────────────────────────────────
  doc.addPage();
  page++;
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, PW, PH, 'F');
  doc.setFillColor(...C.purple);
  doc.rect(0, 0, PW, PH * 0.42, 'F');
  doc.setFillColor(...C.gold);
  doc.rect(0, 0, PW, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...C.white);
  doc.text('YOUR STRATEGY', M, 36);
  doc.setTextColor(...C.gold);
  doc.text('IS READY.', M, 49);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...C.muted);
  doc.text("Now it's time to act on it.", M, 60);

  const links = [
    ['Book a Discovery Call',  'calendly.com/vivekacoach/discovery-call'],
    ['Connect on LinkedIn',    'LinkedIn.com/in/VivekavonRosen'],
    ['Subscribe on Substack',  'vivekavonrosen.substack.com'],
    ['Email Viveka',           'Viveka@beyondthedreamboard.com'],
  ];

  let ly = PH * 0.42 + 18;
  links.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.gold);
    doc.text(label, M, ly);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C.muted);
    doc.text(value, M, ly + 6.5);
    ly += 19;
  });

  // Final branding block
  doc.setFillColor(...C.dark);
  doc.rect(0, PH - 28, PW, 28, 'F');
  doc.setFillColor(...C.gold);
  doc.rect(0, PH - 28, PW, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...C.gold);
  doc.text('BEYOND THE DREAM BOARD\u2122', PW / 2, PH - 17, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.muted);
  doc.text("Women's words will change the world.", PW / 2, PH - 10, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${date}  ·  Visibility Infrastructure OS`, PW / 2, PH - 4, { align: 'center' });

  // Save
  const brandSlug = brand ? `-${brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '';
  const dateStr   = new Date().toISOString().slice(0, 10);
  savePDF(doc, `vios-playbook${brandSlug}-${dateStr}.pdf`);
}
