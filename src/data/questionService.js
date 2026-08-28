// ---------------------------------------------------------------------------
// Question service — calls YOUR backend, which proxies to the Gemini API.
// The browser never sees an API key and never talks to Google's API
// directly. Set VITE_API_URL (or your bundler's equivalent) to your server's
// base URL, e.g. http://localhost:3001 in dev, https://api.yourapp.com in prod.
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const DOMAINS_BY_BRANCH = {
  cse: ['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks'],
  ece: ['Digital Electronics', 'Signals & Systems', 'Communication Systems', 'Microprocessors'],
  ee: ['Circuit Theory', 'Power Systems', 'Control Systems', 'Electrical Machines'],
  agri: ['Irrigation Engineering', 'Farm Machinery', 'Soil Science', 'Agricultural Processing'],
  civil: ['Structural Analysis', 'Geotechnical Engineering', 'Fluid Mechanics', 'Surveying'],
  mech: ['Thermodynamics', 'Fluid Mechanics', 'Manufacturing Processes', 'Machine Design'],
}

export function getDomainsByBranch(branch) {
  return DOMAINS_BY_BRANCH[branch] || []
}

export async function getQuestions({ branch, domain, limit = 10 }) {
  let response
  try {
    response = await fetch(`${API_BASE}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch, domain: domain || null, limit }),
    })
  } catch {
    throw new Error('Could not reach the quiz server. Check your connection and try again.')
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('Received an unexpected response from the server.')
  }

  if (!response.ok) {
    throw new Error(data.error || 'Unable to load questions right now. Please try again.')
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('No questions were returned. Please try again.')
  }

  return data.questions
}
