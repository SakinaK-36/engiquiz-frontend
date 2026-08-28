import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
} from 'firebase/firestore'
import { auth, db } from '../firebase'

function attemptsCollection() {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('No authenticated user.')
  return collection(db, 'users', uid, 'attempts')
}

async function getAttempts() {
  const snapshot = await getDocs(attemptsCollection())
  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        branchId: data.branchId,
        branchName: data.branchName,
        domain: data.domain,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.correctAnswers,
        score: data.score,
        completedAt: data.completedAt,
      }
    })
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
}

export async function saveQuizAttempt({
  branchId,
  branchName,
  domain,
  totalQuestions,
  answers,
}) {
  const correctAnswers = answers.filter((answer) => answer.isCorrect).length
  const score = Math.round((correctAnswers / totalQuestions) * 100)

  const attempt = {
    branchId,
    branchName,
    domain,
    totalQuestions,
    correctAnswers,
    score,
    completedAt: new Date().toISOString(),
  }

  const docRef = await addDoc(attemptsCollection(), attempt)

  return { id: docRef.id, ...attempt }
}

export async function getDashboardStats() {
  const attempts = await getAttempts()

  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      accuracy: 0,
      bestDomain: '—',
      recent: [],
    }
  }

  const totalQuestions = attempts.reduce(
    (total, attempt) => total + attempt.totalQuestions,
    0,
  )

  const correctAnswers = attempts.reduce(
    (total, attempt) => total + attempt.correctAnswers,
    0,
  )

  const averageScore = Math.round(
    attempts.reduce((total, attempt) => total + attempt.score, 0) /
      attempts.length,
  )

  const domainScores = {}

  attempts.forEach((attempt) => {
    if (!domainScores[attempt.domain]) {
      domainScores[attempt.domain] = []
    }

    domainScores[attempt.domain].push(attempt.score)
  })

  const bestDomain = Object.entries(domainScores)
    .map(([domain, scores]) => ({
      domain,
      average: scores.reduce((total, score) => total + score, 0) / scores.length,
    }))
    .sort((a, b) => b.average - a.average)[0].domain

  return {
    totalAttempts: attempts.length,
    averageScore,
    accuracy: Math.round((correctAnswers / totalQuestions) * 100),
    bestDomain,
    recent: attempts.slice(0, 4),
  }
}

export async function clearProgress() {
  const attempts = await getAttempts()
  const uid = auth.currentUser?.uid
  if (!uid) return

  await Promise.all(
    attempts.map((attempt) =>
      deleteDoc(doc(db, 'users', uid, 'attempts', attempt.id)),
    ),
  )
}