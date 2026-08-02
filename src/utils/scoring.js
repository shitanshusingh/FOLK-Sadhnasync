export const getAbsentCode = (reasonStr) => {
  if (!reasonStr) return 'AB'; // Default Absent
  if (reasonStr.includes('Sick')) return 'SK';
  if (reasonStr.includes('Service')) return 'AS';
  if (reasonStr.includes('Travel')) return 'AT';
  if (reasonStr.includes('No Reason')) return 'AB';
  return 'AB';
};

export const calculatePoints = (activityId, timeStr) => {
  if (!timeStr) return 0;
  
  // Convert HH:MM to minutes for easy comparison
  const [hours, minutes] = timeStr.split(':').map(Number);
  const timeInMins = hours * 60 + minutes;

  switch (activityId) {
    case 'mangala_arati':
      // till 5:05 AM = 4 pts. Before 5:15 AM = 2 pts. After 0 pts.
      if (timeInMins <= (5 * 60 + 5)) return 4;
      if (timeInMins <= (5 * 60 + 15)) return 2;
      return 0;
      
    case 'japa':
      // till 5:35 AM = 4 pts. Before 6:00 AM = 2 pts. After = 0 pts.
      if (timeInMins <= (5 * 60 + 35)) return 4;
      if (timeInMins <= (6 * 60 + 0)) return 2;
      return 0;

    case 'reading':
      // from 6:30 to 7:00. Let's say <= 6:30 is 4, <= 7:00 is 2
      if (timeInMins <= (6 * 60 + 30)) return 4;
      if (timeInMins <= (7 * 60 + 0)) return 2;
      return 0;
      
    case 'class':
      // Before 7:05 AM = 4 pts. till 7:15 AM = 2 pts. After = 0 pts.
      if (timeInMins <= (7 * 60 + 5)) return 4;
      if (timeInMins <= (7 * 60 + 15)) return 2;
      return 0;
      
    case 'yoga':
      // till 7:35 AM = 4 pts. After 7:45 = 2 pts. then 0
      // (Yoga is optional, but if entered, these are the points)
      if (timeInMins <= (7 * 60 + 35)) return 4;
      if (timeInMins <= (7 * 60 + 45)) return 2;
      return 0;

    default:
      return 0;
  }
};
