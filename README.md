# EduVision - AI-Native Learning Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An AI-native, full-stack educational platform combining real-time streaming classroom interaction, in-browser sandboxed code execution, AI-assisted curriculum generation, and cognitive spaced-repetition retention algorithms.

---

## Key Features

### 1. In-Browser Sandboxed Code Execution (CodeLab)
- **V8 Sandboxed Runtime**: Isolated in-browser code evaluation for JavaScript and Python with sub-50ms execution latency.
- **Automated Assertion Suites**: Instant unit-test validation comparing user output against test suites with pass/fail telemetry.
- **Pre-loaded Challenge Catalog**: Algorithm and data structure challenges ranging from easy to hard.

### 2. SuperMemo-2 (SM-2) Spaced Repetition Engine
- **Cognitive Science Retention**: Implementation of the canonical SM-2 algorithm:
  $$EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02)), \quad EF \ge 1.3$$
- **Adaptive Scheduling**: Dynamically computes intervals ($I_1 = 1$, $I_2 = 6$, $I_n = I_{n-1} \times EF$) and next review dates based on user recall difficulty ratings (1 to 5).
- **AI-Powered Card Generation**: Instant generation of comprehensive flashcard decks from any course lesson content using Gemini AI.

### 3. YouTube-Grade Live Classroom & Real-Time Chat
- **Bidirectional WebSockets**: Native, resilient `ws` streaming connection for live communication.
- **Theater Mode**: Docked YouTube/custom video stream side-by-side with synchronized live chat.
- **Verified Instructor Badges**: Distinct `[Teacher 🎓]` badges for verified instructor messages.
- **Audience Engagement**: Real-time room presence counter (`LIVE_VIEWER_COUNT`), message pinning, and floating animated emoji reaction bursts.

### 4. Gemini AI Integration
- **Smart Doubt Resolver**: Real-time AI assistant for instant clarification on any course lesson.
- **Automated Quiz Generation**: Generates 5-question multi-choice assessments with explanations from syllabus topics.
- **Curriculum Structuring**: AI-assisted course and lesson content drafting.

### 5. Role-Based Access Control (RBAC) & Governance
- **Student**: Enroll in courses, take quizzes, review SM-2 flashcards, execute code in CodeLab, and participate in live streams.
- **Instructor**: Create and manage courses, upload YouTube video lectures, trigger live streaming sessions, pin chat messages, and manage doubts.
- **Admin**: Review, approve, or reject submitted courses, manage platform users, and inspect analytics.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, Vite |
| **Backend** | Node.js, Express.js, Native WebSockets (`ws`), V8 Sandbox Runtime |
| **Database & ORM** | SQLite / SQL via Sequelize ORM (PostgreSQL & MySQL compatible) |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs password hashing |
| **AI Engine** | Google Gemini Generative AI SDK (`@google/genai`) |

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/eduvision.git
cd eduvision
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```env
# Optional: Google Gemini API Key for AI features
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Secret Key
JWT_SECRET=your_super_secret_jwt_key_here

# Application URL / Port
PORT=3000
```
*(Note: A template is available in `.env.example`.)*

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Both the React frontend and Express/WebSocket backend run concurrently on port 3000.

### 5. Production Build & Linting
```bash
npm run lint
npm run build
```

---

## Demo Credentials (Auto-Seeded)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@eduvision.com` | `admin123` |
| **Instructor** | `instructor@eduvision.com` | `instructor123` |
| **Student** | `student@eduvision.com` | `student123` |

*(Or register a new student/instructor account directly from the UI.)*

---

## Architecture & REST Endpoints

### Authentication
- `POST /api/auth/register` - Create student or instructor account
- `POST /api/auth/login` - Authenticate user & issue JWT
- `GET /api/auth/me` - Retrieve current authenticated profile

### Courses & Lessons
- `GET /api/courses` - Fetch approved course catalog
- `GET /api/courses/:id` - Fetch course syllabus, lessons, and enrollment state
- `POST /api/courses` - Create new course (Instructor/Admin)
- `POST /api/courses/:id/enroll` - Enroll authenticated student
- `POST /api/courses/:id/approve` - Approve course for public catalog (Admin)

### Live Streaming & Real-Time Classroom
- `GET /api/live/:lessonId/messages` - Fetch live chat message history
- `POST /api/live/:lessonId/status` - Update lesson live broadcast status
- `POST /api/live/:lessonId/pin` - Pin important announcement to top of chat
- `WS ws://localhost:3000/ws` - WebSocket protocol for live chat, presence, and reactions

### Spaced Repetition & CodeLab
- `GET /api/flashcards/deck/:courseId` - Retrieve due flashcards for course
- `POST /api/flashcards/:id/review` - Submit SM-2 recall rating (1–5) and update interval
- `POST /api/codelab/execute` - Execute code against test suites in isolated sandbox

---

## License
MIT
