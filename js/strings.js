/* App-wide UI text. Tournament-specific text lives in
   tournaments/<id>/tournament.json under "text". */
export default {
  en: {
    schedule: 'Schedule', groups: 'Groups', knockout: 'Knockout', stats: 'Stats', myTeams: 'My teams',
    language: 'Language', today: 'Today', match: 'match', matches: 'matches',
    upcoming: 'Upcoming', live: 'Live', halfTime: 'Half-time', extraTime: 'Extra time', penalties: 'Penalties',
    ft: 'FT', aet: 'AET', pensTag: 'Pens', pens: 'pens', tbd: 'TBD', group: 'Group', qualified: 'Qualified',
    nextKickoff: 'Next kick-off in', venue: 'Venue', whereToWatch: 'Where to watch',
    table: { team: 'Team', p: 'P', w: 'W', d: 'D', l: 'L', gf: 'GF', ga: 'GA', gd: 'GD', pts: 'Pts', form: 'Form' },
    champion: 'Champion',
    feedLoading: 'Loading live scores…', feedError: 'Live scores unavailable — retrying',
    feedNone: 'No live score feed is connected yet — showing the fixture list.',
    goals: 'Goals', assists: 'Assists', cleanSheets: 'Clean sheets', player: 'Player', team: 'Team',
    totalGoals: 'Total goals', penaltyGoals: 'Penalty goals', todayGoals: 'Today', totalAssists: 'Total assists',
    noGoals: 'No goals yet.', noAssists: 'No assists yet.', noSheets: 'No clean sheets yet (needs lineups).',
    winnersTitle: 'Past winners', scorersTitle: 'All-time top scorers', titles: 'Titles', years: 'Years',
    lineups: 'Lineups', subs: 'Substitutes', assist: 'assist', shootout: 'Penalty shootout', bookings: 'Bookings',
    scored: 'scored', missed: 'missed', og: 'own goal', pen: 'pen',
    pickTeams: 'Pick up to 5 teams to follow', yourTeams: 'Your teams', noFavs: 'You are not following any team yet.',
    standing: 'Standing', position: 'Position', points: 'Points', scorers: 'Scorers', vs: 'vs', noData: 'No data yet',
    goalShout: 'GOAL!',
    weekdays: {},
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  },
  ar: {
    schedule: 'المباريات', groups: 'المجموعات', knockout: 'الأدوار الإقصائية', stats: 'الإحصائيات', myTeams: 'فِرَقي',
    language: 'اللغة', today: 'اليوم', match: 'مباراة', matches: 'مباريات',
    upcoming: 'قادمة', live: 'مباشر', halfTime: 'بين الشوطين', extraTime: 'وقت إضافي', penalties: 'ركلات ترجيح',
    ft: 'انتهت', aet: 'بعد التمديد', pensTag: 'ركلات', pens: 'ركلات', tbd: 'يُحدد لاحقاً', group: 'المجموعة', qualified: 'متأهل',
    nextKickoff: 'المباراة الجاية بعد', venue: 'الملعب', whereToWatch: 'القنوات الناقلة',
    table: { team: 'المنتخب', p: 'ل', w: 'ف', d: 'ت', l: 'خ', gf: 'له', ga: 'عليه', gd: 'الفارق', pts: 'نقاط', form: 'آخر النتائج' },
    champion: 'البطل',
    feedLoading: 'جارٍ تحميل النتائج المباشرة…', feedError: 'تعذّر تحميل النتائج — تتم إعادة المحاولة',
    feedNone: 'لا يوجد مصدر نتائج مباشرة حتى الآن — يتم عرض جدول المباريات.',
    goals: 'الأهداف', assists: 'التمريرات الحاسمة', cleanSheets: 'شباك نظيفة', player: 'اللاعب', team: 'المنتخب',
    totalGoals: 'إجمالي الأهداف', penaltyGoals: 'أهداف الركلات', todayGoals: 'اليوم', totalAssists: 'إجمالي التمريرات الحاسمة',
    noGoals: 'لا توجد أهداف بعد.', noAssists: 'لا توجد تمريرات حاسمة بعد.', noSheets: 'لا توجد شباك نظيفة بعد (تحتاج التشكيلات).',
    winnersTitle: 'الأبطال السابقون', scorersTitle: 'أكثر الهدافين عبر التاريخ', titles: 'الألقاب', years: 'السنوات',
    lineups: 'التشكيلات', subs: 'البدلاء', assist: 'صناعة', shootout: 'ركلات الترجيح', bookings: 'البطاقات',
    scored: 'سجّل', missed: 'أضاع', og: 'هدف عكسي', pen: 'جزاء',
    pickTeams: 'اختر حتى 5 فِرَق لمتابعتها', yourTeams: 'فِرَقك', noFavs: 'لا تتابع أي فريق بعد.',
    standing: 'الترتيب', position: 'المركز', points: 'النقاط', scorers: 'الهدافون', vs: 'ضد', noData: 'لا توجد بيانات بعد',
    goalShout: 'هدف!',
    weekdays: { Sunday: 'الأحد', Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت' },
    months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  }
};
