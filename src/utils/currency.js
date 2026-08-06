export const calculateUserCurrencies = (email) => {
  const history = JSON.parse(localStorage.getItem(`sadhana_history_${email}`) || '[]');
  const redemptions = JSON.parse(localStorage.getItem('currency_redemptions') || '[]');
  
  let lifetimeChaitanya = 0;
  let lifetimeNityanand = 0;
  let lifetimePrabhupada = 0;
  
  history.forEach(entry => {
    let earnedChaitanya = 0;
    let earnedNityanand = 0;
    let earnedPrabhupada = 0;
    
    // 1. Chaitanya Currency (Gold)
    if (entry.score >= 20) { // Max score could technically be higher with bonus, but base is 20
      earnedChaitanya = 1;
    } else {
      // Mercy Clause
      const details = entry.details || {};
      const rounds = Number(details.totalRounds || 0);
      const readMins = Number(details.readingDuration || 0);
      const hearMins = Number(details.hearingDuration || 0);
      
      if (rounds >= 16 && readMins >= 60 && hearMins >= 60) {
        earnedChaitanya = 1;
      } else if (entry.score >= 10 && entry.score < 20) {
        earnedNityanand = 1; 
      }
    }
    
    // 2. Prabhupada Coin (Saffron) - Complimentary Bonus
    const details = entry.details || {};
    const rounds = Number(details.totalRounds || 0);
    const readMins = Number(details.readingDuration || 0);
    const hearMins = Number(details.hearingDuration || 0);
    if (rounds > 20 || readMins > 60 || hearMins > 60) {
      earnedPrabhupada = 1;
    }
    
    lifetimeChaitanya += earnedChaitanya;
    lifetimeNityanand += earnedNityanand;
    lifetimePrabhupada += earnedPrabhupada;
  });
  
  const userRedemptions = redemptions.filter(r => r.email === email && r.status !== 'rejected');
  
  let spentChaitanya = 0;
  let spentNityanand = 0;
  let spentPrabhupada = 0;
  
  userRedemptions.forEach(r => {
    spentChaitanya += Number(r.chaitanyaCost || 0);
    spentNityanand += Number(r.nityanandCost || 0);
    spentPrabhupada += Number(r.prabhupadaCost || 0);
  });
  
  return {
    lifetime: {
      chaitanya: lifetimeChaitanya,
      nityanand: lifetimeNityanand,
      prabhupada: lifetimePrabhupada
    },
    balance: {
      chaitanya: lifetimeChaitanya - spentChaitanya,
      nityanand: lifetimeNityanand - spentNityanand,
      prabhupada: lifetimePrabhupada - spentPrabhupada
    }
  };
};

export const getPrestigeTitle = (lifetimeChaitanya) => {
  if (lifetimeChaitanya >= 500) return "Srila Prabhupada's Army";
  if (lifetimeChaitanya >= 100) return "Charanashraya";
  if (lifetimeChaitanya >= 75) return "Upasaka";
  if (lifetimeChaitanya >= 50) return "Sadhaka";
  if (lifetimeChaitanya >= 10) return "Sevaka";
  return "Bhakta";
};

export const calculateDailyCoins = (entry) => {
  let chaitanya = 0;
  let nityanand = 0;
  let prabhupada = 0;

  if (entry.score >= 20) {
    chaitanya = 1;
  } else {
    const details = entry.details || {};
    const rounds = Number(details.totalRounds || 0);
    const readMins = Number(details.readingDuration || 0);
    const hearMins = Number(details.hearingDuration || 0);
    if (rounds >= 16 && readMins >= 60 && hearMins >= 60) {
      chaitanya = 1;
    } else if (entry.score >= 10 && entry.score < 20) {
      nityanand = 1;
    }
  }

  const details = entry.details || {};
  const rounds = Number(details.totalRounds || 0);
  const readMins = Number(details.readingDuration || 0);
  const hearMins = Number(details.hearingDuration || 0);
  if (rounds > 20 || readMins > 60 || hearMins > 60) {
    prabhupada = 1;
  }

  return { chaitanya, nityanand, prabhupada };
};
