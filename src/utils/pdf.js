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
  doc.setGState(new doc.GState({ opacity: 0.45 }));
  doc.rect(0, 0, PAGE_W, 60, 'F');
  doc.setGState(new doc.GState({ opacity: 1 }));

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
  doc.setGState(new doc.GState({ opacity: 0.05 }));
  doc.roundedRect(MARGIN, PAGE_H * 0.55 + 20, CONTENT_W, 60, 4, 4, 'F');
  doc.setGState(new doc.GState({ opacity: 1 }));

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
