// Utility to calculate achievements and badges based on sadhana history

export const ACHIEVEMENTS = [
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Wake up before 5:00 AM for 7 consecutive days',
    icon: '🌅'
  },
  {
    id: 'unbroken_chain',
    name: 'Unbroken Chain',
    description: 'Maintain a 7-day streak of logging sadhana',
    icon: '🔥'
  },
  {
    id: 'marathon_reader',
    name: 'Marathon Reader',
    description: 'Read for more than 15 hours in a single month',
    icon: '📚'
  },
  {
    id: 'japa_warrior',
    name: 'Japa Warrior',
    description: 'Chant 16+ rounds every day for a week',
    icon: '📿'
  }
];

export const calculateAchievements = (email) => {
  const historyStr = localStorage.getItem(`sadhana_history_${email}`);
  const history = historyStr ? JSON.parse(historyStr) : [];
  
  if (history.length === 0) return [];

  // Sort history by date descending
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  
  const earned = [];

  // 1. Unbroken Chain (7-day streak)
  let streak = 0;
  for (const h of sorted) {
    if ((h.score || 0) > 0) streak++;
    else break;
  }
  if (streak >= 7) earned.push('unbroken_chain');

  // 2. Early Bird (Wake up < 5 AM for 7 days)
  let earlyBirdStreak = 0;
  for (const h of sorted) {
    if (h.details && h.details.wakeupTime) {
      let timeStr = String(h.details.wakeupTime);
      let isAM = timeStr.toLowerCase().includes('am');
      let timePart = timeStr.replace(/[^\d:]/g, '');
      let [hours, mins] = timePart.split(':').map(Number);
      
      if (!isNaN(hours) && isAM && ((hours < 5 && hours !== 12) || (hours === 12))) {
        earlyBirdStreak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  if (earlyBirdStreak >= 7) earned.push('early_bird');

  // 3. Marathon Reader (>15 hours / 900 mins this month)
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let thisMonthReading = 0;
  
  history.forEach(h => {
    if (h.date.startsWith(currentMonthPrefix)) {
      thisMonthReading += Number(h.details?.readingDuration || 0);
    }
  });
  if (thisMonthReading >= 900) earned.push('marathon_reader');

  // 4. Japa Warrior (16+ rounds for 7 days)
  let japaStreak = 0;
  for (const h of sorted) {
    if (h.details && h.details.roundsChanted >= 16) {
      japaStreak++;
    } else {
      break;
    }
  }
  if (japaStreak >= 7) earned.push('japa_warrior');

  return earned;
};
