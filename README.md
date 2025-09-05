# ALX Polly: A Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project serves as a practical learning ground for modern web development concepts, with a special focus on identifying and fixing common security vulnerabilities.

## 📋 Project Overview

ALX Polly is a comprehensive polling platform that enables users to create, share, and participate in polls. The application features user authentication, poll management, real-time voting, and a responsive dashboard interface.

### Key Features

- **User Authentication**: Secure registration and login system with session management
- **Poll Creation**: Dynamic form for creating polls with 2-10 customizable options
- **Voting System**: One-vote-per-user-per-poll with real-time result updates
- **User Dashboard**: Personal space to manage created polls with edit/delete capabilities
- **Admin Features**: Administrative controls for poll moderation
- **Responsive Design**: Mobile-first UI that works across all device sizes

## 🛠️ Tech Stack

- **Frontend Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/) with strict mode
- **Database & Backend**: [Supabase](https://supabase.io/) with PostgreSQL
- **Authentication**: Supabase Auth with cookie-based sessions
- **UI Components**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: React Server Components + Server Actions
- **Deployment**: Optimized for Vercel deployment

---

## 🚀 The Challenge: Security Audit & Remediation

As a developer, writing functional code is only half the battle. Ensuring that the code is secure, robust, and free of vulnerabilities is just as critical. This version of ALX Polly has been intentionally built with several security flaws, providing a real-world scenario for you to practice your security auditing skills.

**Your mission is to act as a security engineer tasked with auditing this codebase.**

### Your Objectives:

1.  **Identify Vulnerabilities**:
    -   Thoroughly review the codebase to find security weaknesses.
    -   Pay close attention to user authentication, data access, and business logic.
    -   Think about how a malicious actor could misuse the application's features.

2.  **Understand the Impact**:
    -   For each vulnerability you find, determine the potential impact.Query your AI assistant about it. What data could be exposed? What unauthorized actions could be performed?

3.  **Propose and Implement Fixes**:
    -   Once a vulnerability is identified, ask your AI assistant to fix it.
    -   Write secure, efficient, and clean code to patch the security holes.
    -   Ensure that your fixes do not break existing functionality for legitimate users.

### Where to Start?

A good security audit involves both static code analysis and dynamic testing. Here’s a suggested approach:

1.  **Familiarize Yourself with the Code**:
    -   Start with `app/lib/actions/` to understand how the application interacts with the database.
    -   Explore the page routes in the `app/(dashboard)/` directory. How is data displayed and managed?
    -   Look for hidden or undocumented features. Are there any pages not linked in the main UI?

2.  **Use Your AI Assistant**:
    -   This is an open-book test. You are encouraged to use AI tools to help you.
    -   Ask your AI assistant to review snippets of code for security issues.
    -   Describe a feature's behavior to your AI and ask it to identify potential attack vectors.
    -   When you find a vulnerability, ask your AI for the best way to patch it.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v20.x or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Supabase Account** - [Sign up for free](https://supabase.io/)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd alx-polly
```

2. **Install dependencies**:
```bash
npm install
# or
yarn install
```

### Supabase Setup

1. **Create a new Supabase project**:
   - Go to [supabase.io](https://supabase.io) and create a new project
   - Wait for the database to be provisioned

2. **Set up the database schema**:
   Run these SQL commands in the Supabase SQL Editor:

```sql
-- Create polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies (basic - may contain vulnerabilities for learning)
CREATE POLICY "Users can view all polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Users can create polls" ON polls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own polls" ON polls FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own polls" ON polls FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For development
NODE_ENV=development
```

**To find your Supabase credentials**:
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **URL** and **anon public** key

### Running the Application

1. **Development server**:
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

2. **Production build**:
```bash
npm run build
npm start
```

3. **Type checking**:
```bash
npm run tsc
```

4. **Linting**:
```bash
npm run lint
```

## 💡 Usage Examples

### Creating an Account
1. Navigate to `/register`
2. Fill in your name, email, and password
3. Click "Register" (email verification may be required)

### Creating a Poll
1. Log in and go to the dashboard
2. Click "Create New Poll"
3. Enter your poll question (max 500 characters)
4. Add 2-10 options (each max 200 characters)
5. Click "Create Poll"

### Voting on Polls
1. Browse to any poll page
2. Select your preferred option
3. Click "Submit Vote"
4. View real-time results with percentage breakdowns

### Managing Your Polls
1. Visit the "My Polls" dashboard
2. Click on any poll card to view details
3. Use "Edit" to modify questions/options
4. Use "Delete" to permanently remove polls

## 🧪 Testing the Application

### Manual Testing Checklist

**Authentication Flow**:
- [ ] User registration with valid/invalid data
- [ ] Login with correct/incorrect credentials
- [ ] Session persistence across page reloads
- [ ] Logout functionality

**Poll Management**:
- [ ] Create polls with various option counts
- [ ] Edit existing polls
- [ ] Delete polls (own vs others)
- [ ] View poll details and results

**Voting System**:
- [ ] Vote on polls as different users
- [ ] Attempt duplicate voting
- [ ] View updated results immediately

**Security Testing**:
- [ ] Access controls (unauthorized actions)
- [ ] Input validation (XSS, SQL injection attempts)
- [ ] Session management (expired tokens)
- [ ] Admin functionality boundaries

### Browser Testing
Test across multiple browsers:
- Chrome/Chromium
- Firefox
- Safari
- Edge

### Mobile Responsiveness
Test on various screen sizes:
- Mobile (320px+)
- Tablet (768px+)
- Desktop (1024px+)

## 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run tsc` | Type check with TypeScript |

---

## 🚀 The Challenge: Security Audit & Remediation

Good luck, engineer! This is your chance to step into the shoes of a security professional and make a real impact on the quality and safety of this application. Happy hunting!
