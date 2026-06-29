# Graph Report - src  (2026-06-24)

## Corpus Check
- 67 files · ~51,290 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 352 nodes · 872 edges · 16 communities (11 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Calendar & Routine Admin|Calendar & Routine Admin]]
- [[_COMMUNITY_App Entry & Auth Flow|App Entry & Auth Flow]]
- [[_COMMUNITY_Role & Access Control|Role & Access Control]]
- [[_COMMUNITY_Auth Context & Firebase Ops|Auth Context & Firebase Ops]]
- [[_COMMUNITY_Notes & Syllabus Content|Notes & Syllabus Content]]
- [[_COMMUNITY_Admin Services & User Mgmt|Admin Services & User Mgmt]]
- [[_COMMUNITY_Homework & Calendar Data|Homework & Calendar Data]]
- [[_COMMUNITY_Maths Marks Dashboard|Maths Marks Dashboard]]
- [[_COMMUNITY_Syllabus Progress Tracking|Syllabus Progress Tracking]]
- [[_COMMUNITY_Attendance Calendar|Attendance Calendar]]
- [[_COMMUNITY_Class Info & Roster|Class Info & Roster]]
- [[_COMMUNITY_Share Card|Share Card]]
- [[_COMMUNITY_Firebase Config|Firebase Config]]
- [[_COMMUNITY_React Logo Asset|React Logo Asset]]
- [[_COMMUNITY_Vite Logo Asset|Vite Logo Asset]]
- [[_COMMUNITY_Hero Image Asset|Hero Image Asset]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 46 edges
2. `db` - 15 edges
3. `userRef()` - 15 edges
4. `getUserByPhone()` - 11 edges
5. `ROLES` - 11 edges
6. `getClosedDays()` - 10 edges
7. `notifyClassSafe()` - 9 edges
8. `SyllabusManager()` - 9 edges
9. `fromDateKey()` - 9 edges
10. `notifyClass()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `ProfilePage()` --calls--> `useAuth()`  [EXTRACTED]
  pages/ProfilePage.jsx → auth/AuthContext.jsx
- `Homework()` --calls--> `useAuth()`  [EXTRACTED]
  pages/Homework.jsx → auth/AuthContext.jsx
- `SyllabusPage()` --calls--> `useAuth()`  [EXTRACTED]
  pages/SyllabusPage.jsx → auth/AuthContext.jsx
- `HolidayHomework()` --calls--> `useAuth()`  [EXTRACTED]
  pages/HolidayHomework.jsx → auth/AuthContext.jsx
- `NotesPage()` --calls--> `useAuth()`  [EXTRACTED]
  pages/NotesPage.jsx → auth/AuthContext.jsx

## Communities (16 total, 5 thin omitted)

### Community 0 - "Calendar & Routine Admin"
Cohesion: 0.11
Nodes (33): formatDate(), NoticeBar(), fromDateKey(), getPeriodsForDate(), PERIOD_LABELS, weekdayName(), WEEKLY_ROUTINE, AdminPanel() (+25 more)

### Community 1 - "App Entry & Auth Flow"
Cohesion: 0.07
Nodes (19): AuthProvider(), firstNameMatches(), matchStudent(), rollList, AuthModal(), S, TYPE_META, PAGE_LABELS (+11 more)

### Community 2 - "Role & Access Control"
Cohesion: 0.10
Nodes (32): useAuth(), ADMINS, getUserRole(), MONITORS, ROLES, ForegroundToast(), MarksBanner(), STORAGE_KEY() (+24 more)

### Community 3 - "Auth Context & Firebase Ops"
Cohesion: 0.12
Nodes (28): AuthContext, completeOnboarding(), completeWhatsNew(), ensureBroadcastKey(), getAttendance(), getCheckedTopics(), getHolidayHomework(), getHomeworkDone() (+20 more)

### Community 4 - "Notes & Syllabus Content"
Cohesion: 0.09
Nodes (22): syllabusData, NotesReviewTab(), NotesPage(), TOUR_STEPS, approveNote(), deleteNote(), getMyNotes(), getNoteById() (+14 more)

### Community 5 - "Admin Services & User Mgmt"
Cohesion: 0.12
Nodes (28): resetWhatsNew(), ActivityTab(), MarksTab(), MergeTab(), OnboardingTab(), ROLE_STYLE, TABS, TeachersTab() (+20 more)

### Community 6 - "Homework & Calendar Data"
Cohesion: 0.09
Nodes (19): CALENDAR_EVENTS, EVENT_TYPES, homeworkData, formatForWhatsApp(), Homework(), homeworkDateParam(), SUBJECT_EMOJI, ACADEMIC_MONTHS (+11 more)

### Community 7 - "Maths Marks Dashboard"
Cohesion: 0.10
Nodes (14): MATH_MARKS_RAW, axisStyle, C, GRADE_COLORS, TT, classStats(), getRank(), resolve() (+6 more)

### Community 8 - "Syllabus Progress Tracking"
Cohesion: 0.17
Nodes (19): allTopics(), chapterTopics(), pct(), sectionTopics(), statsForTopics(), subjectTopics(), toSets(), SyllabusManager() (+11 more)

### Community 9 - "Attendance Calendar"
Cohesion: 0.19
Nodes (18): ACADEMIC_MONTHS, AttendanceCalendar(), DAY_LABELS, getDaysInMonth(), getFirstWeekday(), MONTHS, calcAttendance(), calcMonthlyAveragedPercentage() (+10 more)

### Community 10 - "Class Info & Roster"
Cohesion: 0.33
Nodes (4): monitors, students, studentsData, ROUTINE_TABLE

## Knowledge Gaps
- **40 isolated node(s):** `firebaseConfig`, `app`, `MONITORS`, `ADMINS`, `AuthContext` (+35 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Role & Access Control` to `Calendar & Routine Admin`, `App Entry & Auth Flow`, `Auth Context & Firebase Ops`, `Notes & Syllabus Content`, `Admin Services & User Mgmt`, `Homework & Calendar Data`, `Maths Marks Dashboard`, `Syllabus Progress Tracking`, `Attendance Calendar`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Why does `db` connect `Homework & Calendar Data` to `Calendar & Routine Admin`, `App Entry & Auth Flow`, `Role & Access Control`, `Auth Context & Firebase Ops`, `Notes & Syllabus Content`, `Admin Services & User Mgmt`, `Syllabus Progress Tracking`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `ROLES` connect `Role & Access Control` to `Calendar & Routine Admin`, `App Entry & Auth Flow`, `Auth Context & Firebase Ops`, `Notes & Syllabus Content`, `Admin Services & User Mgmt`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `firebaseConfig`, `app`, `MONITORS` to the rest of the system?**
  _40 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Calendar & Routine Admin` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `App Entry & Auth Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.06620209059233449 - nodes in this community are weakly interconnected._
- **Should `Role & Access Control` be split into smaller, more focused modules?**
  _Cohesion score 0.09639953542392567 - nodes in this community are weakly interconnected._