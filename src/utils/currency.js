import { differenceInDays, parseISO } from 'date-fns';

export const calculateUserCurrencies = (email, userCategory = 'FOLK Resident') => {
  const history = JSON.parse(localStorage.getItem(`sadhana_history_${email}`) || '[]');
  const redemptions = JSON.parse(localStorage.getItem('currency_redemptions') || '[]');
  const conversions = JSON.parse(localStorage.getItem(`sadhana_conversions_${email}`) || '[]');
  const now = new Date();

  // Sort history chronologically
  const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Beginner Currency Tracking (Krishna & Balaram)
  let lifetimeKrishna = 0;
  let lifetimeBalaram = 0;

  // Resident & Non-Resident Currency Tracking (Chaitanya, Nityanand, Prabhupada)
  let lifetimeChaitanya = 0;
  let lifetimeNityanand = 0;
  let lifetimePrabhupada = 0;

  let expiredChaitanya = 0;
  let expiredKrishna = 0;

  let consecutiveFullDays = 0;

  sortedHistory.forEach(entry => {
    const entryDate = parseISO(entry.date);
    const ageDays = differenceInDays(now, entryDate);
    const details = entry.details || {};
    const rounds = Number(details.totalRounds || 0);
    const readMins = Number(details.readingDuration || 0);
    const hearMins = Number(details.hearingDuration || 0);

    const wakeupStr = details.wakeupTime || '';
    const chantingCompStr = details.chantingCompletionTime || '';

    // Convert wakeup / chanting times to minutes from midnight for average check
    let wakeupMins = 999;
    if (wakeupStr) {
      const [h, m] = wakeupStr.split(':').map(Number);
      wakeupMins = h * 60 + m;
    }

    let chantingCompMins = 999;
    if (chantingCompStr) {
      const [h, m] = chantingCompStr.split(':').map(Number);
      chantingCompMins = h * 60 + m;
    }

    // 🔴 BEGINNER CURRENCY SYSTEM (Krishna & Balaram)
    if (userCategory === 'Beginner') {
      const achievesKrishna = readMins >= 30 && hearMins >= 30 && rounds >= 4;
      if (achievesKrishna) {
        lifetimeKrishna += 1;
        if (ageDays > 120) expiredKrishna += 1; // 4-Month Expiry
      } else if (rounds >= 1 || readMins >= 15 || hearMins >= 15) {
        lifetimeBalaram += 1;
      }
      return;
    }

    // 🟡 RESIDENT & NON-RESIDENT CURRENCY SYSTEM
    let earnedChaitanya = 0;
    let earnedNityanand = 0;

    const isResident = userCategory === 'FOLK Resident';

    if (isResident) {
      // 🏆 FOLK RESIDENT CHALLENGE: 7-Day Full Score Streak (20/20 pts)
      const isFullDay = entry.score >= 20 || (rounds >= 16 && readMins >= 60 && hearMins >= 60);
      if (isFullDay) {
        consecutiveFullDays += 1;
      } else {
        consecutiveFullDays = 0;
      }

      if (consecutiveFullDays >= 7) {
        earnedChaitanya = 1;
        consecutiveFullDays = 0; // Reset streak after awarding Gold Coin
      } else if (consecutiveFullDays >= 4) {
        earnedNityanand = 1; // 4-Day Streak Nityanand Blue Coin
      }
    } else {
      // 🏆 NON-FOLK RESIDENT CHALLENGE: Weekly Average Metrics
      // Wakeup <= 5:30 AM (330m), Chanting completion <= 9:00 AM (540m), Reading >= 45m, Hearing >= 30m
      const satisfiesWeeklyAverage = wakeupMins <= 330 && chantingCompMins <= 540 && readMins >= 45 && hearMins >= 30;
      const satisfiesPartialAverage = (wakeupMins <= 360 && chantingCompMins <= 600 && readMins >= 30 && hearMins >= 20);

      if (satisfiesWeeklyAverage) {
        earnedChaitanya = 1;
      } else if (satisfiesPartialAverage) {
        earnedNityanand = 1; // 4-Day Partial Average Nityanand Blue Coin
      }
    }

    // Prabhupada Bonus Coin
    let earnedPrabhupada = 0;
    if (rounds > 20 || readMins > 60 || hearMins > 60) {
      earnedPrabhupada = 1;
    }

    if (ageDays > 120) {
      expiredChaitanya += earnedChaitanya;
    }

    lifetimeChaitanya += earnedChaitanya;
    lifetimeNityanand += earnedNityanand;
    lifetimePrabhupada += earnedPrabhupada;
  });

  // Account for Redemptions
  const userRedemptions = redemptions.filter(r => r.email === email && r.status !== 'rejected');
  let spentChaitanya = 0;
  let spentNityanand = 0;
  let spentPrabhupada = 0;
  let spentKrishna = 0;
  let spentBalaram = 0;

  userRedemptions.forEach(r => {
    spentChaitanya += Number(r.chaitanyaCost || 0);
    spentNityanand += Number(r.nityanandCost || 0);
    spentPrabhupada += Number(r.prabhupadaCost || 0);
    spentKrishna += Number(r.krishnaCost || 0);
    spentBalaram += Number(r.balaramCost || 0);
  });

  // Account for Conversions
  let convertedGainChaitanya = 0, convertedSpentChaitanya = 0;
  let convertedGainNityanand = 0, convertedSpentNityanand = 0;
  let convertedGainPrabhupada = 0, convertedSpentPrabhupada = 0;
  let convertedGainKrishna = 0, convertedSpentKrishna = 0;
  let convertedGainBalaram = 0, convertedSpentBalaram = 0;

  conversions.forEach(c => {
    if (c.fromType === 'Prabhupada') convertedSpentPrabhupada += Number(c.fromAmount || 0);
    if (c.fromType === 'Nityanand') convertedSpentNityanand += Number(c.fromAmount || 0);
    if (c.fromType === 'Chaitanya') convertedSpentChaitanya += Number(c.fromAmount || 0);
    if (c.fromType === 'Balaram') convertedSpentBalaram += Number(c.fromAmount || 0);
    if (c.fromType === 'Krishna') convertedSpentKrishna += Number(c.fromAmount || 0);

    if (c.toType === 'Prabhupada') convertedGainPrabhupada += Number(c.toAmount || 0);
    if (c.toType === 'Nityanand') convertedGainNityanand += Number(c.toAmount || 0);
    if (c.toType === 'Chaitanya') convertedGainChaitanya += Number(c.toAmount || 0);
    if (c.toType === 'Balaram') convertedGainBalaram += Number(c.toAmount || 0);
    if (c.toType === 'Krishna') convertedGainKrishna += Number(c.toAmount || 0);
  });

  return {
    lifetime: {
      chaitanya: lifetimeChaitanya,
      nityanand: lifetimeNityanand,
      prabhupada: lifetimePrabhupada,
      krishna: lifetimeKrishna,
      balaram: lifetimeBalaram
    },
    expired: {
      chaitanya: expiredChaitanya,
      krishna: expiredKrishna
    },
    balance: {
      chaitanya: Math.max(0, (lifetimeChaitanya + convertedGainChaitanya) - (spentChaitanya + convertedSpentChaitanya + expiredChaitanya)),
      nityanand: Math.max(0, (lifetimeNityanand + convertedGainNityanand) - (spentNityanand + convertedSpentNityanand)),
      prabhupada: Math.max(0, (lifetimePrabhupada + convertedGainPrabhupada) - (spentPrabhupada + convertedSpentPrabhupada)),
      krishna: Math.max(0, (lifetimeKrishna + convertedGainKrishna) - (spentKrishna + convertedSpentKrishna + expiredKrishna)),
      balaram: Math.max(0, (lifetimeBalaram + convertedGainBalaram) - (spentBalaram + convertedSpentBalaram))
    }
  };
};

export const getPrestigeTitle = (lifetimeChaitanya, userCategory) => {
  if (userCategory === 'Beginner') return 'Krishna Seva Bhakta';
  if (lifetimeChaitanya >= 500) return "Srila Prabhupada's Army";
  if (lifetimeChaitanya >= 100) return "Charanashraya";
  if (lifetimeChaitanya >= 75) return "Upasaka";
  if (lifetimeChaitanya >= 50) return "Sadhaka";
  if (lifetimeChaitanya >= 10) return "Sevaka";
  return "Bhakta";
};

export const calculateDailyCoins = (entry, userCategory = 'FOLK Resident') => {
  let chaitanya = 0, nityanand = 0, prabhupada = 0, krishna = 0, balaram = 0;
  const details = entry.details || {};
  const rounds = Number(details.totalRounds || 0);
  const readMins = Number(details.readingDuration || 0);
  const hearMins = Number(details.hearingDuration || 0);

  if (userCategory === 'Beginner') {
    if (readMins >= 30 && hearMins >= 30 && rounds >= 4) {
      krishna = 1;
    } else if (rounds >= 1 || readMins >= 15 || hearMins >= 15) {
      balaram = 1;
    }
    return { chaitanya: 0, nityanand: 0, prabhupada: 0, krishna, balaram };
  }

  if (entry.score >= 20 || (rounds >= 16 && readMins >= 60 && hearMins >= 60)) {
    chaitanya = 1;
  } else if (entry.score >= 10 && entry.score < 20) {
    nityanand = 1;
  }

  if (rounds > 20 || readMins > 60 || hearMins > 60) {
    prabhupada = 1;
  }

  return { chaitanya, nityanand, prabhupada, krishna: 0, balaram: 0 };
};
