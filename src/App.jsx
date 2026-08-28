import { useCallback, useEffect, useState } from 'react'
import {
  getDomainsByBranch,
  getQuestions,
} from './data/questionService'
import {
  clearProgress,
  getDashboardStats,
  saveQuizAttempt,
} from './services/progressService'
import { useAuth } from './useAuth'
import AuthScreen from './AuthScreen'

// ---------------------------------------------------------------------------
// Design tokens — blueprint / technical-drawing system.
// Add this @import to your global CSS (or keep the <style> tag below).
// ---------------------------------------------------------------------------
const TOKENS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

  :root {
    --paper: #F3F5F1;
    --paper-line: #DDE3DC;
    --ink: #14213D;
    --ink-soft: #5B6470;
    --blueprint: #2455A4;
    --blueprint-soft: #E8EEF7;
    --signal: #E2582A;
    --signal-soft: #FBEAE2;
    --good: #2F7A54;
    --good-soft: #E7F3EC;
  }

  .bp-grid {
    background-color: var(--paper);
    background-image:
      linear-gradient(var(--paper-line) 1px, transparent 1px),
      linear-gradient(90deg, var(--paper-line) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  .bp-corners { position: relative; }
  .bp-corners::before,
  .bp-corners::after,
  .bp-corners .bp-c2,
  .bp-corners .bp-c3 {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    border-color: var(--ink);
    opacity: 0.35;
  }
  .bp-corners::before { top: -1px; left: -1px; border-top: 2px solid; border-left: 2px solid; }
  .bp-corners::after { top: -1px; right: -1px; border-top: 2px solid; border-right: 2px solid; }
  .bp-corners .bp-c2 { bottom: -1px; left: -1px; border-bottom: 2px solid; border-left: 2px solid; }
  .bp-corners .bp-c3 { bottom: -1px; right: -1px; border-bottom: 2px solid; border-right: 2px solid; }

  .font-display { font-family: 'Space Grotesk', sans-serif; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }
  .font-body { font-family: 'Inter', sans-serif; }
`

const branches = [
  {
    id: 'cse',
    name: 'Computer Science Engineering',
    shortName: 'CSE',
    code: '01',
    icon: '💻',
    swatch: '#2455A4',
  },
  {
    id: 'ece',
    name: 'Electronics & Communication',
    shortName: 'ECE',
    code: '02',
    icon: '📡',
    swatch: '#6E4FA3',
  },
  {
    id: 'ee',
    name: 'Electrical Engineering',
    shortName: 'EE',
    code: '03',
    icon: '⚡',
    swatch: '#B8862E',
  },
  {
    id: 'agri',
    name: 'Agricultural Engineering',
    shortName: 'AE',
    code: '04',
    icon: '🌱',
    swatch: '#3F8F5F',
  },
  {
    id: 'civil',
    name: 'Civil Engineering',
    shortName: 'CE',
    code: '05',
    icon: '🏗️',
    swatch: '#B4453F',
  },
  {
    id: 'mech',
    name: 'Mechanical Engineering',
    shortName: 'ME',
    code: '06',
    icon: '⚙️',
    swatch: '#2B7A78',
  },
]

const studyMaterials = [
  {
    branch: 'cse',
    topic: 'Data Structures',
    title: 'Data Structures and Algorithms',
    channel: 'Neso Academy',
    url: 'https://www.youtube.com/results?search_query=Neso+Academy+data+structures+algorithms',
  },
  {
    branch: 'cse',
    topic: 'DBMS',
    title: 'DBMS Complete Course',
    channel: 'Gate Smashers',
    url: 'https://www.youtube.com/results?search_query=Gate+Smashers+DBMS',
  },
  {
    branch: 'ece',
    topic: 'Digital Electronics',
    title: 'Digital Electronics',
    channel: 'Neso Academy',
    url: 'https://www.youtube.com/results?search_query=Neso+Academy+digital+electronics',
  },
  {
    branch: 'ee',
    topic: 'Circuit Theory',
    title: 'Electrical Circuit Theory',
    channel: 'Neso Academy',
    url: 'https://www.youtube.com/results?search_query=Neso+Academy+circuit+theory',
  },
  {
    branch: 'agri',
    topic: 'Irrigation',
    title: 'Irrigation Engineering',
    channel: 'Agriculture Adda',
    url: 'https://www.youtube.com/results?search_query=irrigation+engineering+agricultural+engineering',
  },
  {
    branch: 'civil',
    topic: 'Structural Analysis',
    title: 'Structural Analysis',
    channel: 'Civil Engineering Academy',
    url: 'https://www.youtube.com/results?search_query=structural+analysis+civil+engineering',
  },
  {
    branch: 'mech',
    topic: 'Thermodynamics',
    title: 'Engineering Thermodynamics',
    channel: 'Neso Academy',
    url: 'https://www.youtube.com/results?search_query=Neso+Academy+thermodynamics',
  },
]

function TitleBlock({ sheet }) {
  return (
    <div className="hidden overflow-hidden border-2 border-[var(--ink)] font-mono text-[11px] sm:flex">
      <div className="border-r-2 border-[var(--ink)] px-3 py-2">
        <p className="text-[var(--ink-soft)]">SHEET</p>
        <p className="font-semibold">{sheet}</p>
      </div>
      <div className="border-r-2 border-[var(--ink)] px-3 py-2">
        <p className="text-[var(--ink-soft)]">SCALE</p>
        <p className="font-semibold">N.T.S.</p>
      </div>
      <div className="px-3 py-2">
        <p className="text-[var(--ink-soft)]">REV</p>
        <p className="font-semibold">A</p>
      </div>
    </div>
  )
}

function CornerMarks() {
  return (
    <>
      <span className="bp-c2" />
      <span className="bp-c3" />
    </>
  )
}

function App() {
  const { user, loading: authLoading, logout } = useAuth()
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [selectedDomain, setSelectedDomain] = useState(null)
  const [screen, setScreen] = useState('dashboard')
  const [questions, setQuestions] = useState([])
  const [quizInfo, setQuizInfo] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState([])
  const [timeLeft, setTimeLeft] = useState(45)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selected = branches.find((branch) => branch.id === selectedBranch)
  const currentQuestion = questions[currentIndex]
  const domains = selectedBranch ? getDomainsByBranch(selectedBranch) : []

  const [analytics, setAnalytics] = useState({
    totalAttempts: 0,
    averageScore: 0,
    accuracy: 0,
    bestDomain: '—',
    recent: [],
  })

  const loadAnalytics = useCallback(async () => {
    if (!user) return
    try {
      const stats = await getDashboardStats()
      setAnalytics(stats)
    } catch (err) {
      console.error('Failed to load progress:', err)
    }
  }, [user])

    useEffect(() => {
    // Async fetch-on-mount: setAnalytics only runs after the Firestore
    // await resolves, not synchronously in the effect body, so this is
    // the standard data-fetching pattern, not a state-sync anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnalytics()
  }, [loadAnalytics])
    const selectedMaterials = selectedBranch
    ? studyMaterials.filter((material) => material.branch === selectedBranch)
    : []
  const domainMaterials = selectedDomain
    ? selectedMaterials.filter((material) => material.topic === selectedDomain)
    : []

  // mode: 'practice' | 'domainMock' (both domain-scoped) | 'mock' | 'graded' (branch-wide)
  async function startQuiz(domain, mode = 'practice') {
    setLoading(true)
    setError('')

    const questionTime =
      mode === 'graded' ? 30 : mode === 'mock' || mode === 'domainMock' ? 60 : 45

    try {
      const loadedQuestions = await getQuestions({
        branch: selectedBranch,
        domain: domain || null,
        limit: 10,
      })

      setQuestions(loadedQuestions)
      setQuizInfo({
        branchId: selectedBranch,
        branchName: selected.name,
        branchShortName: selected.shortName,
        domain: domain || null,
        domainLabel: domain || 'Mixed Engineering Domains',
        mode,
        questionTime,
      })
      setCurrentIndex(0)
      setSelectedOption(null)
      setSubmitted(false)
      setAnswers([])
      setTimeLeft(questionTime)
      setScreen('quiz')
    } catch (err) {
      setError(err.message || 'Unable to load this quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = useCallback(() => {
    if (submitted || !currentQuestion) return

    const isCorrect = selectedOption === currentQuestion.correctAnswer

    setAnswers((previousAnswers) => [
      ...previousAnswers,
      {
        questionId: currentQuestion.id,
        selectedOption,
        isCorrect,
      },
    ])

    setSubmitted(true)
  }, [submitted, currentQuestion, selectedOption])

  useEffect(() => {
    if (screen !== 'quiz' || submitted) return

    const timer = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          clearInterval(timer)
          submitAnswer()
          return 0
        }

        return time - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [screen, submitted, submitAnswer])

    async function nextQuestion() {
    if (!submitted) {
      submitAnswer()
      return
    }

    const isLastQuestion = currentIndex === questions.length - 1

    if (isLastQuestion) {
      try {
        await saveQuizAttempt({
          branchId: quizInfo.branchId,
          branchName: quizInfo.branchName,
          domain: quizInfo.domainLabel,
          totalQuestions: questions.length,
          answers,
        })
        await loadAnalytics()
      } catch (err) {
        console.error('Failed to save quiz attempt:', err)
      }
      setScreen('results')
      return
    }

    setCurrentIndex((index) => index + 1)
    setSelectedOption(null)
    setSubmitted(false)
    setTimeLeft(quizInfo.questionTime)
  }

  function returnToDashboard() {
    setScreen('dashboard')
    setSelectedBranch(null)
    setSelectedDomain(null)
    setQuestions([])
    setAnswers([])
    setError('')
  }

  function openDomain(domain) {
    setSelectedDomain(domain)
    setError('')
    setScreen('domain')
  }

  function backToBranch() {
    setScreen('branch')
    setSelectedDomain(null)
    setError('')
  }

  if (screen === 'quiz' && currentQuestion) {
    return (
      <>
        <style>{TOKENS}</style>
        <QuizScreen
          question={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          submitted={submitted}
          submitAnswer={submitAnswer}
          nextQuestion={nextQuestion}
          timeLeft={timeLeft}
          mode={quizInfo.mode}
        />
      </>
    )
  }

  if (screen === 'results') {
    return (
      <>
        <style>{TOKENS}</style>
        <ResultsScreen
          questions={questions}
          answers={answers}
          quizInfo={quizInfo}
          tryAgain={() => startQuiz(quizInfo.domain, quizInfo.mode)}
          returnToDashboard={returnToDashboard}
        />
      </>
    )
  }

  if (screen === 'branch' && selected) {
    return (
      <>
        <style>{TOKENS}</style>
        <BranchScreen
          branch={selected}
          domains={domains}
          error={error}
          onSelectDomain={openDomain}
          onMock={() => startQuiz(null, 'mock')}
          onGraded={() => startQuiz(null, 'graded')}
          onBack={returnToDashboard}
        />
      </>
    )
  }

  if (screen === 'domain' && selected && selectedDomain) {
    return (
      <>
        <style>{TOKENS}</style>
        <DomainScreen
          branch={selected}
          domain={selectedDomain}
          materials={domainMaterials}
          loading={loading}
          error={error}
          onPractice={() => startQuiz(selectedDomain, 'practice')}
          onDomainMock={() => startQuiz(selectedDomain, 'domainMock')}
          onBack={backToBranch}
        />
      </>
    )
  }

    if (authLoading) {
    return (
      <main className="bp-grid font-body grid min-h-screen place-items-center text-[var(--ink)]">
        <style>{TOKENS}</style>
        <p className="font-mono text-sm uppercase tracking-widest text-[var(--ink-soft)]">
          Loading…
        </p>
      </main>
    )
  }

  if (!user) {
    return (
      <>
        <style>{TOKENS}</style>
        <AuthScreen />
      </>
    )
  }

  return (
    <main className="bp-grid font-body min-h-screen text-[var(--ink)]">
      <style>{TOKENS}</style>

      {/* ---------------- Header / title block ---------------- */}
      <header className="border-b-2 border-[var(--ink)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center border-2 border-[var(--ink)] font-display text-xl font-bold text-[var(--ink)]">
              Q
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight">EngiQuiz</p>
              <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--ink-soft)]">
                Learn · Practice · Improve
              </p>
            </div>
          </div>

                    <div className="flex items-center gap-3">
            <TitleBlock sheet="DASHBOARD" />
            <button
              onClick={logout}
              className="font-mono border-2 border-[var(--ink)]/25 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--ink)] transition hover:border-[var(--signal)] hover:text-[var(--signal)]"
            >
              Log out
            </button>
          </div>
          </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* ---------------- Hero ---------------- */}
        <section className="bp-corners mb-10 border-2 border-[var(--ink)] bg-[var(--ink)] p-7 text-[var(--paper)] md:p-10">
          <CornerMarks />
          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
            <div>
              <p className="font-mono mb-3 text-xs uppercase tracking-[0.25em] text-[#9FB3D6]">
                § Engineering Quiz Platform
              </p>
              <h1 className="font-display max-w-2xl text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
                Build confidence,
                <br />
                one quiz at a time.
              </h1>
              <p className="mt-4 max-w-xl text-[#C4CEDD]">
                Select your branch, practice a domain, and understand every answer —
                spec by spec.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 self-end">
              <StatCard value={analytics.totalAttempts} label="Quizzes completed" />
              <StatCard value={`${analytics.averageScore}%`} label="Average score" />
              <StatCard value={`${analytics.accuracy}%`} label="Overall accuracy" />
              <StatCard value={analytics.bestDomain} label="Strongest domain" />
            </div>
          </div>
        </section>

        {/* ---------------- Branch picker ---------------- */}
        <section>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--blueprint)]">
            § 01 — Start learning
          </p>
          <h2 className="font-display mt-1 text-3xl font-bold tracking-tight">
            Select your engineering branch
          </h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            Choose a branch, then tap a domain to see your options.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => {
              const isActive = selectedBranch === branch.id
              return (
                <button
                  key={branch.id}
                  onClick={() => {
                    setSelectedBranch(branch.id)
                    setSelectedDomain(null)
                    setError('')
                    setScreen('branch')
                  }}
                  className={`bp-corners group border-2 bg-white p-5 text-left transition ${isActive
                    ? 'border-[var(--blueprint)]'
                    : 'border-[var(--ink)]/25 hover:border-[var(--ink)]'
                    }`}
                >
                  <CornerMarks />
                  <div className="flex items-center justify-between">
                    <div
                      className="grid h-11 w-11 place-items-center border-2 text-xl"
                      style={{ borderColor: branch.swatch, color: branch.swatch }}
                    >
                      {branch.icon}
                    </div>
                    <span className="font-mono text-xs text-[var(--ink-soft)]">
                      NO. {branch.code}
                    </span>
                  </div>

                  <p className="font-mono mt-4 text-xs font-semibold uppercase tracking-widest text-[var(--ink-soft)]">
                    {branch.shortName}
                  </p>
                  <h3 className="font-display mt-1 text-lg font-bold">{branch.name}</h3>
                  <p className="mt-3 text-sm text-[var(--ink-soft)]">
                    Practice core concepts and exam-style questions.
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        {/* ---------------- Performance analytics ---------------- */}
        <section className="bp-corners mt-10 border-2 border-[var(--ink)] bg-white p-6">
          <CornerMarks />
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--ink-soft)]">
                § 03 — Performance analytics
              </p>
              <h2 className="font-display mt-1 text-2xl font-bold">
                Recent quiz activity
              </h2>
            </div>

            {analytics.totalAttempts > 0 && (
              <button
                onClick={async () => {
                  if (window.confirm('Clear all saved quiz progress?')) {
                    try {
                      await clearProgress()
                      await loadAnalytics()
                    } catch (err) {
                      console.error('Failed to clear progress:', err)
                    }
                    setSelectedBranch(null)
                    setSelectedDomain(null)
                  }
                }}
                className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--signal)] hover:underline"
              >
                Clear progress
              </button>
            )}
          </div>

          {analytics.recent.length === 0 ? (
            <div className="font-mono mt-5 border-2 border-dashed border-[var(--ink)]/25 p-5 text-sm text-[var(--ink-soft)]">
              NO QUIZ ATTEMPTS YET. Complete a quiz to start tracking your
              performance.
            </div>
          ) : (
            <div className="mt-5 divide-y-2 divide-dashed divide-[var(--ink)]/15">
              {analytics.recent.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-[var(--ink)]">
                      {attempt.branchName} · {attempt.domain}
                    </p>
                    <p className="font-mono mt-1 text-xs text-[var(--ink-soft)]">
                      {new Date(attempt.completedAt).toLocaleDateString()}
                      {' · '}
                      {attempt.correctAnswers}/{attempt.totalQuestions} correct
                    </p>
                  </div>

                  <span className="font-mono border-2 border-[var(--blueprint)] px-3 py-2 text-sm font-bold text-[var(--blueprint)]">
                    {attempt.score}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Branch page — shown when a branch is selected. Lists its domains plus
// whole-branch mock/graded test options.
// ---------------------------------------------------------------------------
function BranchScreen({ branch, domains, error, onSelectDomain, onMock, onGraded, onBack }) {
  return (
    <main className="bp-grid font-body min-h-screen text-[var(--ink)]">
      <header className="border-b-2 border-[var(--ink)] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="font-mono flex items-center gap-2 border-2 border-[var(--ink)]/25 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--ink)] transition hover:border-[var(--ink)]"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 shrink-0" style={{ backgroundColor: branch.swatch }} />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--ink-soft)]">
                  {branch.shortName} quiz domains
                </p>
                <p className="font-display font-bold">{branch.name}</p>
              </div>
            </div>
          </div>
          <TitleBlock sheet="BRANCH" />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <p className="mt-2 text-[var(--ink-soft)]">
          Tap a domain to see practice and mock test options.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 border-2 border-[var(--signal)] bg-[var(--signal-soft)] p-4 font-mono text-sm font-medium text-[var(--signal)]"
          >
            ⚠ {error}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {domains.map((domain) => (
            <button
              key={domain}
              onClick={() => onSelectDomain(domain)}
              className="border-2 border-dashed border-[var(--ink)]/30 p-4 text-left transition hover:border-solid hover:border-[var(--blueprint)] hover:bg-[var(--blueprint-soft)]"
            >
              <p className="font-semibold text-[var(--ink)]">{domain}</p>
              <p className="font-mono mt-1 text-xs text-[var(--blueprint)]">
                VIEW OPTIONS →
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 border-t-2 border-dashed border-[var(--ink)]/25 pt-6">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--ink-soft)]">
            § 02 — Whole-branch assessment
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <button
              onClick={onMock}
              className="bp-corners border-2 border-[var(--blueprint)] bg-[var(--blueprint-soft)] p-5 text-left transition hover:shadow-[4px_4px_0_var(--blueprint)]"
            >
              <CornerMarks />
              <p className="font-display text-lg font-bold text-[var(--blueprint)]">
                🧠 Branch mock test
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
                Mixed questions from across all {branch.shortName} domains, with
                instant feedback and explanations.
              </p>
              <p className="font-mono mt-5 text-xs font-semibold text-[var(--blueprint)]">
                START MOCK TEST →
              </p>
            </button>

            <button
              onClick={onGraded}
              className="bp-corners border-2 border-[var(--signal)] bg-[var(--signal-soft)] p-5 text-left transition hover:shadow-[4px_4px_0_var(--signal)]"
            >
              <CornerMarks />
              <p className="font-display text-lg font-bold text-[var(--signal)]">
                📝 Online graded test
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
                Timed mixed assessment. Answers and explanations appear after the
                test.
              </p>
              <p className="font-mono mt-5 text-xs font-semibold text-[var(--signal)]">
                BEGIN GRADED TEST →
              </p>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Subject page — shown when a domain is tapped. Combines Practice Quiz and
// Domain Mock Test in one place, plus any study material for that topic.
// ---------------------------------------------------------------------------
function DomainScreen({ branch, domain, materials, loading, error, onPractice, onDomainMock, onBack }) {
  return (
    <main className="bp-grid font-body min-h-screen text-[var(--ink)]">
      <header className="border-b-2 border-[var(--ink)] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="font-mono flex items-center gap-2 border-2 border-[var(--ink)]/25 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--ink)] transition hover:border-[var(--ink)]"
            >
              ← Back
            </button>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--ink-soft)]">
                {branch.shortName} · Subject
              </p>
              <p className="font-display font-bold">{domain}</p>
            </div>
          </div>
          <TitleBlock sheet="DOMAIN" />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--blueprint)]">
          § {branch.shortName} — {domain}
        </p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-tight md:text-4xl">
          {domain}
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Choose how you want to test yourself on this subject.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 border-2 border-[var(--signal)] bg-[var(--signal-soft)] p-4 font-mono text-sm font-medium text-[var(--signal)]"
          >
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <div className="font-mono mt-6 border-2 border-dashed border-[var(--ink)]/30 p-5 text-center text-sm text-[var(--ink-soft)]">
            GENERATING QUESTIONS…
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <button
              onClick={onPractice}
              className="bp-corners border-2 border-[var(--blueprint)] bg-[var(--blueprint-soft)] p-6 text-left transition hover:shadow-[4px_4px_0_var(--blueprint)]"
            >
              <CornerMarks />
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--blueprint)]">
                10 questions · 45s each
              </p>
              <p className="font-display mt-2 text-xl font-bold text-[var(--blueprint)]">
                📘 Practice Quiz
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
                Untimed pressure, instant feedback after every question — best for
                first pass on a topic.
              </p>
              <p className="font-mono mt-5 text-xs font-semibold text-[var(--blueprint)]">
                START PRACTICE →
              </p>
            </button>

            <button
              onClick={onDomainMock}
              className="bp-corners border-2 border-[var(--signal)] bg-[var(--signal-soft)] p-6 text-left transition hover:shadow-[4px_4px_0_var(--signal)]"
            >
              <CornerMarks />
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--signal)]">
                10 questions · 60s each
              </p>
              <p className="font-display mt-2 text-xl font-bold text-[var(--signal)]">
                🧭 Domain Mock Test
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
                Longer per-question window, feedback shown after each answer — closer
                to exam pacing for this subject.
              </p>
              <p className="font-mono mt-5 text-xs font-semibold text-[var(--signal)]">
                START MOCK TEST →
              </p>
            </button>
          </div>
        )}

        {materials.length > 0 && (
          <div className="mt-8 border-t-2 border-dashed border-[var(--ink)]/25 pt-6">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--ink-soft)]">
              § Study resources
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {materials.map((material) => (
                <a
                  key={`${material.branch}-${material.topic}`}
                  href={material.url}
                  target="_blank"
                  rel="noreferrer"
                  className="border-2 border-[var(--ink)]/20 p-5 transition hover:border-[var(--ink)]"
                >
                  <p className="font-display font-bold text-[var(--ink)]">
                    {material.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{material.channel}</p>
                  <p className="font-mono mt-4 text-xs font-semibold text-[var(--ink)]">
                    WATCH ON YOUTUBE ↗
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function QuizScreen({
  question,
  currentIndex,
  totalQuestions,
  selectedOption,
  setSelectedOption,
  submitted,
  submitAnswer,
  nextQuestion,
  timeLeft,
  mode,
}) {
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const showFeedback = mode !== 'graded'
  const timeCritical = timeLeft <= 10

  return (
    <main className="bp-grid font-body min-h-screen px-5 py-8 text-[var(--ink)]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--blueprint)]">
              Question {currentIndex + 1} of {totalQuestions}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{question.domain}</p>
          </div>

          <div className="flex items-center gap-3">
            <TitleBlock sheet="QUIZ" />
            <div
              className={`font-mono flex items-center gap-2 border-2 px-4 py-2 text-sm font-bold ${timeCritical
                ? 'border-[var(--signal)] text-[var(--signal)]'
                : 'border-[var(--blueprint)] text-[var(--blueprint)]'
                }`}
            >
              <span className={timeCritical ? 'animate-pulse' : ''}>⏱</span>
              {String(timeLeft).padStart(2, '0')}s
            </div>
          </div>
        </div>

        <div className="relative h-2 border border-[var(--ink)]/30 bg-white">
          <div
            className="h-full bg-[var(--blueprint)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <section className="bp-corners mt-7 border-2 border-[var(--ink)] bg-white p-6 md:p-9">
          <CornerMarks />
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[var(--ink-soft)]">
            {question.difficulty} difficulty
          </p>
          <h1 className="font-display mt-3 text-2xl font-bold leading-tight md:text-3xl">
            {question.question}
          </h1>

          <div className="mt-7 space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedOption === index
              const isCorrect = index === question.correctAnswer

              let optionStyle =
                'border-[var(--ink)]/20 hover:border-[var(--blueprint)] hover:bg-[var(--blueprint-soft)]'

              if (submitted && showFeedback && isCorrect) {
                optionStyle = 'border-[var(--good)] bg-[var(--good-soft)]'
              } else if (submitted && showFeedback && isSelected && !isCorrect) {
                optionStyle = 'border-[var(--signal)] bg-[var(--signal-soft)]'
              } else if (submitted && !showFeedback && isSelected) {
                optionStyle = 'border-[var(--blueprint)] bg-[var(--blueprint-soft)]'
              } else if (!submitted && isSelected) {
                optionStyle = 'border-[var(--blueprint)] bg-[var(--blueprint-soft)]'
              }

              return (
                <button
                  key={index}
                  disabled={submitted}
                  onClick={() => setSelectedOption(index)}
                  className={`flex w-full items-center gap-4 border-2 p-4 text-left font-medium transition disabled:cursor-default ${optionStyle}`}
                >
                  <span className="font-mono grid h-8 w-8 shrink-0 place-items-center border-2 border-[var(--ink)]/25 text-sm font-bold text-[var(--ink)]">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </button>
              )
            })}
          </div>

          {submitted && showFeedback && (
            <div
              aria-live="polite"
              className={`mt-6 border-2 p-4 ${selectedOption === question.correctAnswer
                ? 'border-[var(--good)] bg-[var(--good-soft)] text-[var(--good)]'
                : 'border-[var(--signal)] bg-[var(--signal-soft)] text-[var(--signal)]'
                }`}
            >
              <p className="font-display font-bold">
                {selectedOption === question.correctAnswer
                  ? 'Correct! Well done.'
                  : 'Review this concept.'}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--ink)]">
                {question.explanation}
              </p>
            </div>
          )}

          <div className="mt-7 flex justify-end">
            {!submitted ? (
              <button
                onClick={submitAnswer}
                className="font-mono bg-[var(--ink)] px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--blueprint)]"
              >
                {selectedOption === null
                  ? 'Skip question'
                  : showFeedback
                    ? 'Check answer'
                    : 'Lock answer'}
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="font-mono bg-[var(--ink)] px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--blueprint)]"
              >
                {currentIndex === totalQuestions - 1 ? 'View results →' : 'Next question →'}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function ResultsScreen({
  questions,
  answers,
  quizInfo,
  tryAgain,
  returnToDashboard,
}) {
  const correctAnswers = answers.filter((answer) => answer.isCorrect).length
  const score = Math.round((correctAnswers / questions.length) * 100)

  let grade = 'F'
  if (score >= 85) grade = 'A'
  else if (score >= 70) grade = 'B'
  else if (score >= 55) grade = 'C'
  else if (score >= 40) grade = 'D'

  return (
    <main className="bp-grid font-body min-h-screen px-5 py-10 text-[var(--ink)]">
      <div className="mx-auto max-w-3xl">
        <section className="bp-corners border-2 border-[var(--ink)] bg-white p-7 text-center md:p-10">
          <CornerMarks />
          <div className="flex justify-center sm:justify-end">
            <TitleBlock sheet="RESULTS" />
          </div>
          <p className="font-mono mt-4 text-xs uppercase tracking-[0.25em] text-[var(--blueprint)]">
            Quiz complete
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold md:text-4xl">
            {quizInfo.branchShortName} · {quizInfo.domainLabel}
          </h1>

          <div className="mx-auto mt-7 grid h-32 w-32 place-items-center border-2 border-[var(--blueprint)]">
            <div>
              <p className="font-display text-4xl font-bold text-[var(--blueprint)]">
                {score}%
              </p>
              <p className="font-mono text-xs font-semibold text-[var(--ink-soft)]">
                GRADE {grade}
              </p>
            </div>
          </div>

          <p className="mt-6 text-[var(--ink-soft)]">
            You answered <strong className="text-[var(--ink)]">{correctAnswers}</strong>{' '}
            of <strong className="text-[var(--ink)]">{questions.length}</strong>{' '}
            questions correctly.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={tryAgain}
              className="font-mono bg-[var(--ink)] px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--blueprint)]"
            >
              Try again
            </button>
            <button
              onClick={returnToDashboard}
              className="font-mono border-2 border-[var(--ink)]/25 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-[var(--ink)] transition hover:border-[var(--ink)]"
            >
              Back to dashboard
            </button>
          </div>
        </section>

        <section className="mt-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--ink-soft)]">
            § Answer review
          </p>
          <h2 className="font-display mt-1 text-2xl font-bold">Line by line</h2>

          <div className="mt-4 space-y-4">
            {questions.map((question, index) => {
              const answer = answers.find(
                (item) => item.questionId === question.id,
              )
              const isCorrect = answer?.isCorrect

              return (
                <article
                  key={question.id}
                  className={`border-2 border-l-[6px] bg-white p-5 ${isCorrect ? 'border-[var(--good)]' : 'border-[var(--signal)]'
                    }`}
                >
                  <p className="font-semibold">
                    <span className="font-mono text-[var(--ink-soft)]">
                      {String(index + 1).padStart(2, '0')}.
                    </span>{' '}
                    {question.question}
                  </p>
                  <p className="mt-3 text-sm text-[var(--ink-soft)]">
                    Your answer:{' '}
                    <strong className="text-[var(--ink)]">
                      {answer?.selectedOption === null || answer?.selectedOption === undefined
                        ? 'Not answered'
                        : question.options[answer.selectedOption]}
                    </strong>
                  </p>
                  {!isCorrect && (
                    <p className="mt-1 text-sm text-[var(--good)]">
                      Correct answer:{' '}
                      <strong>{question.options[question.correctAnswer]}</strong>
                    </p>
                  )}
                  <p className="font-mono mt-3 border border-dashed border-[var(--ink)]/20 p-3 text-sm text-[var(--ink-soft)]">
                    {question.explanation}
                  </p>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({ value, label }) {
  return (
    <div className="border border-white/25 bg-white/5 p-4">
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="font-mono mt-1 text-[10px] uppercase tracking-widest text-[#9FB3D6]">
        {label}
      </p>
    </div>
  )
}

export default App
