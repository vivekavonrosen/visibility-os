// ============================================================
// PDF Generator — Formatted module output with brand styling
// Uses jsPDF for clean, text-based PDF generation
// ============================================================

import { jsPDF } from 'jspdf';

const BRAND = {
  purple:    [87,  31,  129],
  gold:      [223, 178, 74],
  teal:      [44,  151, 175],
  dark:      [26,  10,  46],
  text:      [30,  20,  50],
  muted:     [100, 90,  120],
  light:     [245, 242, 252],
  white:     [255, 255, 255],
  divider:   [220, 212, 238],
};

const PAGE_W    = 210;  // A4 mm
const PAGE_H    = 297;
const MARGIN    = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H  = 16;

// ── Parse markdown into structured tokens ──────────────────
function parseMarkdown(text) {
  const lines = text.split('\n');
  const tokens = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      tokens.push({ type: 'h1', text: line.slice(2).trim() });
    } else if (line.startsWith('## ')) {
      tokens.push({ type: 'h2', text: line.slice(3).trim() });
    } else if (line.startsWith('### ')) {
      tokens.push({ type: 'h3', text: line.slice(4).trim() });
    } else if (/^[-*] /.test(line)) {
      tokens.push({ type: 'bullet', text: line.replace(/^[-*] /, '').trim() });
    } else if (/^\d+\. /.test(line)) {
      tokens.push({ type: 'numbered', text: line.replace(/^\d+\. /, '').trim(), num: line.match(/^(\d+)/)[1] });
    } else if (line.startsWith('> ')) {
      tokens.push({ type: 'quote', text: line.slice(2).trim() });
    } else if (line.startsWith('---') || line.startsWith('***')) {
      tokens.push({ type: 'divider' });
    } else if (line.trim() === '') {
      tokens.push({ type: 'spacer' });
    } else {
      // Merge consecutive paragraph lines
      if (tokens.length > 0 && tokens[tokens.length - 1].type === 'paragraph') {
        tokens[tokens.length - 1].text += ' ' + line.trim();
      } else {
        tokens.push({ type: 'paragraph', text: line.trim() });
      }
    }
  }
  return tokens;
}

// ── Strip markdown inline syntax for clean PDF text ────────
function cleanInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // bold
    .replace(/\*(.+?)\*/g, '$1')       // italic
    .replace(/`(.+?)`/g, '$1')         // code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .trim();
}

// ── Wrap text to fit content width ─────────────────────────
function wrapText(doc, text, maxWidth) {
  return doc.splitTextToSize(text, maxWidth);
}

// ── Draw page footer ────────────────────────────────────────
function drawFooter(doc, pageNum, totalPages, moduleTitle) {
  const y = PAGE_H - 10;

  // Footer background bar
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, 'F');

  // Gold accent line above footer
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, 0.8, 'F');

  // Left: module name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...BRAND.gold);
  doc.text(moduleTitle.toUpperCase(), MARGIN, y);

  // Center: brand
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('BEYOND THE DREAM BOARD\u2122', PAGE_W / 2, y, { align: 'center' });

  // Right: page number
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.gold);
  doc.text(`${pageNum} / ${totalPages}`, PAGE_W - MARGIN, y, { align: 'right' });
}

// ── Draw cover page ─────────────────────────────────────────
function drawCover(doc, moduleNum, moduleTitle, moduleSubtitle, brandName, generatedDate) {
  // Dark background
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Purple gradient band (simulate with rect)
  doc.setFillColor(...BRAND.purple);
  doc.rect(0, 0, PAGE_W, PAGE_H * 0.55, 'F');

  // Overlay subtle dark gradient at top
  doc.setFillColor(26, 10, 46);
  doc.rect(0, 0, PAGE_W, 60, 'F');

  // Gold accent bar at top
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, 0, PAGE_W, 3, 'F');

  // Module badge
  doc.setFillColor(...BRAND.gold);
  doc.roundedRect(MARGIN, 28, 52, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.dark);
  doc.text(`MODULE ${moduleNum} OF 10`, MARGIN + 4, 34.5);

  // Big module title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(moduleTitle.toUpperCase(), CONTENT_W);
  doc.text(titleLines, MARGIN, 58);

  // Subtitle
  const subtitleY = 58 + (titleLines.length * 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.gold);
  doc.text(moduleSubtitle, MARGIN, subtitleY);

  // Divider line
  const divY = subtitleY + 10;
  doc.setFillColor(...BRAND.gold);
  doc.rect(MARGIN, divY, 40, 0.7, 'F');

  // Teal accent line
  doc.setFillColor(...BRAND.teal);
  doc.rect(MARGIN + 43, divY, 20, 0.7, 'F');

  // Brand name (if provided)
  if (brandName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(brandName, MARGIN, divY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 160, 210);
    doc.text('Visibility Infrastructure OS — Strategy Output', MARGIN, divY + 26);
  }

  // Description box in lower half
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(MARGIN, PAGE_H * 0.55 + 20, CONTENT_W, 60, 4, 4, 'F');

  // "What this module delivers" section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.teal);
  doc.text('WHAT THIS MODULE DELIVERS', MARGIN, PAGE_H * 0.55 + 32);

  const deliverables = {
    'Business Context':        ['Strategic foundation and market analysis', 'Brand opportunity and positioning options', 'Platform and competitive landscape overview'],
    'Audience Psychology':     ['Deep audience psychology profile', 'Messaging angles, hooks, and trust themes', 'Contrarian angles and messaging mistakes to avoid'],
    'Authority Positioning':   ['Category positioning and differentiation strategy', 'Signature frameworks and credibility drivers', 'Authority signals and brand voice examples'],
    'Competitor White Space':  ['Competitor content pattern analysis', 'Strategic white-space opportunities', 'Copy This / Avoid This decision table'],
    'Content Pillars':         ['5 conversion-oriented content pillars', 'Post ideas, formats, and buyer journey mapping', 'Pillar mix recommendation for growth and monetization'],
    'Platform Strategy':       ['LinkedIn and Substack strategy tailored to your brand', 'Native vs repurposed content guidance', 'Repurposing workflow across platforms'],
    '30-Day Content Plan':     ['30-day strategic post calendar', 'Hook, message, emotion, and CTA for every day', 'Top posts for growth and revenue flagged'],
    'Post Generator':          ['High-performing post ready to publish', '5 alternative hooks and 3 CTA variations', 'Strategic breakdown of why it works'],
    'Monetization Strategy':   ['Follower-to-customer conversion journey', 'Offer ladder, pricing logic, and lead magnets', 'Fastest path and scalable path to revenue'],
    'Revenue Acceleration':    ['30-day revenue action plan', 'Offer optimization and conversion system', 'What to stop doing and top action this week'],
  };

  const items = deliverables[moduleTitle] || [];
  items.forEach((item, i) => {
    const iy = PAGE_H * 0.55 + 44 + (i * 9);
    doc.setFillColor(...BRAND.gold);
    doc.circle(MARGIN + 2, iy - 1.5, 1.2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(200, 190, 220);
    doc.text(item, MARGIN + 7, iy);
  });

  // Bottom branding
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, PAGE_H - 22, PAGE_W, 22, 'F');
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, PAGE_H - 22, PAGE_W, 0.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.gold);
  doc.text('BEYOND THE DREAM BOARD\u2122', PAGE_W / 2, PAGE_H - 13, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 130, 180);
  doc.text(`Generated ${generatedDate}  ·  Visibility Infrastructure OS  ·  Women's words will change the world.`, PAGE_W / 2, PAGE_H - 7, { align: 'center' });
}

// ── Main export function ────────────────────────────────────
export function downloadModulePDF(moduleTitle, moduleSubtitle, moduleNum, outputText, brandName = '') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const generatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── Cover page ──
  drawCover(doc, moduleNum, moduleTitle, moduleSubtitle, brandName, generatedDate);

  // ── Content pages ──
  doc.addPage();

  let y = MARGIN + 6;
  let pageNum = 2;

  function checkPage(neededHeight = 12) {
    if (y + neededHeight > PAGE_H - FOOTER_H - 6) {
      drawFooter(doc, pageNum, '?', moduleTitle);
      doc.addPage();
      pageNum++;
      y = MARGIN + 6;

      // Subtle header on continuation pages
      doc.setFillColor(...BRAND.light);
      doc.rect(0, 0, PAGE_W, 10, 'F');
      doc.setFillColor(...BRAND.purple);
      doc.rect(0, 10, PAGE_W, 0.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...BRAND.purple);
      doc.text(`${moduleNum}. ${moduleTitle.toUpperCase()}  ·  ${moduleSubtitle.toUpperCase()}`, MARGIN, 6.5);
      y = 16;
    }
  }

  // Page 2 header
  doc.setFillColor(...BRAND.light);
  doc.rect(0, 0, PAGE_W, 14, 'F');
  doc.setFillColor(...BRAND.purple);
  doc.rect(0, 14, PAGE_W, 0.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.purple);
  doc.text(`MODULE ${moduleNum}  ·  ${moduleTitle.toUpperCase()}`, MARGIN, 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.muted);
  doc.text(moduleSubtitle, MARGIN, 11);
  y = 22;

  const tokens = parseMarkdown(outputText);
  let bulletGroup = false;

  for (const token of tokens) {
    switch (token.type) {

      case 'h1': {
        checkPage(20);
        if (y > 24) y += 4;
        // Purple background band
        doc.setFillColor(...BRAND.purple);
        doc.rect(0, y - 5, PAGE_W, 13, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text(cleanInline(token.text), MARGIN, y + 3);
        y += 14;
        bulletGroup = false;
        break;
      }

      case 'h2': {
        checkPage(16);
        if (y > 24) y += 5;
        // Gold left accent bar
        doc.setFillColor(...BRAND.gold);
        doc.rect(MARGIN, y - 4, 3, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...BRAND.purple);
        doc.text(cleanInline(token.text), MARGIN + 6, y + 2.5);
        // Thin divider under h2
        doc.setFillColor(...BRAND.divider);
        doc.rect(MARGIN + 6, y + 5, CONTENT_W - 6, 0.4, 'F');
        y += 12;
        bulletGroup = false;
        break;
      }

      case 'h3': {
        checkPage(12);
        if (y > 24) y += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...BRAND.teal);
        doc.text(cleanInline(token.text).toUpperCase(), MARGIN, y);
        y += 7;
        bulletGroup = false;
        break;
      }

      case 'paragraph': {
        const cleaned = cleanInline(token.text);
        if (!cleaned) break;
        const lines = wrapText(doc, cleaned, CONTENT_W);
        checkPage(lines.length * 5 + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...BRAND.text);
        doc.text(lines, MARGIN, y);
        y += lines.length * 5 + 3;
        bulletGroup = false;
        break;
      }

      case 'bullet': {
        const cleaned = cleanInline(token.text);
        if (!cleaned) break;
        const lines = wrapText(doc, cleaned, CONTENT_W - 8);
        checkPage(lines.length * 5 + 2);
        if (!bulletGroup) { y += 2; bulletGroup = true; }
        // Gold bullet dot
        doc.setFillColor(...BRAND.gold);
        doc.circle(MARGIN + 2, y - 1.2, 1.4, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...BRAND.text);
        doc.text(lines[0], MARGIN + 6, y);
        if (lines.length > 1) {
          for (let i = 1; i < lines.length; i++) {
            y += 5;
            doc.text(lines[i], MARGIN + 6, y);
          }
        }
        y += 5.5;
        break;
      }

      case 'numbered': {
        const cleaned = cleanInline(token.text);
        if (!cleaned) break;
        const lines = wrapText(doc, cleaned, CONTENT_W - 10);
        checkPage(lines.length * 5 + 2);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...BRAND.purple);
        doc.text(`${token.num}.`, MARGIN, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...BRAND.text);
        doc.text(lines[0], MARGIN + 7, y);
        if (lines.length > 1) {
          for (let i = 1; i < lines.length; i++) {
            y += 5;
            doc.text(lines[i], MARGIN + 7, y);
          }
        }
        y += 5.5;
        bulletGroup = false;
        break;
      }

      case 'quote': {
        const cleaned = cleanInline(token.text);
        if (!cleaned) break;
        const lines = wrapText(doc, cleaned, CONTENT_W - 12);
        checkPage(lines.length * 5 + 8);
        y += 2;
        doc.setFillColor(...BRAND.light);
        doc.roundedRect(MARGIN, y - 4, CONTENT_W, lines.length * 5 + 6, 2, 2, 'F');
        doc.setFillColor(...BRAND.gold);
        doc.rect(MARGIN, y - 4, 2.5, lines.length * 5 + 6, 'F');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...BRAND.text);
        doc.text(lines, MARGIN + 7, y);
        y += lines.length * 5 + 6;
        break;
      }

      case 'divider': {
        checkPage(8);
        y += 3;
        doc.setFillColor(...BRAND.divider);
        doc.rect(MARGIN, y, CONTENT_W, 0.5, 'F');
        y += 6;
        bulletGroup = false;
        break;
      }

      case 'spacer': {
        y += 2;
        bulletGroup = false;
        break;
      }
    }
  }

  // Finalize footer page numbers
  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages, moduleTitle);
  }

  // Save
  const safeName = moduleTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const brandSlug = brandName ? `-${brandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '';
  doc.save(`vios-module-${String(moduleNum).padStart(2, '0')}-${safeName}${brandSlug}.pdf`);
}

// ============================================================
// FULL PLAYBOOK PDF — all modules in one document
// ============================================================

export function downloadPlaybookPDF(state, executiveSummary = '') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const ctx = state.businessContext || {};
  const brandName = ctx.brandName || '';
  const generatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── MASTER COVER PAGE ──────────────────────────────────────
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Purple top half
  doc.setFillColor(...BRAND.purple);
  doc.rect(0, 0, PAGE_W, PAGE_H * 0.52, 'F');

  // Subtle dark overlay top
  doc.setFillColor(26, 10, 46);
  doc.rect(0, 0, PAGE_W, 50, 'F');

  // Gold top bar
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, 0, PAGE_W, 3, 'F');

  // Teal accent
  doc.setFillColor(...BRAND.teal);
  doc.rect(0, 3, PAGE_W, 1.5, 'F');

  // PLAYBOOK badge
  doc.setFillColor(...BRAND.gold);
  doc.roundedRect(MARGIN, 22, 60, 11, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.dark);
  doc.text('VISIBILITY INFRASTRUCTURE OS', MARGIN + 4, 29);

  // Main title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  doc.setTextColor(255, 255, 255);
  doc.text('YOUR VISIBILITY', MARGIN, 58);
  doc.setTextColor(...BRAND.gold);
  doc.text('INFRASTRUCTURE', MARGIN, 71);
  doc.setTextColor(255, 255, 255);
  doc.text('OS PLAYBOOK', MARGIN, 84);

  // Gold divider line
  doc.setFillColor(...BRAND.gold);
  doc.rect(MARGIN, 92, 40, 0.8, 'F');
  doc.setFillColor(...BRAND.teal);
  doc.rect(MARGIN + 43, 92, 20, 0.8, 'F');

  // Brand name
  if (brandName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(brandName, MARGIN, 104);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 160, 210);
  doc.text('Complete Strategy Document', MARGIN, 113);

  // What's inside box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(MARGIN, PAGE_H * 0.52 + 14, CONTENT_W, 76, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.teal);
  doc.text("WHAT'S INSIDE", MARGIN, PAGE_H * 0.52 + 26);

  const contents = [
    'Executive Summary — ICP, pain point, solution, USP, and positioning',
    'Module 1: Business Context — Strategic foundation and market analysis',
    'Module 2: Audience Psychology — Buyer psychology and messaging intelligence',
    'Module 3: Authority Positioning — Differentiation and credibility system',
    'Module 4: Competitor White Space — Content gap and opportunity analysis',
    'Module 5: Content Pillars — Conversion-oriented content themes',
    'Module 6: Platform Strategy — LinkedIn and Substack engine',
    'Module 7: 30-Day Content Plan — Strategic visibility calendar',
    'Module 8: Post Generator — Scroll-stopping content creation',
    'Module 9: Monetization Strategy — Audience conversion roadmap',
    'Module 10: Revenue Acceleration — 30-day income milestone plan',
  ];

  contents.forEach((item, i) => {
    const iy = PAGE_H * 0.52 + 36 + (i * 7.2);
    doc.setFillColor(...BRAND.gold);
    doc.circle(MARGIN + 2, iy - 1.5, 1.1, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(190, 178, 210);
    doc.text(item, MARGIN + 6.5, iy);
  });

  // Bottom footer
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, PAGE_H - 22, PAGE_W, 22, 'F');
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, PAGE_H - 22, PAGE_W, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.gold);
  doc.text('BEYOND THE DREAM BOARD\u2122', PAGE_W / 2, PAGE_H - 13, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 130, 180);
  doc.text(`Generated ${generatedDate}  ·  Women's words will change the world.`, PAGE_W / 2, PAGE_H - 7, { align: 'center' });

  // ── Helper to render a content section ─────────────────────
  let currentPageNum = 1;

  function addContentPage(sectionLabel) {
    doc.addPage();
    currentPageNum++;
    // Light header band
    doc.setFillColor(...BRAND.light);
    doc.rect(0, 0, PAGE_W, 12, 'F');
    doc.setFillColor(...BRAND.purple);
    doc.rect(0, 12, PAGE_W, 0.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.purple);
    doc.text(sectionLabel.toUpperCase(), MARGIN, 7.5);
    return 18; // starting y
  }

  function renderTokens(doc, tokens, sectionLabel, startY) {
    let y = startY;
    let bulletGroup = false;
    let pageFooterLabel = sectionLabel;

    function checkPage(neededHeight = 12) {
      if (y + neededHeight > PAGE_H - FOOTER_H - 6) {
        // Footer on current page
        doc.setFillColor(...BRAND.dark);
        doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, 'F');
        doc.setFillColor(...BRAND.gold);
        doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, 0.8, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...BRAND.gold);
        doc.text(pageFooterLabel.toUpperCase(), MARGIN, PAGE_H - 8);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('BEYOND THE DREAM BOARD\u2122', PAGE_W / 2, PAGE_H - 8, { align: 'center' });
        doc.setTextColor(...BRAND.gold);
        doc.setFont('helvetica', 'normal');
        doc.text(`${currentPageNum}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });

        // New page
        doc.addPage();
        currentPageNum++;
        doc.setFillColor(...BRAND.light);
        doc.rect(0, 0, PAGE_W, 12, 'F');
        doc.setFillColor(...BRAND.purple);
        doc.rect(0, 12, PAGE_W, 0.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...BRAND.purple);
        doc.text(sectionLabel.toUpperCase(), MARGIN, 7.5);
        y = 18;
      }
    }

    for (const token of tokens) {
      switch (token.type) {
        case 'h1': {
          checkPage(18);
          if (y > 22) y += 3;
          doc.setFillColor(...BRAND.purple);
          doc.rect(0, y - 5, PAGE_W, 13, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(255, 255, 255);
          doc.text(cleanInline(token.text), MARGIN, y + 3);
          y += 13;
          bulletGroup = false;
          break;
        }
        case 'h2': {
          checkPage(14);
          if (y > 22) y += 4;
          doc.setFillColor(...BRAND.gold);
          doc.rect(MARGIN, y - 4, 3, 10, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(...BRAND.purple);
          doc.text(cleanInline(token.text), MARGIN + 6, y + 2);
          doc.setFillColor(...BRAND.divider);
          doc.rect(MARGIN + 6, y + 5, CONTENT_W - 6, 0.4, 'F');
          y += 11;
          bulletGroup = false;
          break;
        }
        case 'h3': {
          checkPage(10);
          if (y > 22) y += 2;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(...BRAND.teal);
          doc.text(cleanInline(token.text).toUpperCase(), MARGIN, y);
          y += 6;
          bulletGroup = false;
          break;
        }
        case 'paragraph': {
          const cleaned = cleanInline(token.text);
          if (!cleaned) break;
          const lines = wrapText(doc, cleaned, CONTENT_W);
          checkPage(lines.length * 5 + 2);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...BRAND.text);
          doc.text(lines, MARGIN, y);
          y += lines.length * 5 + 3;
          bulletGroup = false;
          break;
        }
        case 'bullet': {
          const cleaned = cleanInline(token.text);
          if (!cleaned) break;
          const lines = wrapText(doc, cleaned, CONTENT_W - 8);
          checkPage(lines.length * 5 + 2);
          if (!bulletGroup) { y += 1; bulletGroup = true; }
          doc.setFillColor(...BRAND.gold);
          doc.circle(MARGIN + 2, y - 1.2, 1.3, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...BRAND.text);
          doc.text(lines[0], MARGIN + 6, y);
          for (let i = 1; i < lines.length; i++) { y += 5; doc.text(lines[i], MARGIN + 6, y); }
          y += 5;
          break;
        }
        case 'numbered': {
          const cleaned = cleanInline(token.text);
          if (!cleaned) break;
          const lines = wrapText(doc, cleaned, CONTENT_W - 10);
          checkPage(lines.length * 5 + 2);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(...BRAND.purple);
          doc.text(`${token.num}.`, MARGIN, y);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...BRAND.text);
          doc.text(lines[0], MARGIN + 7, y);
          for (let i = 1; i < lines.length; i++) { y += 5; doc.text(lines[i], MARGIN + 7, y); }
          y += 5.5;
          bulletGroup = false;
          break;
        }
        case 'quote': {
          const cleaned = cleanInline(token.text);
          if (!cleaned) break;
          const lines = wrapText(doc, cleaned, CONTENT_W - 12);
          checkPage(lines.length * 5 + 8);
          y += 2;
          doc.setFillColor(...BRAND.light);
          doc.roundedRect(MARGIN, y - 4, CONTENT_W, lines.length * 5 + 6, 2, 2, 'F');
          doc.setFillColor(...BRAND.gold);
          doc.rect(MARGIN, y - 4, 2.5, lines.length * 5 + 6, 'F');
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(...BRAND.text);
          doc.text(lines, MARGIN + 7, y);
          y += lines.length * 5 + 6;
          break;
        }
        case 'divider': {
          checkPage(8);
          y += 3;
          doc.setFillColor(...BRAND.divider);
          doc.rect(MARGIN, y, CONTENT_W, 0.5, 'F');
          y += 5;
          bulletGroup = false;
          break;
        }
        case 'spacer': {
          y += 2;
          bulletGroup = false;
          break;
        }
      }
    }

    // Footer on last page of this section
    doc.setFillColor(...BRAND.dark);
    doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, 'F');
    doc.setFillColor(...BRAND.gold);
    doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, 0.8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.gold);
    doc.text(pageFooterLabel.toUpperCase(), MARGIN, PAGE_H - 8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('BEYOND THE DREAM BOARD\u2122', PAGE_W / 2, PAGE_H - 8, { align: 'center' });
    doc.setTextColor(...BRAND.gold);
    doc.setFont('helvetica', 'normal');
    doc.text(`${currentPageNum}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
  }

  // ── EXECUTIVE SUMMARY PAGE ──────────────────────────────────
  let y = addContentPage('Executive Summary');

  // Purple section header
  doc.setFillColor(...BRAND.purple);
  doc.rect(0, y - 4, PAGE_W, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('EXECUTIVE SUMMARY', MARGIN, y + 7);
  y += 20;

  if (executiveSummary) {
    const summaryLines = wrapText(doc, executiveSummary, CONTENT_W);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.text);
    doc.text(summaryLines, MARGIN, y);
    y += summaryLines.length * 5.5 + 10;
  }

  // AT A GLANCE table
  doc.setFillColor(...BRAND.gold);
  doc.rect(MARGIN, y - 4, 3, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.purple);
  doc.text('AT A GLANCE', MARGIN + 6, y + 2);
  doc.setFillColor(...BRAND.divider);
  doc.rect(MARGIN + 6, y + 5, CONTENT_W - 6, 0.4, 'F');
  y += 14;

  const glanceFields = [
    ['Ideal Customer Profile', ctx.targetAudience],
    ['Core Audience Pain',     ctx.audienceProblem],
    ['Primary Offer',          ctx.primaryOffer],
    ['Unique Mechanism',       ctx.uniqueMechanism],
    ['Revenue Goal',           ctx.revenueGoal],
    ['Platforms',              ctx.platforms],
    ['Brand Voice',            ctx.brandVoice],
  ];

  glanceFields.forEach(([label, value]) => {
    if (!value) return;
    const valueLines = wrapText(doc, value, CONTENT_W - 52);
    const rowH = Math.max(10, valueLines.length * 5 + 4);

    doc.setFillColor(...BRAND.light);
    doc.rect(MARGIN, y - 3, CONTENT_W, rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.purple);
    doc.text(label, MARGIN + 2, y + 1.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND.text);
    doc.text(valueLines, MARGIN + 52, y + 1.5);
    y += rowH + 2;
  });

  // Footer for summary page
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, 'F');
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('BEYOND THE DREAM BOARD\u2122', PAGE_W / 2, PAGE_H - 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.gold);
  doc.text(`${currentPageNum}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });

  // ── MODULE SECTIONS ─────────────────────────────────────────
  // Import MODULES dynamically to avoid circular dep
  const moduleList = [
    { number: 1,  id: 'business-context',    title: 'Business Context',    subtitle: 'Strategic Brand and Market Analysis' },
    { number: 2,  id: 'audience-psychology', title: 'Audience Psychology',  subtitle: 'Messaging Intelligence' },
    { number: 3,  id: 'authority-positioning', title: 'Authority Positioning', subtitle: 'Differentiation System' },
    { number: 4,  id: 'competitor-whitespace', title: 'Competitor White Space', subtitle: 'Content Gap Analysis' },
    { number: 5,  id: 'content-pillars',     title: 'Content Pillars',      subtitle: 'Conversion-Oriented Strategy' },
    { number: 6,  id: 'platform-strategy',   title: 'Platform Strategy',    subtitle: 'LinkedIn & Substack Engine' },
    { number: 7,  id: 'content-plan',        title: '30-Day Content Plan',  subtitle: 'Strategic Visibility Calendar' },
    { number: 8,  id: 'post-generator',      title: 'Post Generator',       subtitle: 'Scroll-Stopping Content' },
    { number: 9,  id: 'monetization-strategy', title: 'Monetization Strategy', subtitle: 'Audience Conversion System' },
    { number: 10, id: 'revenue-acceleration', title: 'Revenue Acceleration', subtitle: 'Monetization Clarity Engine' },
  ];

  for (const mod of moduleList) {
    const output = state.moduleData?.[mod.id]?.editedOutput || state.moduleData?.[mod.id]?.output || '';
    if (!output) continue;

    // Module divider/cover strip
    doc.addPage();
    currentPageNum++;

    doc.setFillColor(...BRAND.dark);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
    doc.setFillColor(...BRAND.purple);
    doc.rect(0, 0, PAGE_W, 50, 'F');
    doc.setFillColor(...BRAND.gold);
    doc.rect(0, 0, PAGE_W, 3, 'F');

    // Module number badge
    doc.setFillColor(...BRAND.gold);
    doc.roundedRect(MARGIN, 14, 38, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.dark);
    doc.text(`MODULE ${mod.number} OF 10`, MARGIN + 3, 19.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(mod.title.toUpperCase(), MARGIN, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.gold);
    doc.text(mod.subtitle, MARGIN, 46);

    // Continue on a fresh content page
    y = addContentPage(`Module ${mod.number}: ${mod.title}`);
    const tokens = parseMarkdown(output);
    renderTokens(doc, tokens, `Module ${mod.number}: ${mod.title}`, y);
  }

  // ── FINAL PAGE — next steps ─────────────────────────────────
  doc.addPage();
  currentPageNum++;

  doc.setFillColor(...BRAND.dark);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  doc.setFillColor(...BRAND.purple);
  doc.rect(0, 0, PAGE_W, PAGE_H * 0.45, 'F');
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, 0, PAGE_W, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('YOUR STRATEGY', MARGIN, 40);
  doc.setTextColor(...BRAND.gold);
  doc.text('IS READY.', MARGIN, 54);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(180, 160, 210);
  doc.setTextColor(180, 160, 210);
  doc.text('Now it\'s time to act on it.', MARGIN, 66);

  const nextSteps = [
    { icon: '→', label: 'Book a discovery call', value: 'calendly.com/vivekacoach/discovery-call' },
    { icon: '→', label: 'Connect on LinkedIn',   value: 'LinkedIn.com/in/VivekavonRosen' },
    { icon: '→', label: 'Subscribe on Substack', value: 'vivekavonrosen.substack.com' },
    { icon: '→', label: 'Send an email',          value: 'Viveka@beyondthedreamboard.com' },
  ];

  let ny = PAGE_H * 0.45 + 20;
  nextSteps.forEach(step => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND.gold);
    doc.text(step.label, MARGIN, ny);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 160, 210);
    doc.text(step.value, MARGIN, ny + 6);
    ny += 18;
  });

  // Final branding
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, PAGE_H - 30, PAGE_W, 30, 'F');
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, PAGE_H - 30, PAGE_W, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.gold);
  doc.text('BEYOND THE DREAM BOARD\u2122', PAGE_W / 2, PAGE_H - 19, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(150, 130, 180);
  doc.text("Women's words will change the world.", PAGE_W / 2, PAGE_H - 12, { align: 'center' });
  doc.setFontSize(7);
  doc.text(`Generated ${generatedDate}  ·  Visibility Infrastructure OS`, PAGE_W / 2, PAGE_H - 6, { align: 'center' });

  // ── SAVE ────────────────────────────────────────────────────
  const safeBrand = brandName
    ? `-${brandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    : '';
  const date = new Date().toISOString().split('T')[0];
  doc.save(`vios-playbook${safeBrand}-${date}.pdf`);
}
