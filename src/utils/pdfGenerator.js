import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { calculatePoints, getAbsentCode } from './scoring';

export const generateSadhanaPDFReport = ({
  devotee,
  history = [],
  guideName = '',
  startDateStr = '',
  endDateStr = ''
}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Top Header Branding Banner
  doc.setFillColor(15, 23, 42); // #0f172a (Navy)
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Amber Accent Line below header
  doc.setFillColor(245, 158, 11); // #f59e0b
  doc.rect(0, 42, pageWidth, 2.5, 'F');

  // Add FOLK Logo placeholder
  doc.setFillColor(245, 158, 11);
  doc.circle(27, 21, 11, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FOLK', 19, 23);

  // Header Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FOLK SADHANA PERFORMANCE REPORT', 46, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(245, 158, 11);
  doc.text('ISKCON BHADAJ, AHMEDABAD • YOUTH WING (FOLK)', 46, 28);

  // 2. Devotee Details Metadata Box
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.roundedRect(14, 48, pageWidth - 28, 36, 3, 3, 'FD');

  const printDate = format(new Date(), 'dd MMM yyyy, hh:mm a');
  const dateRange = (startDateStr && endDateStr)
    ? `${startDateStr} to ${endDateStr}`
    : `Past 30 Days (Log History)`;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  // Left Column Metadata
  doc.text(`Devotee Name:`, 20, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(`${devotee.name || 'Devotee'}`, 48, 56);

  doc.setFont('helvetica', 'bold');
  doc.text(`Email / User ID:`, 20, 63);
  doc.setFont('helvetica', 'normal');
  doc.text(`${devotee.email || 'N/A'}`, 48, 63);

  doc.setFont('helvetica', 'bold');
  doc.text(`FOLK Guide:`, 20, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(`${devotee.guide || guideName || 'N/A'}`, 48, 70);

  doc.setFont('helvetica', 'bold');
  doc.text(`Category Status:`, 20, 77);
  doc.setFont('helvetica', 'normal');
  doc.text(`${devotee.status || 'N/A'}`, 48, 77);

  // Right Column Metadata
  doc.setFont('helvetica', 'bold');
  doc.text(`Residency:`, 115, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(`${devotee.residency || 'Non-Resident'}`, 145, 56);

  doc.setFont('helvetica', 'bold');
  doc.text(`Report Range:`, 115, 63);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dateRange}`, 145, 63);

  doc.setFont('helvetica', 'bold');
  doc.text(`Downloaded On:`, 115, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(`${printDate}`, 145, 70);

  // 3. OVERALL SADHANA ACTIVITY SUMMARY BOX (Inspired by User Screenshot!)
  const totalDays = history.length || 1;

  const getActivityBreakdown = (actKey) => {
    let attended = 0, atCount = 0, sickCount = 0, abCount = 0;
    history.forEach(h => {
      if (h.activityTimes?.[actKey]) {
        attended++;
      } else if (h.details?.absentReason) {
        if (h.details.absentReason.includes('Travel')) atCount++;
        else if (h.details.absentReason.includes('Sick')) sickCount++;
        else abCount++;
      } else {
        abCount++;
      }
    });
    const pct = ((attended / totalDays) * 100).toFixed(1);
    return `${pct}% in ${attended} days, AT - ${atCount} days, Sick - ${sickCount} days, AB - ${abCount} days`;
  };

  const maSummary = getActivityBreakdown('mangala_arati');
  const jpSummary = getActivityBreakdown('japa');
  const readSummary = getActivityBreakdown('reading');
  const sbSummary = getActivityBreakdown('class');

  const totalScoreSum = history.reduce((sum, h) => sum + (h.score || 0), 0);
  const totalSadhanaPct = ((totalScoreSum / (totalDays * 20)) * 100).toFixed(2);

  const totalReadingMins = history.reduce((sum, h) => sum + Number(h.details?.readingDuration || 0), 0);
  const readingHrs = Math.floor(totalReadingMins / 60);
  const readingMinsRem = totalReadingMins % 60;
  const readingTimeStr = `${readingHrs}h:${readingMinsRem}m:0s`;

  // Draw Summary Table Box
  doc.autoTable({
    startY: 88,
    head: [['ACTIVITY SUMMARY', 'OVERALL PERFORMANCE BREAKDOWN']],
    body: [
      ['MA (Mangala Arati)', maSummary],
      ['JP (Japa Chanting)', jpSummary],
      ['READ (Book Reading)', readSummary],
      ['SB (Bhagavatam Class)', sbSummary],
      ['Total Sadhana %', `${totalSadhanaPct}%`],
      ['Reading Hours', readingTimeStr]
    ],
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: [15, 23, 42] },
      1: { cellWidth: pageWidth - 78 }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  // 4. Daily Sadhana Log Table — Exactly matching Screenshot Columns!
  // Columns: DATE | MA | JP | JP END | READ (PTS) | READ (M) | SB | YOGA | SLEEP | WAKE | PTS
  const tableRows = history.slice(0, 31).map(h => {
    const dStr = h.date ? format(parseISO(h.date), 'dd MMM') : '-';
    
    const getVal = (actKey) => {
      if (h.activityTimes?.[actKey]) {
        return calculatePoints(actKey, h.activityTimes[actKey]);
      }
      if (h.details?.absentReason) {
        return getAbsentCode(h.details.absentReason);
      }
      return 0;
    };

    const maVal = getVal('mangala_arati');
    const jpVal = getVal('japa');
    const readPtsVal = getVal('reading');
    const sbVal = getVal('class');
    const yogaVal = getVal('yoga');

    const jpEnd = h.details?.chantingCompletionTime || '-';
    const readMins = h.details?.readingDuration || 0;
    const sleepTime = h.details?.sleepTime || '-';
    const wakeTime = h.details?.wakeupTime || '-';
    const pts = h.score !== undefined ? h.score : 0;

    return [dStr, maVal, jpVal, jpEnd, readPtsVal, readMins, sbVal, yogaVal, sleepTime, wakeTime, pts];
  });

  const nextTableStartY = (doc.lastAutoTable?.finalY ?? 88) + 6;

  doc.autoTable({
    startY: nextTableStartY,
    head: [['DATE', 'MA', 'JP', 'JP END', 'READ (PTS)', 'READ (M)', 'SB', 'YOGA', 'SLEEP', 'WAKE', 'PTS']],
    body: tableRows.length > 0 ? tableRows : [['No data', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11], fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59], halign: 'center' },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [217, 119, 6] } // Amber for Date
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  // 5. Bottom Footer Branding Box with ISKCON Logo
  const finalY = (doc.lastAutoTable?.finalY ?? 120) + 10;
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = Math.max(finalY, pageHeight - 25);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);



  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('© 2026 All rights reserved | ISKCON Bhadaj, Ahmedabad | Managed by FOLK', 36, footerY + 6);
  doc.text('Official Sadhana Performance Document • Downloaded via FOLK SadhanaSync', 36, footerY + 11);

  doc.save(`${(devotee.name || 'Devotee').replace(/\s+/g, '_')}_Sadhana_Report.pdf`);
};
