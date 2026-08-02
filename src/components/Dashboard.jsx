import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, ChevronLeft, ChevronRight, User, AlertCircle, Flame, Target, X, CheckCircle, Clock, Edit3, Activity, Trophy } from 'lucide-react';
import { format, parseISO, isWithinInterval, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isBefore, startOfToday, startOfYear, endOfYear, differenceInMinutes } from 'date-fns';
import { calculatePoints, getAbsentCode } from '../utils/scoring';
import { generateSadhanaPDFReport } from '../utils/pdfGenerator';
import { isCloudActive } from '../services/firebase';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const Dashboard = ({ currentUser, setActiveTab, setPrefilledDate }) => {
  const today = startOfToday();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  const [dashboardDate, setDashboardDate] = useState(startOfMonth(today));
  const [slideDirection, setSlideDirection] = useState('right');
  const [customGoals, setCustomGoals] = useState(() => JSON.parse(localStorage.getItem(`sadhana_goals_${currentUser.email}`) || '{"rounds": 480, "reading": 900}'));
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [activeGoalSlide, setActiveGoalSlide] = useState(0);

  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const [includeGraphInPdf, setIncludeGraphInPdf] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGoalSlide(prev => (prev === 2 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const saveGoals = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const rounds = Number(formData.get('rounds')) || 480;
    const reading = Number(formData.get('reading')) || 900;
    const newGoals = { rounds, reading };
    setCustomGoals(newGoals);
    localStorage.setItem(`sadhana_goals_${currentUser.email}`, JSON.stringify(newGoals));
    setShowGoalModal(false);
  };
  
  const [dateFilterType, setDateFilterType] = useState('month'); 
  const [fromDate, setFromDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [history, setHistory] = useState([]);
  
  // Carousel State
  const [activeChart, setActiveChart] = useState(0); 
  const [activeMiniCard, setActiveMiniCard] = useState(0);
  const availableCharts = useMemo(() => {
    if (currentUser?.status === 'Non-FOLK Resident') {
      return [
        { id: 'sleep', title: "Sleep Duration (Hrs)" },
        { id: 'wakeup', title: "Wake-up Time Trend" },
        { id: 'japa', title: "Japa Rounds" },
        { id: 'chanting_time', title: "Chanting Completion Time" },
        { id: 'reading', title: "Book Reading (Mins)" },
        { id: 'hearing', title: "Total Hearing (Mins)" }
      ];
    } else if (currentUser?.status === 'Beginner') {
      return [
        { id: 'japa', title: "Japa Rounds" },
        { id: 'chanting_time', title: "Chanting Completion Time" },
        { id: 'reading', title: "Book Reading (Mins)" },
        { id: 'hearing', title: "Total Hearing (Mins)" }
      ];
    } else {
      return [
        { id: 'core', title: "Core Points Trend" },
        { id: 'sleep', title: "Sleep Duration (Hrs)" },
        { id: 'japa', title: "Japa Rounds" },
        { id: 'reading', title: "Book Reading (Mins)" },
        { id: 'mangala', title: "Mangala Arati Punctuality" },
        { id: 'class', title: "SB Class Timing" },
        { id: 'chanting_time', title: "Chanting Completion Time" },
        { id: 'wakeup', title: "Wake-up Time Trend" }
      ];
    }
  }, [currentUser?.status]);

  const totalCharts = availableCharts.length;

  const [calendarDate, setCalendarDate] = useState(today);
  const [previewDate, setPreviewDate] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(`sadhana_history_${currentUser.email}`) || '[]');
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    setHistory(sortedData);
  }, [previewDate]);

  const handleDateFilterClick = (type) => {
    setDateFilterType(type);
    if (type === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (type === 'month') {
      setFromDate(format(startOfMonth(today), 'yyyy-MM-dd'));
      setToDate(format(endOfMonth(today), 'yyyy-MM-dd'));
    } else if (type === 'last_month') {
      setFromDate(format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd'));
      setToDate(format(endOfMonth(subMonths(today, 1)), 'yyyy-MM-dd'));
    } else if (type === 'year') {
      setFromDate(format(startOfYear(today), 'yyyy-MM-dd'));
      setToDate(format(endOfYear(today), 'yyyy-MM-dd'));
    }
  };

  const filteredHistory = useMemo(() => {
    if (!fromDate || !toDate) return history;
    const start = parseISO(fromDate);
    const end = parseISO(toDate);
    return history.filter(entry => {
      const entryDate = parseISO(entry.date);
      return isWithinInterval(entryDate, { start, end });
    });
  }, [history, fromDate, toDate]);

  const parseTimeToDecimal = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return Number((h + (m / 60)).toFixed(2));
  };

  // Chart Data Formatting
  const chartData = useMemo(() => {
    return filteredHistory.map(entry => {
      let sleepHrs = 0;
      if (entry.details?.sleepTime && entry.details?.wakeupTime) {
        const sleepArr = entry.details.sleepTime.split(':').map(Number);
        const wakeArr = entry.details.wakeupTime.split(':').map(Number);
        
        let sleepDate = new Date();
        let wakeDate = new Date();
        
        if (sleepArr.length >= 2 && wakeArr.length >= 2 && !isNaN(sleepArr[0]) && !isNaN(wakeArr[0])) {
          sleepDate.setHours(sleepArr[0], sleepArr[1], 0);
          wakeDate.setHours(wakeArr[0], wakeArr[1], 0);
          if (wakeDate < sleepDate) wakeDate.setDate(wakeDate.getDate() + 1);
          sleepHrs = differenceInMinutes(wakeDate, sleepDate) / 60;
        }
      }
      
      return {
        dateStr: format(parseISO(entry.date), 'dd MMM'),
        points: entry.score || 0,
        rounds: Number(entry.details?.totalRounds) || 0,
        reading: Number(entry.details?.readingDuration) || 0,
        hearing: Number(entry.details?.hearingDuration) || 0,
        sleepHours: Number(sleepHrs.toFixed(1)),
        maTime: parseTimeToDecimal(entry.activityTimes?.mangala_arati),
        sbTime: parseTimeToDecimal(entry.activityTimes?.class),
        japaEndTime: parseTimeToDecimal(entry.details?.chantingCompletionTime),
        wakeupTime: parseTimeToDecimal(entry.details?.wakeupTime)
      }
    });
  }, [filteredHistory]);

  const fireStreak = useMemo(() => {
    let streak = 0;
    // Streak goes backwards from today always, regardless of dashboard view
    for (let i = 0; i < 30; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      const entry = history.find(e => e.date === checkDate);
      if (entry && entry.score >= 16) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    return streak;
  }, [history, today]);

  // Monthly Goals (Sum of current month)
  const monthlyStats = useMemo(() => {
    let totalRounds = 0;
    let totalReading = 0;
    const start = startOfMonth(dashboardDate);
    const end = endOfMonth(dashboardDate);
    
    history.forEach(entry => {
      const entryDate = parseISO(entry.date);
      if (isWithinInterval(entryDate, { start, end })) {
        totalRounds += Number(entry.details?.totalRounds || 0);
        totalReading += Number(entry.details?.readingDuration || 0);
      }
    });
    return { totalRounds, totalReading };
  }, [history, dashboardDate]);

  const advancedStats = useMemo(() => {
    let totalScore = 0;
    let perfectDays = 0;
    let totalWakeupMins = 0;
    let wakeDays = 0;

    const start = startOfMonth(dashboardDate);
    const end = endOfMonth(dashboardDate);
    const daysToCheck = eachDayOfInterval({ start, end: isBefore(end, today) ? end : today });

    history.forEach(entry => {
      const entryDate = parseISO(entry.date);
      if (isWithinInterval(entryDate, { start, end })) {
        totalScore += entry.score || 0;
        if (entry.score >= 16) perfectDays++;
        
        if (entry.details?.wakeupTime) {
          const [h, m] = entry.details.wakeupTime.split(':').map(Number);
          if (!isNaN(h) && !isNaN(m)) {
            totalWakeupMins += (h * 60 + m);
            wakeDays++;
          }
        }
      }
    });

    const daysCount = daysToCheck.length;
    const avgScore = daysCount ? (totalScore / daysCount).toFixed(1) : 0;
    
    let avgWakeup = '--';
    if (wakeDays > 0) {
      const avgMins = Math.round(totalWakeupMins / wakeDays);
      const h = Math.floor(avgMins / 60);
      const m = avgMins % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      avgWakeup = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    return { avgScore, perfectDays, daysCount, avgWakeup };
  }, [history, today, dashboardDate]);

  // Overall Sadhana Pie Chart Data
  const pieData = useMemo(() => {
    let present = 0, incomplete = 0, absent = 0, upcoming = 0;
    const start = startOfMonth(dashboardDate);
    const end = endOfMonth(dashboardDate);
    
    // Check everyday in the whole selected month
    const daysToCheck = eachDayOfInterval({ start, end });
    
    daysToCheck.forEach(d => {
      const dStr = format(d, 'yyyy-MM-dd');
      
      if (isBefore(today, d) && dStr !== todayStr) {
        upcoming++;
        return;
      }

      const entry = history.find(e => e.date === dStr);
      if (!entry) {
        absent++;
      } else {
        const coreMissing = ['mangala_arati', 'japa', 'reading', 'class'].some(act => !entry.activityTimes?.[act]);
        if (coreMissing && !entry.details?.absentReason) absent++;
        else if (entry.score < 16) incomplete++;
        else present++;
      }
    });
    return [
      { name: 'Present', value: present, color: '#10b981' },
      { name: 'Incomplete', value: incomplete, color: '#f59e0b' },
      { name: 'Absent/Missed', value: absent, color: '#f43f5e' },
      { name: 'Upcoming', value: upcoming, color: '#334155' }
    ].filter(d => d.value > 0);
  }, [history, today, dashboardDate]);

  // Top 5 Mini Leaderboard
  const top5Leaderboard = useMemo(() => {
    const allUsers = [];
    const allRegisteredUsers = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
    const matchedUsers = allRegisteredUsers.filter(u => 
      u.status === currentUser.status && 
      u.guide === currentUser.guide
    );
    if (!matchedUsers.find(u => u.email === currentUser.email)) {
       matchedUsers.push(currentUser);
    }
    allUsers.push(...matchedUsers);

    const start = startOfMonth(dashboardDate);
    const end = endOfMonth(dashboardDate);

    const scoredUsers = allUsers.map(user => {
      const hist = JSON.parse(localStorage.getItem(`sadhana_history_${user.email}`) || '[]');
      let totalScore = 0;
      hist.forEach(entry => {
        const entryDate = parseISO(entry.date);
        if (isWithinInterval(entryDate, { start, end })) {
          totalScore += (entry.score || 0);
        }
      });
      return { ...user, totalScore };
    });

    scoredUsers.sort((a, b) => b.totalScore - a.totalScore);
    return scoredUsers.slice(0, 5);
  }, [currentUser, dashboardDate]);

  const overallSadhanaBreakdown = useMemo(() => {
    const activeList = filteredHistory.length ? filteredHistory : history;
    const totalDays = activeList.length || 1;
    const calcActivity = (actKey) => {
      let attended = 0, atCount = 0, sickCount = 0, abCount = 0;
      activeList.forEach(h => {
        if (h.activityTimes?.[actKey]) attended++;
        else if (h.details?.absentReason) {
          if (h.details.absentReason.includes('Travel')) atCount++;
          else if (h.details.absentReason.includes('Sick')) sickCount++;
          else abCount++;
        } else abCount++;
      });
      const pct = ((attended / totalDays) * 100).toFixed(1);
      return { pct, attended, atCount, sickCount, abCount };
    };

    const ma = calcActivity('mangala_arati');
    const jp = calcActivity('japa');
    const read = calcActivity('reading');
    const sb = calcActivity('class');

    const totalScoreSum = activeList.reduce((sum, h) => sum + (h.score || 0), 0);
    const totalSadhanaPct = ((totalScoreSum / (totalDays * 20)) * 100).toFixed(2);

    const totalReadingMins = activeList.reduce((sum, h) => sum + Number(h.details?.readingDuration || 0), 0);
    const readingHrs = Math.floor(totalReadingMins / 60);
    const readingMinsRem = totalReadingMins % 60;
    const readingTimeStr = `${readingHrs}h:${readingMinsRem}m:0s`;

    return { ma, jp, read, sb, totalSadhanaPct, readingTimeStr, totalDays };
  }, [filteredHistory, history]);

  // Calendar Logic
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const blanksToPrefix = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const clickTimeoutRef = useRef(null);

  const nextMonth = () => setCalendarDate(addMonths(calendarDate, 1));
  const prevMonth = () => setCalendarDate(subMonths(calendarDate, 1));

  const getDayStatus = (dStr) => {
    const entry = history.find(e => e.date === dStr);
    const dObj = parseISO(dStr);
    
    if (!entry) {
      if (isBefore(dObj, today)) return 'regularize'; 
      return 'empty';
    }
    
    const coreMissing = ['mangala_arati', 'japa', 'reading', 'class'].some(act => !entry.activityTimes?.[act]);
    
    if (coreMissing && !entry.details?.absentReason) return 'absent';
    if (entry.score < 16) return 'incomplete';
    return 'present';
  };

  const handleCalendarClick = (dStr) => {
    if (!isBefore(parseISO(dStr), addMonths(today, 0)) && dStr !== todayStr) return;
    setPreviewDate(dStr);
  };

  const handleCalendarDoubleClick = (dStr) => {
    if (!isBefore(parseISO(dStr), addMonths(today, 0)) && dStr !== todayStr) return;
    setPreviewDate(null);
    setPrefilledDate(dStr);
    setActiveTab('tracker');
  };

  const handleDayInteraction = (dStr) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      handleCalendarDoubleClick(dStr);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        handleCalendarClick(dStr);
        clickTimeoutRef.current = null;
      }, 250);
    }
  };

  const handleQuickAbsent = (dStr) => {
    const h = JSON.parse(localStorage.getItem(`sadhana_history_${currentUser.email}`) || '[]');
    const newEntry = {
      date: dStr,
      activityTimes: { mangala_arati: '', japa: '', reading: '', class: '', yoga: '' },
      details: { sleepTime: '22:00', wakeupTime: '06:00', totalRounds: 0, readingDuration: 0, absentReason: 'Sick (Health not well)' },
      score: 0
    };
    h.push(newEntry);
    localStorage.setItem(`sadhana_history_${currentUser.email}`, JSON.stringify(h));
    setPreviewDate(null);
    setHistory(h);
  };

  const triggerPdfExport = () => {
    setShowPdfSettings(true);
  };

  const handleDownloadReport = () => {
    // Use the actual selected date filter range for the PDF (not always full month)
    let pdfStartStr, pdfEndStr;
    if (dateFilterType === 'custom' && fromDate && toDate) {
      pdfStartStr = format(new Date(fromDate), 'dd MMM yyyy');
      pdfEndStr = format(new Date(toDate), 'dd MMM yyyy');
    } else if (dateFilterType === 'today') {
      pdfStartStr = pdfEndStr = format(dashboardDate, 'dd MMM yyyy');
    } else if (dateFilterType === 'last_month') {
      const lastMonth = subMonths(dashboardDate, 1);
      pdfStartStr = format(startOfMonth(lastMonth), 'dd MMM yyyy');
      pdfEndStr = format(endOfMonth(lastMonth), 'dd MMM yyyy');
    } else if (dateFilterType === 'year') {
      pdfStartStr = format(startOfYear(dashboardDate), 'dd MMM yyyy');
      pdfEndStr = format(endOfYear(dashboardDate), 'dd MMM yyyy');
    } else {
      pdfStartStr = format(startOfMonth(dashboardDate), 'dd MMM yyyy');
      pdfEndStr = format(endOfMonth(dashboardDate), 'dd MMM yyyy');
    }

    generateSadhanaPDFReport({
      devotee: currentUser,
      history: filteredHistory,
      guideName: currentUser.guide,
      startDateStr: pdfStartStr,
      endDateStr: pdfEndStr
    });
  };

  const exportJSON = () => {
    const dataStr = localStorage.getItem(`sadhana_history_${currentUser.email}`) || '[]';
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sadhana_Backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          if(window.confirm('Are you sure you want to restore this backup? This will overwrite your current Sādhana data.')) {
            localStorage.setItem(`sadhana_history_${currentUser.email}`, JSON.stringify(importedData));
            window.location.reload();
          }
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Error reading backup file.');
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-highlight)', padding: '10px', borderRadius: '5px', color: 'var(--text-main)', boxShadow: 'var(--shadow-main)' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>
          {payload.map(p => (
            <p key={p.dataKey} style={{ margin: 0, color: p.color }}>
              {p.name}: {p.value} {p.dataKey.includes('Time') ? 'hrs' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Active Campaigns State & Accept Handler
  const [activeCampaigns, setActiveCampaigns] = useState([]);

  useEffect(() => {
    const globalCamps = JSON.parse(localStorage.getItem('sadhana_campaigns') || '[]');
    const myGuideCamps = JSON.parse(localStorage.getItem(`guide_campaigns_${currentUser.guide}`) || '[]');
    const combined = [...globalCamps, ...myGuideCamps];
    // Filter deduplicated active campaigns
    const active = combined.filter((c, idx, self) => 
      c.id && self.findIndex(t => t.id === c.id) === idx &&
      (c.target === 'all' || c.target === currentUser.status)
    );
    setActiveCampaigns(active);
  }, [currentUser]);

  const handleEnrollCampaign = (campId) => {
    // Enroll devotee
    const globalCamps = JSON.parse(localStorage.getItem('sadhana_campaigns') || '[]');
    const updated = globalCamps.map(c => {
      if (c.id === campId) {
        const enrolled = c.enrolledDevotees || [];
        if (!enrolled.includes(currentUser.email)) {
          enrolled.push(currentUser.email);
        }
        return { ...c, enrolledDevotees: enrolled };
      }
      return c;
    });
    localStorage.setItem('sadhana_campaigns', JSON.stringify(updated));

    // Also update guide campaigns
    const myGuideCamps = JSON.parse(localStorage.getItem(`guide_campaigns_${currentUser.guide}`) || '[]');
    const updatedGuideCamps = myGuideCamps.map(c => {
      if (c.id === campId) {
        const enrolled = c.enrolledDevotees || [];
        if (!enrolled.includes(currentUser.email)) {
          enrolled.push(currentUser.email);
        }
        return { ...c, enrolledDevotees: enrolled };
      }
      return c;
    });
    localStorage.setItem(`guide_campaigns_${currentUser.guide}`, JSON.stringify(updatedGuideCamps));

    setActiveCampaigns(updated);
    alert('🎉 Success! You have accepted the invitation & enrolled in the Sādhana Campaign! Check the Leaderboard tab to see the Campaign Leaderboard.');
  };

  const [dismissedCampaigns, setDismissedCampaigns] = useState(() => 
    JSON.parse(localStorage.getItem(`sadhana_dismissed_camps_${currentUser.email}`) || '[]')
  );

  const handleDismissCampaign = (campId) => {
    const updated = [...dismissedCampaigns, campId];
    setDismissedCampaigns(updated);
    localStorage.setItem(`sadhana_dismissed_camps_${currentUser.email}`, JSON.stringify(updated));
  };

  // Visible invitations: Must NOT be enrolled AND Must NOT be dismissed!
  const visibleCampaignInvitations = activeCampaigns.filter(camp => {
    const isEnrolled = (camp.enrolledDevotees || []).includes(currentUser.email);
    const isDismissed = dismissedCampaigns.includes(camp.id);
    return !isEnrolled && !isDismissed;
  });

  // WhatsApp Style Sadhana Status Feed
  const [feedModalUser, setFeedModalUser] = useState(null);
  const todayFeedUsers = useMemo(() => {
    const allRegisteredUsers = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
    const matchedUsers = allRegisteredUsers.filter(u => 
      u.status === currentUser.status && 
      u.guide === currentUser.guide
    );
    if (!matchedUsers.find(u => u.email === currentUser.email)) {
       matchedUsers.push(currentUser);
    }
    
    const active = [];
    for (const u of matchedUsers) {
       const userHistory = JSON.parse(localStorage.getItem(`sadhana_history_${u.email}`) || '[]');
       const todayEntry = userHistory.find(e => e.date === todayStr);
       if (todayEntry && todayEntry.score > 0) {
          active.push({ user: u, entry: todayEntry });
       }
    }
    return active.sort((a, b) => b.entry.score - a.entry.score);
  }, [currentUser, todayStr]);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem', maxWidth: '1050px', margin: '0 auto', position: 'relative' }}>

      {/* WhatsApp Style Sadhana Status Feed */}
      {todayFeedUsers.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 10px 5px', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Flame size={16} color="#f59e0b" /> Live Sādhana Activity
          </h3>
          <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '5px', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }} className="hide-scrollbar">
            {todayFeedUsers.map(feed => {
              const isMe = feed.user.email === currentUser.email;
              return (
                <div key={feed.user.email} onClick={() => setFeedModalUser(feed)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', flexShrink: 0, transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', padding: '3px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--bg-main)', overflow: 'hidden', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-main)' }}>
                      {feed.user.photo ? <img src={feed.user.photo} alt={feed.user.name} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : feed.user.name.substring(0,2).toUpperCase()}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isMe ? 'You' : feed.user.name.split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Active Campaign Invitations Banner Section */}
      {visibleCampaignInvitations.length > 0 && (
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {visibleCampaignInvitations.map(camp => {
            return (
              <div key={camp.id} style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.95))',
                border: '1.5px solid #f59e0b',
                borderRadius: '20px',
                padding: '1.4rem 1.6rem',
                boxShadow: '0 10px 30px rgba(245,158,11,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative'
              }}>
                {/* Cancel / Dismiss Button (X Mark) */}
                <button
                  onClick={() => handleDismissCampaign(camp.id)}
                  title="Dismiss Banner"
                  style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'rgba(255,255,255,0.1)', border: 'none',
                    color: '#94a3b8', width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s', zIndex: 5
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  <X size={18} />
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingRight: '2.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                      <span className="badge badge-amber" style={{ fontSize: '0.8rem', padding: '3px 10px' }}>
                        🏆 {camp.festival || 'Sādhana Campaign'}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        Launched by Guide {camp.guide || currentUser.guide}
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.35rem', color: '#ffffff', fontWeight: '800' }}>
                      {camp.title}
                    </h3>
                    <p style={{ color: '#cbd5e1', fontSize: '0.82rem', margin: 0 }}>
                      📅 Dates: <strong>{camp.startDate ? format(new Date(camp.startDate), 'dd MMM yyyy') : 'Now'}</strong> to <strong>{camp.endDate ? format(new Date(camp.endDate), 'dd MMM yyyy') : 'TBD'}</strong>
                    </p>
                    {camp.enableEkadashi2x && (
                      <div style={{ marginTop: '0.4rem', color: '#10b981', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        ✨ Ekadashi Special: Earn DOUBLE (2X) POINTS on Ekadashi days! {camp.ekadashiDates ? `(${camp.ekadashiDates})` : ''}
                      </div>
                    )}
                  </div>

                  <div>
                    <button onClick={() => handleEnrollCampaign(camp.id)} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '0.92rem', boxShadow: '0 4px 15px rgba(16,185,129,0.4)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Trophy size={18} /> Accept & Enroll in Campaign
                    </button>
                  </div>
                </div>

                {/* Rules & Prizes Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.9rem' }}>
                  {/* Rules */}
                  {camp.rules && (
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.8rem 1rem', borderRadius: '12px' }}>
                      <h5 style={{ margin: '0 0 0.3rem 0', color: '#f59e0b', fontSize: '0.82rem', fontWeight: '700' }}>
                        📋 Campaign Rules & Regulations:
                      </h5>
                      <div style={{ color: '#e2e8f0', fontSize: '0.78rem', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                        {camp.rules}
                      </div>
                    </div>
                  )}

                  {/* Position Prizes */}
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.8rem 1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <h5 style={{ margin: '0 0 0.3rem 0', color: '#f59e0b', fontSize: '0.82rem', fontWeight: '700' }}>
                      🎁 Official Campaign Prizes:
                    </h5>
                    {camp.prize1st && <div style={{ fontSize: '0.76rem', color: '#FFD700', fontWeight: '700' }}>🥇 1st: {camp.prize1st}</div>}
                    {camp.prize2nd && <div style={{ fontSize: '0.76rem', color: '#C0C0C0', fontWeight: '700' }}>🥈 2nd: {camp.prize2nd}</div>}
                    {camp.prize3rd && <div style={{ fontSize: '0.76rem', color: '#CD7F32', fontWeight: '700' }}>🥉 3rd: {camp.prize3rd}</div>}
                    {camp.prizeConsolation && <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: '600' }}>🏅 Consolation: {camp.prizeConsolation}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global Month Selector */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <button className="nav-btn btn-secondary" onClick={() => { setSlideDirection('left'); setDashboardDate(subMonths(dashboardDate, 1)); }} style={{ padding: '0.5rem', borderRadius: '50%' }}>
          <ChevronLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-amber)', fontWeight: 'bold' }}>
          {format(dashboardDate, 'MMMM yyyy')} Summary
        </h2>
        <button className="nav-btn btn-secondary" onClick={() => { setSlideDirection('right'); setDashboardDate(addMonths(dashboardDate, 1)); }} style={{ padding: '0.5rem', borderRadius: '50%' }}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div key={dashboardDate.toString()} className={`slide-in-${slideDirection}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Overall Pie Chart Section */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-highlight)', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          
          {/* Left Side: Pie Chart & Legend */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '250px' }}>
            <div style={{ width: '160px', height: '160px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ width: '100%', marginTop: '1rem' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: 'var(--text-main)', textAlign: 'center' }}>This Month Overall</h4>
              {pieData.map(d => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px', padding: '0 1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }}></div>
                    {d.name}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Top Performers (Scrollable) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '2rem', minWidth: '250px' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: 'var(--primary-amber)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} /> Top Performers (This Month)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', paddingRight: '5px', maxHeight: '200px' }}>
              {top5Leaderboard.map((user, idx) => (
                <div key={user.email} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-input)', padding: '0.5rem 0.8rem', borderRadius: '8px', borderLeft: idx === 0 ? '3px solid #fbbf24' : (idx === 1 ? '3px solid #cbd5e1' : (idx === 2 ? '3px solid #d97706' : '3px solid transparent')) }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', width: '20px', fontSize: '0.8rem' }}>#{idx + 1}</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7rem', color: 'var(--text-main)', overflow: 'hidden' }}>
                    {user.photo ? <img src={user.photo} alt={user.name} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {user.name} {user.email === currentUser.email && '(You)'}
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary-amber)', fontSize: '0.9rem' }}>
                    {user.totalScore}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveTab('leaderboard')} style={{ width: '100%', marginTop: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              View Full Leaderboard <ChevronRight size={14} />
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Monthly Overview Calendar */}
      <div className="panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 className="panel-title" style={{ marginBottom: '1.5rem' }}>Monthly Overview <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal'}}>(Double-click to edit)</span></h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> Present</span>
          <span style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> Incomplete</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', background: 'rgba(217, 70, 239, 0.3)', border: '1px solid #d946ef', display: 'inline-block', borderRadius: '2px' }}></span> Regularize
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', background: 'rgba(244, 63, 94, 0.3)', border: '1px solid #f43f5e', display: 'inline-block', borderRadius: '2px' }}></span> Absent
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: 'var(--primary-amber)', fontWeight: 'bold' }}>
          <button className="nav-btn btn-secondary" onClick={prevMonth} style={{ padding: '0.4rem' }}><ChevronLeft size={16} /></button>
          <span style={{ fontSize: '1.1rem' }}>{format(calendarDate, 'MMMM yyyy')}</span>
          <button className="nav-btn btn-secondary" onClick={nextMonth} style={{ padding: '0.4rem' }}><ChevronRight size={16} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary-amber)', paddingBottom: '0.5rem' }}>Mon</div>
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary-amber)', paddingBottom: '0.5rem' }}>Tue</div>
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary-amber)', paddingBottom: '0.5rem' }}>Wed</div>
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary-amber)', paddingBottom: '0.5rem' }}>Thu</div>
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary-amber)', paddingBottom: '0.5rem' }}>Fri</div>
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary-amber)', paddingBottom: '0.5rem' }}>Sat</div>
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary-amber)', paddingBottom: '0.5rem' }}>Sun</div>

          {Array.from({ length: blanksToPrefix }).map((_, i) => (
            <div key={`blank-${i}`}></div>
          ))}
          
          {daysInMonth.map(d => {
            const dStr = format(d, 'yyyy-MM-dd');
            const status = getDayStatus(dStr);
            
            let bg = 'var(--bg-main)';
            let dot = null;
            let borderColor = 'var(--border-subtle)';
            
            if (status === 'regularize') { bg = 'rgba(217, 70, 239, 0.15)'; borderColor = 'rgba(217, 70, 239, 0.4)'; }
            else if (status === 'absent') { bg = 'rgba(244, 63, 94, 0.15)'; borderColor = 'rgba(244, 63, 94, 0.4)'; }
            else if (status === 'present') dot = 'var(--accent-emerald)';
            else if (status === 'incomplete') dot = 'var(--accent-rose)';

            return (
              <div 
                key={dStr}
                onClick={() => handleDayInteraction(dStr)}
                style={{
                  position: 'relative',
                  height: '50px',
                  background: bg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-main)',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: previewDate === dStr ? '0 0 0 2px var(--primary-amber)' : 'none'
                }}
              >
                {format(d, 'd')}
                {dot && <div style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', borderRadius: '50%', background: dot }}></div>}
                {status !== 'empty' && status !== 'regularize' && status !== 'absent' && (
                  <User size={12} style={{ position: 'absolute', bottom: '4px', left: '4px', color: dot === 'var(--accent-emerald)' ? 'var(--accent-emerald)' : 'var(--text-muted)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar Preview Modal via Portal */}
      {previewDate && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '1rem'
        }}>
          
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '16px',
            border: '1px solid var(--border-highlight)', width: '100%', maxWidth: '350px',
            boxShadow: 'var(--shadow-main)', color: 'var(--text-main)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-amber)', fontSize: '1.2rem' }}>{format(parseISO(previewDate), 'EEEE, MMM do')}</h3>
              <button onClick={() => setPreviewDate(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            {(() => {
              const entry = history.find(e => e.date === previewDate);
              if (!entry) {
                return (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>No Sādhana filled for this date.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <button className="nav-btn btn-primary" onClick={() => handleCalendarDoubleClick(previewDate)} style={{ padding: '0.8rem' }}>Fill Entry</button>
                      <button className="nav-btn btn-rose" onClick={() => handleQuickAbsent(previewDate)} style={{ padding: '0.8rem' }}>Mark Absent/Sick instantly</button>
                    </div>
                  </div>
                )
              }
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #334155' }}>
                    <span style={{ color: '#94a3b8' }}>Score</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: entry.score >= 16 ? '#10b981' : '#f59e0b' }}>{entry.score} pts</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.95rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}><Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/>Maṅgala Ārati</span>
                      <span style={{ fontWeight: 'bold' }}>{entry.activityTimes?.mangala_arati || '--'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}><Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/>Japa</span>
                      <span style={{ fontWeight: 'bold' }}>{entry.activityTimes?.japa || '--'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}><CheckCircle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/>Rounds</span>
                      <span style={{ fontWeight: 'bold' }}>{entry.details?.totalRounds || '0'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}><Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/>JP Completion</span>
                      <span style={{ fontWeight: 'bold' }}>{entry.details?.chantingCompletionTime || '--'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}><Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/>Reading Time</span>
                      <span style={{ fontWeight: 'bold' }}>{entry.activityTimes?.reading || '--'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}><CheckCircle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/>Reading (Mins)</span>
                      <span style={{ fontWeight: 'bold' }}>{entry.details?.readingDuration || '0'} min</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}><Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/>SB Class</span>
                      <span style={{ fontWeight: 'bold' }}>{entry.activityTimes?.class || '--'}</span>
                    </div>
                  </div>

                  <button className="nav-btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.8rem' }} onClick={() => handleCalendarDoubleClick(previewDate)}>
                    Open Full Entry
                  </button>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* Analytics Carousel */}
      <div ref={chartRef} className="panel" style={{ padding: '1.5rem', marginBottom: '2rem', position: 'relative' }}>
        <h3 className="panel-title" style={{ marginBottom: '1.5rem' }}>Detailed Visualizations</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button className="nav-btn btn-secondary" onClick={() => setActiveChart(prev => (prev === 0 ? totalCharts - 1 : prev - 1))} style={{ padding: '0.4rem' }}><ChevronLeft size={16} /></button>
          <div style={{ fontSize: '1rem', color: 'var(--primary-amber)', fontWeight: 'bold' }}>
            {availableCharts[activeChart].title}
          </div>
          <button className="nav-btn btn-secondary" onClick={() => setActiveChart(prev => (prev === totalCharts - 1 ? 0 : prev + 1))} style={{ padding: '0.4rem' }}><ChevronRight size={16} /></button>
        </div>

        <div style={{ height: '300px', width: '100%' }}>
          {availableCharts[activeChart].id === 'core' && (
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dateStr" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" domain={[0, 20]} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="points" name="Total Points" stroke="var(--primary-amber)" strokeWidth={3} dot={{ fill: 'var(--primary-amber)', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {availableCharts[activeChart].id === 'sleep' && (
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dateStr" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="sleepHours" name="Sleep (Hrs)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {availableCharts[activeChart].id === 'japa' && (
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dateStr" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="rounds" name="Rounds" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.rounds >= 16 ? '#10b981' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {availableCharts[activeChart].id === 'reading' && (
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dateStr" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="reading" name="Reading (Mins)" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {availableCharts[activeChart].id === 'hearing' && (
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dateStr" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="hearing" name="Hearing (Mins)" stroke="#fbbf24" strokeWidth={3} dot={{ fill: '#fbbf24', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {availableCharts[activeChart].id === 'mangala' && (
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dateStr" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" domain={[4.5, 6]} tickFormatter={(val) => `${Math.floor(val)}:${String(Math.round((val%1)*60)).padStart(2,'0')}`} />
                <Tooltip content={({active, payload, label}) => {
                  if(active && payload?.length) {
                    const val = payload[0].value;
                    const timeStr = `${Math.floor(val)}:${String(Math.round((val%1)*60)).padStart(2,'0')}`;
                    return <div style={{ background: '#1e293b', padding: '10px', border: '1px solid #334155' }}><p style={{margin:0, color:'#fff'}}>{label}: {timeStr}</p></div>;
                  }
                  return null;
                }} />
                <Line type="monotone" dataKey="maTime" name="Mangala Arati Time" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {availableCharts[activeChart].id === 'class' && (
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dateStr" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" domain={[6.5, 8]} tickFormatter={(val) => `${Math.floor(val)}:${String(Math.round((val%1)*60)).padStart(2,'0')}`} />
                <Tooltip content={({active, payload, label}) => {
                  if(active && payload?.length) {
                    const val = payload[0].value;
                    if(val == null) return null;
                    const timeStr = `${Math.floor(val)}:${String(Math.round((val%1)*60)).padStart(2,'0')}`;
                    return <div style={{ background: '#1e293b', padding: '10px', border: '1px solid #334155' }}><p style={{margin:0, color:'#fff'}}>{label}: {timeStr}</p></div>;
                  }
                  return null;
                }} />
                <Line type="monotone" dataKey="sbTime" name="SB Class Time" stroke="#0ea5e9" strokeWidth={3} dot={{ fill: '#0ea5e9', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {availableCharts[activeChart].id === 'chanting_time' && (
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dateStr" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" domain={['dataMin', 'dataMax']} tickFormatter={(val) => `${Math.floor(val)}:${String(Math.round((val%1)*60)).padStart(2,'0')}`} />
                <Tooltip content={({active, payload, label}) => {
                  if(active && payload?.length) {
                    const val = payload[0].value;
                    if(val == null) return null;
                    const h = Math.floor(val);
                    const m = String(Math.round((val%1)*60)).padStart(2,'0');
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const h12 = h % 12 || 12;
                    const timeStr = `${String(h12).padStart(2,'0')}:${m} ${ampm}`;
                    return <div style={{ background: '#1e293b', padding: '10px', border: '1px solid #334155' }}><p style={{margin:0, color:'#fff'}}>{label}: {timeStr}</p></div>;
                  }
                  return null;
                }} />
                <Line type="step" dataKey="japaEndTime" name="Japa Completion Time" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {availableCharts[activeChart].id === 'wakeup' && (
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dateStr" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" domain={[3, 9]} tickFormatter={(val) => `${Math.floor(val)}:${String(Math.round((val%1)*60)).padStart(2,'0')}`} />
                <Tooltip content={({active, payload, label}) => {
                  if(active && payload?.length) {
                    const val = payload[0].value;
                    if(val == null) return null;
                    const h = Math.floor(val);
                    const m = String(Math.round((val%1)*60)).padStart(2,'0');
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const h12 = h % 12 || 12;
                    const timeStr = `${String(h12).padStart(2,'0')}:${m} ${ampm}`;
                    return <div style={{ background: '#1e293b', padding: '10px', border: '1px solid #334155' }}><p style={{margin:0, color:'#fff'}}>{label}: {timeStr}</p></div>;
                  }
                  return null;
                }} />
                <Line type="monotone" dataKey="wakeupTime" name="Wake-up Time" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ═══ SĀDHANA HISTORY & DETAILED REPORTS SECTION ═══ */}
      <div className="panel" style={{ padding: '1.6rem', marginBottom: '1.5rem', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
          <div>
            <h3 className="panel-title" style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>Sādhana History & Reports</h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Real-Time Synchronized Sādhana Analytics</div>
          </div>

          {/* Date Filter Pills - Touch Scrollable on Mobile */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', maxWidth: '100%', paddingBottom: '4px', alignItems: 'center' }}>
            <button onClick={() => handleDateFilterClick('today')} className={`nav-btn ${dateFilterType === 'today' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: '10px', whiteSpace: 'nowrap' }}>Today</button>
            <button onClick={() => handleDateFilterClick('month')} className={`nav-btn ${dateFilterType === 'month' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: '10px', whiteSpace: 'nowrap' }}>This Month</button>
            <button onClick={() => handleDateFilterClick('last_month')} className={`nav-btn ${dateFilterType === 'last_month' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: '10px', whiteSpace: 'nowrap' }}>Last Month</button>
            <button onClick={() => handleDateFilterClick('year')} className={`nav-btn ${dateFilterType === 'year' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: '10px', whiteSpace: 'nowrap' }}>This Year</button>
            <button onClick={() => handleDateFilterClick('custom')} className={`nav-btn ${dateFilterType === 'custom' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: '10px', whiteSpace: 'nowrap' }}>Custom Range</button>
            
            <button onClick={triggerPdfExport} className="nav-btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: '10px', marginLeft: '0.2rem', borderColor: '#f59e0b', color: '#f59e0b', whiteSpace: 'nowrap' }}>
              <Download size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Export PDF
            </button>
          </div>
        </div>

        {dateFilterType === 'custom' && (
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '1.2rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '12px', flexWrap: 'wrap' }}>
            <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ flex: 1, minWidth: '130px' }} />
            <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>to</span>
            <input type="date" className="form-control" value={toDate} onChange={e => setToDate(e.target.value)} style={{ flex: 1, minWidth: '130px' }} />
          </div>
        )}

        {/* 📊 ELEGANT NON-BOXY OVERALL SĀDHANA ACTIVITY BREAKDOWN CARD (100% Mobile Responsive!) */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.75))',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '16px',
          padding: '1.1rem 1.2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ margin: 0, color: 'var(--primary-amber)', fontSize: '0.92rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={16} /> Overall Sādhana Activity Breakdown & Analytics
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '20px' }}>
              Synced with filter ({overallSadhanaBreakdown.totalDays} Days)
            </span>
          </div>

          {/* Activity Breakdown List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              { code: 'MA', label: 'Mangala Arati', data: overallSadhanaBreakdown.ma, color: '#f59e0b' },
              { code: 'JP', label: 'Japa Chanting', data: overallSadhanaBreakdown.jp, color: '#10b981' },
              { code: 'DA', label: 'Daily Reading', data: overallSadhanaBreakdown.read, color: '#8b5cf6' },
              { code: 'SB', label: 'Bhagavatam Class', data: overallSadhanaBreakdown.sb, color: '#3b82f6' },
            ].map(item => (
              <div key={item.code} style={{
                background: 'rgba(10, 16, 30, 0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '0.75rem 0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }}></span>
                    {item.code} ({item.label})
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: '900', color: item.color }}>
                    {item.data.pct}%
                  </span>
                </div>

                {/* Stat Badges Row */}
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', fontSize: '0.68rem' }}>
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1px 6px', borderRadius: '6px', fontWeight: '600' }}>
                    {item.data.attended}d Attended
                  </span>
                  <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '1px 6px', borderRadius: '6px', fontWeight: '600' }}>
                    AT - {item.data.atCount}d
                  </span>
                  <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '1px 6px', borderRadius: '6px', fontWeight: '600' }}>
                    Sick - {item.data.sickCount}d
                  </span>
                  <span style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', padding: '1px 6px', borderRadius: '6px', fontWeight: '600' }}>
                    AB - {item.data.abCount}d
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Totals Summary Ribbon */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <div style={{ padding: '0.65rem 1rem', background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))', borderLeft: '4px solid #f59e0b', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: '700' }}>Total Sadhana</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#f59e0b' }}>{overallSadhanaBreakdown.totalSadhanaPct}%</span>
            </div>
            <div style={{ padding: '0.65rem 1rem', background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05))', borderLeft: '4px solid #6366f1', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: '700' }}>Reading hrs</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#6366f1' }}>{overallSadhanaBreakdown.readingTimeStr}</span>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table" style={{ fontSize: '0.85rem', textAlign: 'center' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Date</th>
                <th>MA</th>
                <th>JP</th>
                <th>JP End</th>
                <th>Read (Pts)</th>
                <th>Read (M)</th>
                <th>SB</th>
                <th>Yoga</th>
                <th>Sleep</th>
                <th>Wake</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No records found for this period.</td></tr>
              ) : (
                filteredHistory.map(entry => {
                  const getVal = (act) => entry.activityTimes?.[act] ? calculatePoints(act, entry.activityTimes[act]) : getAbsentCode(entry.details?.absentReason);
                  
                  return (
                    <tr key={entry.date}>
                      <td style={{ textAlign: 'left', fontWeight: '500', color: 'var(--primary-amber)' }}>{format(parseISO(entry.date), 'dd MMM')}</td>
                      <td>{getVal('mangala_arati')}</td>
                      <td>{getVal('japa')}</td>
                      <td style={{ color: 'var(--accent-emerald)' }}>{entry.details?.chantingCompletionTime || '-'}</td>
                      <td>{getVal('reading')}</td>
                      <td style={{ color: 'var(--accent-blue)' }}>{entry.details?.readingDuration || '0'}</td>
                      <td>{getVal('class')}</td>
                      <td>{getVal('yoga')}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{entry.details?.sleepTime || '-'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{entry.details?.wakeupTime || '-'}</td>
                      <td style={{ fontWeight: 'bold', color: entry.score >= 16 ? 'var(--accent-emerald)' : 'var(--text-main)' }}>{entry.score}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Export Settings Modal */}
      {showPdfSettings && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '1rem'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '16px',
            border: '1px solid var(--border-highlight)', width: '100%', maxWidth: '400px',
            boxShadow: 'var(--shadow-main)', color: 'var(--text-main)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>Export PDF Settings</h3>
              <button onClick={() => setShowPdfSettings(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Customize what to include in your report.</p>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '2rem' }} className="custom-checkbox">
              <input type="checkbox" checked={includeGraphInPdf} onChange={(e) => setIncludeGraphInPdf(e.target.checked)} style={{ display: 'none' }} />
              <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: includeGraphInPdf ? 'var(--primary-amber)' : 'var(--bg-input)' }}>
                {includeGraphInPdf && <CheckCircle size={14} color="#fff" />}
              </div>
              <span style={{ fontSize: '0.95rem' }}>Include currently active graph</span>
            </label>

            <button onClick={() => { setShowPdfSettings(false); handleDownloadReport(); }} className="nav-btn btn-primary" style={{ width: '100%', padding: '0.8rem', justifyContent: 'center' }}>
              Generate Report
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Set Goals Modal via Portal */}
      {showGoalModal && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '1rem'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '16px',
            border: '1px solid var(--border-highlight)', width: '100%', maxWidth: '400px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)', color: 'var(--text-main)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-amber)', fontSize: '1.2rem' }}>Set Monthly Goals</h3>
              <button onClick={() => setShowGoalModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={saveGoals} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Monthly Japa Rounds Target</label>
                <input type="number" name="rounds" defaultValue={customGoals.rounds} className="form-control" style={{ width: '100%', fontSize: '1.1rem', backgroundColor: 'var(--bg-main)' }} required min="1" />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>e.g., 480 (16 rounds x 30 days)</div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Monthly Reading Target (Minutes)</label>
                <input type="number" name="reading" defaultValue={customGoals.reading} className="form-control" style={{ width: '100%', fontSize: '1.1rem', backgroundColor: 'var(--bg-main)' }} required min="1" />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>e.g., 900 (30 mins x 30 days)</div>
              </div>
              
              <button type="submit" className="nav-btn btn-primary" style={{ padding: '0.8rem', fontSize: '1rem', marginTop: '1rem' }}>
                Save Goals
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* WhatsApp Status Modal */}
      {feedModalUser && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} onClick={() => setFeedModalUser(null)}>
          <div className="animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '24px', width: '100%', maxWidth: '360px', padding: '2rem', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setFeedModalUser(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={18} />
            </button>
            
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', padding: '4px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', marginBottom: '1rem' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '3px solid var(--bg-card)', overflow: 'hidden', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                {feedModalUser.user.photo ? <img src={feedModalUser.user.photo} alt="Avatar" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : feedModalUser.user.name.substring(0,2).toUpperCase()}
              </div>
            </div>
            
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: '800' }}>{feedModalUser.user.name}</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--primary-amber)', fontWeight: '600', fontSize: '0.9rem' }}>Today's Sādhana Complete! 🎉</p>
            
            <div style={{ width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}><CheckCircle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}/>Rounds Chanted</span>
                <span style={{ fontWeight: '800', color: '#10b981', fontSize: '1.1rem' }}>{feedModalUser.entry.details?.totalRounds || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}><BookOpen size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}/>Book Reading</span>
                <span style={{ fontWeight: '800', color: '#3b82f6', fontSize: '1.1rem' }}>{feedModalUser.entry.details?.readingDuration || 0}m</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}><Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}/>Wake Up Time</span>
                <span style={{ fontWeight: '800', color: '#8b5cf6', fontSize: '1.1rem' }}>{feedModalUser.entry.details?.wakeupTime || '--'}</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Dashboard;


