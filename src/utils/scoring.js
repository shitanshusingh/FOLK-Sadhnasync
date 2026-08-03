export const DEFAULT_RESIDENCY_CONFIG = {
  mangala_arati: { enabled: true, time: "05:00" },
  japa: { enabled: true, time: "05:30" },
  reading: { enabled: true, time: "06:30" },
  class: { enabled: true, time: "07:00" },
  yoga: { enabled: true, time: "07:30" }
};

const parseTimeToMins = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getAbsentCode = (reasonStr) => {
  if (!reasonStr) return 'AB';
  if (reasonStr.includes('Sick')) return 'SK';
  if (reasonStr.includes('Service')) return 'AS';
  if (reasonStr.includes('Travel')) return 'AT';
  if (reasonStr.includes('No Reason')) return 'AB';
  return 'AB';
};

export const calculatePoints = (activityId, timeStr, config = null) => {
  if (!timeStr) return 0;
  
  const timeInMins = parseTimeToMins(timeStr);
  const actConfig = config && config[activityId] ? config[activityId] : DEFAULT_RESIDENCY_CONFIG[activityId];
  
  if (!actConfig || !actConfig.enabled) return 0;

  const baseMins = parseTimeToMins(actConfig.time);

  switch (activityId) {
    case 'mangala_arati':
      if (timeInMins <= (baseMins + 5)) return 4;
      if (timeInMins <= (baseMins + 15)) return 2;
      return 0;
      
    case 'japa':
      if (timeInMins <= (baseMins + 5)) return 4;
      if (timeInMins <= (baseMins + 30)) return 2;
      return 0;

    case 'reading':
      if (timeInMins <= baseMins) return 4;
      if (timeInMins <= (baseMins + 30)) return 2;
      return 0;
      
    case 'class':
      if (timeInMins <= (baseMins + 5)) return 4;
      if (timeInMins <= (baseMins + 15)) return 2;
      return 0;
      
    case 'yoga':
      if (timeInMins <= (baseMins + 5)) return 4;
      if (timeInMins <= (baseMins + 15)) return 2;
      return 0;

    default:
      return 0;
  }
};
