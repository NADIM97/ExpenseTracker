import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Home, List, Plus, PieChart as PieChartIcon, ArrowRightLeft, Download,
  Sun, Moon, User, X, Check, ArrowLeft, ChevronLeft, ChevronRight,
  Calendar, Edit3, TrendingUp, TrendingDown, Trash2, Users
} from "lucide-react";

const CATEGORIES = [
  { name: "Food", color: "#E8795A", emoji: "🍽️" },
  { name: "Groceries", color: "#B7A83F", emoji: "🛒" },
  { name: "Fuel", color: "#D9534F", emoji: "⛽" },
  { name: "Transport", color: "#3FA6A6", emoji: "🚕" },
  { name: "Rent", color: "#8C7AE6", emoji: "🏠" },
  { name: "EMI/Loan", color: "#A15C5C", emoji: "🏦" },
  { name: "Utilities", color: "#6FCF97", emoji: "💡" },
  { name: "Mobile/Net", color: "#4C8DFF", emoji: "📶" },
  { name: "Shopping", color: "#E29587", emoji: "🛍️" },
  { name: "Health", color: "#5B9BD5", emoji: "💊" },
  { name: "Education", color: "#9B8AE6", emoji: "📚" },
  { name: "Travel", color: "#3FBF9F", emoji: "✈️" },
  { name: "Entertainment", color: "#D4A72C", emoji: "🎬" },
  { name: "Investment", color: "#3FBF6E", emoji: "📈" },
  { name: "Insurance", color: "#5B7FBF", emoji: "🛡️" },
  { name: "Other", color: "#9A9AAE", emoji: "📦" },
];

const CURRENCY = "₹";
const ACCOUNTS = [
  { name: "Cash", emoji: "💵", color: "#3ECF8E" },
  { name: "Online", emoji: "💳", color: "#4C8DFF" },
];

const AUTH_USERS_KEY = "spendwise:auth-registry";
const SESSION_KEY = "spendwise:active-session";
const THEME_KEY = "spendwise:darkmode";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
function monthKey(d) {
  return d.slice(0, 7);
}
function shiftMonth(ym, delta) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
function dayLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).toUpperCase();
}
function fmt(n) {
  const sign = n < 0 ? "−" : "";
  return `${sign}${CURRENCY}${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function App() {
  // --- AUTH ---
  const [usersRegistry, setUsersRegistry] = useState(() => {
    try { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || {}; } catch (e) { return {}; }
  });
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem(SESSION_KEY) || null);
  const [authMode, setAuthMode] = useState("login");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // --- GLOBAL UI ---
  const [darkMode, setDarkMode] = useState(true);
  const [screen, setScreen] = useState("home"); // home | ledger | add | budget | credit
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [peopleInput, setPeopleInput] = useState("");
  const [confetti, setConfetti] = useState([]);

  // --- CORE DATA ---
  const [entries, setEntries] = useState([]); // expenses
  const [income, setIncome] = useState([]);   // money received
  const [credits, setCredits] = useState([]); // lending/borrowing
  const [subProfiles, setSubProfiles] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // --- ADD EXPENSE FLOW ---
  const [addAmount, setAddAmount] = useState("0");
  const [addAccount, setAddAccount] = useState("Online");
  const [addCategory, setAddCategory] = useState(null);
  const [addDateChoice, setAddDateChoice] = useState("today"); // today | yesterday | custom
  const [addCustomDate, setAddCustomDate] = useState(todayStr());
  const [addFor, setAddFor] = useState("Self");

  // --- LEDGER ---
  const [ledgerFilter, setLedgerFilter] = useState("All"); // All | Cash | Online
  const [ledgerView, setLedgerView] = useState("Month"); // Day | Month
  const [ledgerMonth, setLedgerMonth] = useState(monthKey(todayStr()));
  const [ledgerDay, setLedgerDay] = useState(todayStr());

  // --- BUDGET ---
  const [budgetMonth, setBudgetMonth] = useState(monthKey(todayStr()));
  const [moneyModalAccount, setMoneyModalAccount] = useState(null);
  const [moneyAmount, setMoneyAmount] = useState("");
  const [moneyLabel, setMoneyLabel] = useState("");
  const [editAccountModal, setEditAccountModal] = useState(null);
  const [editAccountGoal, setEditAccountGoal] = useState("");
  const [accountGoals, setAccountGoals] = useState({ Cash: 0, Online: 0 });

  // --- CREDIT (LENDING) ---
  const [creditTab, setCreditTab] = useState("lent"); // lent | borrowed
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditPerson, setCreditPerson] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNote, setCreditNote] = useState("");

  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_KEY);
      if (t) setDarkMode(JSON.parse(t));
    } catch (e) {}
  }, []);

  useEffect(() => {
    setScreen("home");
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    setLoaded(false);
    const p = `user:${currentUser}:`;
    try {
      const raw = JSON.parse(localStorage.getItem(p + "entries")) || [];
      const clean = raw.map((e) => ({ ...e, account: e.account || "Online", category: e.category || "Other" }));
      setEntries(clean);
    } catch (e) { setEntries([]); }
    try { setIncome(JSON.parse(localStorage.getItem(p + "income")) || []); } catch (e) { setIncome([]); }
    try { setCredits(JSON.parse(localStorage.getItem(p + "credits")) || []); } catch (e) { setCredits([]); }
    try { setSubProfiles(JSON.parse(localStorage.getItem(p + "subprofiles")) || []); } catch (e) { setSubProfiles([]); }
    try { setAccountGoals(JSON.parse(localStorage.getItem(p + "goals")) || { Cash: 0, Online: 0 }); } catch (e) { setAccountGoals({ Cash: 0, Online: 0 }); }
    setLoaded(true);
  }, [currentUser]);

  const theme = darkMode ? {
    bg: "#0E0E16", card: "#181822", cardAlt: "#20202C", border: "#2A2A38",
    text: "#F2F2F7", textMuted: "#8B8B9E", inputBg: "#1C1C28",
    accent: "#6C5CE7", green: "#3ECF8E", blue: "#4C8DFF", red: "#F2685C",
  } : {
    bg: "#F3F3F8", card: "#FFFFFF", cardAlt: "#F0EFF7", border: "#E2E1EC",
    text: "#22222E", textMuted: "#6E6E80", inputBg: "#FAFAFD",
    accent: "#6C5CE7", green: "#1FA976", blue: "#3B72D9", red: "#D9463B",
  };

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    try { localStorage.setItem(THEME_KEY, JSON.stringify(next)); } catch (e) {}
  }

  function triggerConfetti() {
    const particles = [];
    const colors = [theme.accent, theme.green, theme.blue];
    for (let i = 0; i < 24; i++) {
      particles.push({ id: Math.random(), x: Math.random() * 100, color: colors[Math.floor(Math.random() * colors.length)], delay: Math.random() * 0.25, duration: 1 + Math.random() * 1, size: 5 + Math.random() * 5 });
    }
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 1800);
  }

  // --- PERSISTENCE HELPERS ---
  function persistEntries(next) { setEntries(next); if (currentUser) localStorage.setItem(`user:${currentUser}:entries`, JSON.stringify(next)); }
  function persistIncome(next) { setIncome(next); if (currentUser) localStorage.setItem(`user:${currentUser}:income`, JSON.stringify(next)); }
  function persistCredits(next) { setCredits(next); if (currentUser) localStorage.setItem(`user:${currentUser}:credits`, JSON.stringify(next)); }
  function persistSubProfiles(next) { setSubProfiles(next); if (currentUser) localStorage.setItem(`user:${currentUser}:subprofiles`, JSON.stringify(next)); }
  function persistGoals(next) { setAccountGoals(next); if (currentUser) localStorage.setItem(`user:${currentUser}:goals`, JSON.stringify(next)); }

  // --- AUTH HANDLERS ---
  function handleAuth(e) {
    e.preventDefault();
    setAuthError("");
    const u = usernameInput.trim().toLowerCase();
    if (!u || !passwordInput) { setAuthError("Please fill out all fields."); return; }
    if (authMode === "register") {
      if (usersRegistry[u]) { setAuthError("This User ID already exists."); return; }
      const next = { ...usersRegistry, [u]: passwordInput };
      setUsersRegistry(next);
      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(next));
      localStorage.setItem(SESSION_KEY, u);
      setCurrentUser(u);
      setUsernameInput(""); setPasswordInput("");
    } else {
      if (usersRegistry[u] && usersRegistry[u] === passwordInput) {
        localStorage.setItem(SESSION_KEY, u);
        setCurrentUser(u);
        setUsernameInput(""); setPasswordInput("");
      } else {
        setAuthError("Invalid User ID or Password.");
      }
    }
  }
  function handleSignOut() {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setEntries([]); setIncome([]); setCredits([]); setSubProfiles([]);
    setShowProfileMenu(false);
  }

  // --- ADD EXPENSE ---
  function pressDigit(d) {
    setAddAmount((prev) => {
      if (prev === "0") return d;
      if (prev.length >= 10) return prev;
      return prev + d;
    });
  }
  function pressDot() {
    setAddAmount((prev) => (prev.includes(".") ? prev : prev + "."));
  }
  function pressBackspace() {
    setAddAmount((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
  }
  const resolvedAddDate = addDateChoice === "today" ? todayStr() : addDateChoice === "yesterday" ? yesterdayStr() : addCustomDate;
  function submitExpense() {
    const v = parseFloat(addAmount);
    if (!v || v <= 0 || !addCategory) return;
    const entry = { id: uid(), amount: v, category: addCategory, account: addAccount, date: resolvedAddDate, spendFor: addFor };
    persistEntries([entry, ...entries]);
    triggerConfetti();
    setAddAmount("0"); setAddCategory(null); setAddDateChoice("today"); setAddFor("Self");
    setScreen("home");
  }

  // --- ADD MONEY (per account) ---
  function submitAddMoney() {
    const v = parseFloat(moneyAmount);
    if (!v || v <= 0 || !moneyModalAccount) return;
    const entry = { id: uid(), amount: v, account: moneyModalAccount, label: moneyLabel.trim() || "Money added", date: todayStr(), addedFor: "Self" };
    persistIncome([entry, ...income]);
    setMoneyAmount(""); setMoneyLabel(""); setMoneyModalAccount(null);
    triggerConfetti();
  }
  function submitAccountGoal() {
    const v = parseFloat(editAccountGoal);
    if (isNaN(v) || v < 0 || !editAccountModal) return;
    persistGoals({ ...accountGoals, [editAccountModal]: v });
    setEditAccountModal(null); setEditAccountGoal("");
  }

  // --- CREDIT (LENDING) ---
  function submitCredit() {
    const v = parseFloat(creditAmount);
    if (!v || v <= 0 || !creditPerson.trim()) return;
    const rec = { id: uid(), person: creditPerson.trim(), amount: v, note: creditNote.trim(), type: creditTab, date: todayStr(), settled: false };
    persistCredits([rec, ...credits]);
    setCreditPerson(""); setCreditAmount(""); setCreditNote(""); setShowCreditModal(false);
  }
  function toggleSettled(id) {
    persistCredits(credits.map((c) => (c.id === id ? { ...c, settled: !c.settled } : c)));
  }
  function removeCredit(id) {
    persistCredits(credits.filter((c) => c.id !== id));
  }

  // --- SUB PROFILES ---
  function addPerson() {
    const name = peopleInput.trim();
    if (!name || subProfiles.includes(name) || name.toLowerCase() === "self") return;
    persistSubProfiles([...subProfiles, name]);
    setPeopleInput("");
  }
  function removePerson(name) {
    persistSubProfiles(subProfiles.filter((p) => p !== name));
  }

  // --- EXPORT ---
  function exportToCSV(list) {
    let csv = "data:text/csv;charset=utf-8,Date,Category,Account,Spent For,Amount\n";
    list.forEach((e) => { csv += `${e.date},${e.category},${e.account},${e.spendFor || "Self"},${e.amount}\n`; });
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `${currentUser}_SpendWise_${todayStr()}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }
  function exportToPDF(list, total) {
    const w = window.open("", "_blank", "width=800,height=600");
    const rows = list.map((e) => `<tr><td style="padding:8px;font-size:12px;">${e.date}</td><td style="padding:8px;font-size:12px;">${e.category}</td><td style="padding:8px;font-size:12px;">${e.account}</td><td style="padding:8px;font-size:12px;text-align:right;font-weight:bold;">${CURRENCY}${e.amount.toFixed(2)}</td></tr>`).join("");
    w.document.write(`<html><head><title>SpendWise Statement</title><style>body{font-family:Inter,sans-serif;padding:32px;color:#222} table{width:100%;border-collapse:collapse} th{text-align:left;padding:8px;font-size:11px;text-transform:uppercase;color:#777;border-bottom:2px solid #222}</style></head><body><h2>SpendWise Statement</h2><p>Total: <strong>${CURRENCY}${total.toFixed(2)}</strong> — Generated ${todayStr()}</p><table><thead><tr><th>Date</th><th>Category</th><th>Account</th><th style="text-align:right;">Amount</th></tr></thead><tbody>${rows || '<tr><td colspan="4" style="text-align:center;padding:20px;">No records</td></tr>'}</tbody></table><script>window.onload=function(){window.print();setTimeout(()=>window.close(),400);}</script></body></html>`);
    w.document.close();
  }

  const catInfo = (name) => CATEGORIES.find((c) => c.name === name) || CATEGORIES[CATEGORIES.length - 1];
  const acctInfo = (name) => ACCOUNTS.find((a) => a.name === name) || ACCOUNTS[0];

  // --- DERIVED: HOME ---
  const today = todayStr();
  const todayEntries = useMemo(() => entries.filter((e) => e.date === today), [entries, today]);
  const todayTotal = useMemo(() => todayEntries.reduce((s, e) => s + e.amount, 0), [todayEntries]);
  const todayCash = useMemo(() => todayEntries.filter((e) => e.account === "Cash").reduce((s, e) => s + e.amount, 0), [todayEntries]);
  const todayOnline = useMemo(() => todayEntries.filter((e) => e.account === "Online").reduce((s, e) => s + e.amount, 0), [todayEntries]);

  const homeMonth = monthKey(today);
  const homeMonthEntries = useMemo(() => entries.filter((e) => monthKey(e.date) === homeMonth), [entries, homeMonth]);
  const homeMonthTotal = useMemo(() => homeMonthEntries.reduce((s, e) => s + e.amount, 0), [homeMonthEntries]);
  const homeCatTotals = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => (map[c.name] = 0));
    homeMonthEntries.forEach((e) => (map[e.category] = (map[e.category] || 0) + e.amount));
    return map;
  }, [homeMonthEntries]);
  const homePieData = useMemo(() => CATEGORIES.map((c) => ({ name: c.name, value: homeCatTotals[c.name], color: c.color })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value), [homeCatTotals]);
  const recentEntries = useMemo(() => [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1))).slice(0, 5), [entries]);

  // --- DERIVED: LEDGER ---
  const ledgerBase = useMemo(() => {
    let list = entries;
    if (ledgerFilter !== "All") list = list.filter((e) => e.account === ledgerFilter);
    if (ledgerView === "Month") list = list.filter((e) => monthKey(e.date) === ledgerMonth);
    else list = list.filter((e) => e.date === ledgerDay);
    return list;
  }, [entries, ledgerFilter, ledgerView, ledgerMonth, ledgerDay]);
  const ledgerSorted = useMemo(() => [...ledgerBase].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1))), [ledgerBase]);
  const ledgerGroups = useMemo(() => {
    const groups = {};
    ledgerSorted.forEach((e) => { (groups[e.date] = groups[e.date] || []).push(e); });
    return Object.entries(groups);
  }, [ledgerSorted]);
  const ledgerTotal = useMemo(() => ledgerBase.reduce((s, e) => s + e.amount, 0), [ledgerBase]);
  const ledgerCash = useMemo(() => ledgerBase.filter((e) => e.account === "Cash").reduce((s, e) => s + e.amount, 0), [ledgerBase]);
  const ledgerOnline = useMemo(() => ledgerBase.filter((e) => e.account === "Online").reduce((s, e) => s + e.amount, 0), [ledgerBase]);

  // --- DERIVED: BUDGET ---
  const budgetExpenses = useMemo(() => entries.filter((e) => monthKey(e.date) === budgetMonth), [entries, budgetMonth]);
  const budgetIncome = useMemo(() => income.filter((i) => monthKey(i.date) === budgetMonth), [income, budgetMonth]);
  const monthReceived = useMemo(() => budgetIncome.reduce((s, i) => s + i.amount, 0), [budgetIncome]);
  const monthSpent = useMemo(() => budgetExpenses.reduce((s, e) => s + e.amount, 0), [budgetExpenses]);
  const monthBalance = monthReceived - monthSpent;
  function accountStats(account) {
    const received = budgetIncome.filter((i) => i.account === account).reduce((s, i) => s + i.amount, 0);
    const spent = budgetExpenses.filter((e) => e.account === account).reduce((s, e) => s + e.amount, 0);
    return { received, spent, balance: received - spent, progress: received > 0 ? Math.min(100, (spent / received) * 100) : (spent > 0 ? 100 : 0) };
  }

  // --- DERIVED: CREDIT ---
  const toGet = useMemo(() => credits.filter((c) => c.type === "lent" && !c.settled).reduce((s, c) => s + c.amount, 0), [credits]);
  const toPay = useMemo(() => credits.filter((c) => c.type === "borrowed" && !c.settled).reduce((s, c) => s + c.amount, 0), [credits]);
  const creditList = useMemo(() => credits.filter((c) => c.type === creditTab).sort((a, b) => (a.date < b.date ? 1 : -1)), [credits, creditTab]);

  // ============================= AUTH SCREEN =============================
  if (!currentUser) {
    return (
      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: theme.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, color: theme.text }}>
        <div style={{ width: "100%", maxWidth: 380, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 20, padding: "32px 24px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 20, fontWeight: 800, color: "#fff" }}>S</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>SpendWise</h2>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Track every rupee, together.</p>
          </div>
          {authError && <div style={{ background: `${theme.red}22`, border: `1px solid ${theme.red}`, color: theme.red, padding: "10px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, marginBottom: 16, textAlign: "center" }}>{authError}</div>}
          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: theme.textMuted, marginBottom: 5, textTransform: "uppercase" }}>User ID</label>
              <input type="text" required value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="Enter your ID" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: theme.textMuted, marginBottom: 5, textTransform: "uppercase" }}>Password</label>
              <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <button type="submit" style={{ background: theme.accent, color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>
              {authMode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
          <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: theme.textMuted, borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
            {authMode === "login" ? (
              <p style={{ margin: 0 }}>New here? <button onClick={() => { setAuthMode("register"); setAuthError(""); }} style={{ background: "none", border: "none", color: theme.accent, fontWeight: 700, cursor: "pointer", padding: 0 }}>Create an account</button></p>
            ) : (
              <p style={{ margin: 0 }}>Already registered? <button onClick={() => { setAuthMode("login"); setAuthError(""); }} style={{ background: "none", border: "none", color: theme.accent, fontWeight: 700, cursor: "pointer", padding: 0 }}>Log in</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================= SHARED PIECES =============================
  const NAV_ITEMS = [
    { key: "home", label: "Home", icon: Home },
    { key: "ledger", label: "Ledger", icon: List },
    { key: "add", label: "Add", icon: Plus, isCenter: true },
    { key: "budget", label: "Budget", icon: PieChartIcon },
    { key: "credit", label: "Credit", icon: ArrowRightLeft },
  ];

  function TopBar({ children }) {
    return (
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: theme.bg, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>S</div>
            <span style={{ fontSize: 16, fontWeight: 800 }}>SpendWise</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowExportMenu((s) => !s)} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", display: "flex" }}><Download size={18} /></button>
              {showExportMenu && (
                <>
                  <div onClick={() => setShowExportMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", zIndex: 70, overflow: "hidden", minWidth: 140 }}>
                    <button onClick={() => { exportToPDF(ledgerSorted.length ? ledgerSorted : entries, ledgerSorted.length ? ledgerTotal : homeMonthTotal); setShowExportMenu(false); }} style={{ width: "100%", padding: "10px 14px", border: "none", background: "none", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.text, cursor: "pointer" }}>📕 Export PDF</button>
                    <button onClick={() => { exportToCSV(ledgerSorted.length ? ledgerSorted : entries); setShowExportMenu(false); }} style={{ width: "100%", padding: "10px 14px", border: "none", borderTop: `1px solid ${theme.border}`, background: "none", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.text, cursor: "pointer" }}>📄 Export CSV</button>
                  </div>
                </>
              )}
            </div>
            <button onClick={toggleTheme} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", display: "flex" }}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowProfileMenu((s) => !s)} style={{ width: 32, height: 32, borderRadius: "50%", background: theme.cardAlt, border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: theme.accent, cursor: "pointer" }}>
                <User size={16} />
              </button>
              {showProfileMenu && (
                <>
                  <div onClick={() => setShowProfileMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", zIndex: 70, overflow: "hidden", minWidth: 170 }}>
                    <div style={{ padding: "10px 14px", fontSize: 11, color: theme.textMuted, borderBottom: `1px solid ${theme.border}` }}>Signed in as <strong style={{ color: theme.text }}>{currentUser}</strong></div>
                    <button onClick={() => { setShowPeopleModal(true); setShowProfileMenu(false); }} style={{ width: "100%", padding: "10px 14px", border: "none", background: "none", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Users size={13} /> Manage People</button>
                    <button onClick={handleSignOut} style={{ width: "100%", padding: "10px 14px", border: "none", borderTop: `1px solid ${theme.border}`, background: "none", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.red, cursor: "pointer" }}>Sign Out</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  function BottomNav() {
    return (
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: theme.card, borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 8px calc(10px + env(safe-area-inset-bottom))", zIndex: 80 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = screen === item.key;
          if (item.isCenter) {
            return (
              <button key={item.key} onClick={() => setScreen("add")} style={{ background: theme.accent, border: "none", width: 50, height: 50, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer", boxShadow: `0 6px 16px ${theme.accent}55`, marginTop: -22 }}>
                <Icon size={22} />
              </button>
            );
          }
          return (
            <button key={item.key} onClick={() => setScreen(item.key)} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: active ? theme.accent : theme.textMuted, position: "relative" }}>
              <Icon size={19} />
              <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
              {active && <span style={{ position: "absolute", top: -8, width: 4, height: 4, borderRadius: "50%", background: theme.accent }} />}
            </button>
          );
        })}
      </div>
    );
  }

  function PeopleModal() {
    if (!showPeopleModal) return null;
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
        <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: theme.card, borderRadius: "20px 20px 0 0", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Manage People</h3>
            <button onClick={() => setShowPeopleModal(false)} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer" }}><X size={18} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: theme.cardAlt, borderRadius: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>👤 Self</span>
              <span style={{ fontSize: 11, color: theme.textMuted }}>Default</span>
            </div>
            {subProfiles.map((p) => (
              <div key={p} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: theme.cardAlt, borderRadius: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>👥 {p}</span>
                <button onClick={() => removePerson(p)} style={{ background: "none", border: "none", color: theme.red, cursor: "pointer", display: "flex" }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" value={peopleInput} onChange={(e) => setPeopleInput(e.target.value)} placeholder="Add a person's name" style={{ flex: 1, padding: "11px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 13, boxSizing: "border-box" }} />
            <button onClick={addPerson} disabled={!peopleInput.trim()} style={{ padding: "0 18px", borderRadius: 10, border: "none", background: peopleInput.trim() ? theme.accent : theme.cardAlt, color: peopleInput.trim() ? "#fff" : theme.textMuted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add</button>
          </div>
        </div>
      </div>
    );
  }

  function MonthNav({ value, onChange }) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${theme.border}` }}>
        <button onClick={() => onChange(shiftMonth(value, -1))} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", display: "flex" }}><ChevronLeft size={18} /></button>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{monthLabel(value)}</span>
        <button onClick={() => onChange(shiftMonth(value, 1))} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", display: "flex" }}><ChevronRight size={18} /></button>
      </div>
    );
  }

  const rootStyle = { fontFamily: "'Inter', system-ui, sans-serif", background: theme.bg, minHeight: "100vh", color: theme.text, position: "relative" };

  // ============================= HOME SCREEN =============================
  if (screen === "home") {
    return (
      <div style={rootStyle}>
        {confetti.map((p) => <div key={p.id} style={{ position: "fixed", top: -20, left: `${p.x}%`, width: p.size, height: p.size, background: p.color, borderRadius: "50%", zIndex: 9999, animation: `fall ${p.duration}s linear forwards`, animationDelay: `${p.delay}s` }} />)}
        <style>{`@keyframes fall{0%{transform:translateY(0)}100%{transform:translateY(105vh)}}`}</style>
        <TopBar />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 90px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", marginBottom: 10, letterSpacing: 0.5 }}>Today's Spend</div>
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "18px 18px" }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>{fmt(todayTotal)}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <div style={{ flex: 1, background: theme.cardAlt, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${theme.green}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>💵</div>
                <div><div style={{ fontSize: 11, color: theme.textMuted }}>Cash</div><div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(todayCash)}</div></div>
              </div>
              <div style={{ flex: 1, background: theme.cardAlt, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${theme.blue}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>💳</div>
                <div><div style={{ fontSize: 11, color: theme.textMuted }}>Online</div><div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(todayOnline)}</div></div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", margin: "20px 0 10px", letterSpacing: 0.5 }}>This Month</div>
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 16 }}>
            {homePieData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: theme.textMuted, fontSize: 13 }}>No expenses logged yet this month.</div>
            ) : (
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie data={homePieData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={52} paddingAngle={2}>
                      {homePieData.map((d, i) => <Cell key={i} fill={d.color} stroke={theme.card} strokeWidth={2} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${theme.border}`, paddingBottom: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>Total</span>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{fmt(homeMonthTotal)}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {homePieData.slice(0, 4).map((d) => (
                      <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.textMuted }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: d.color, display: "inline-block" }} />{d.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{fmt(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 10px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Recent</span>
            <button onClick={() => setScreen("ledger")} style={{ background: "none", border: "none", color: theme.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>See all →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentEntries.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: theme.textMuted, fontSize: 13, background: theme.card, border: `1px dashed ${theme.border}`, borderRadius: 12 }}>No transactions yet.</div>}
            {recentEntries.map((e) => {
              const c = catInfo(e.category);
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${c.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{c.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{e.category}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>{e.date} · <span style={{ color: e.account === "Cash" ? theme.green : theme.blue, fontWeight: 700 }}>{(e.account || "Online").toUpperCase()}</span></div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(e.amount)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <BottomNav />
        <PeopleModal />
      </div>
    );
  }

  // ============================= LEDGER SCREEN =============================
  if (screen === "ledger") {
    return (
      <div style={rootStyle}>
        <TopBar>
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ display: "flex", background: theme.cardAlt, borderRadius: 20, padding: 3, flex: 1 }}>
                {["All", "Cash", "Online"].map((f) => (
                  <button key={f} onClick={() => setLedgerFilter(f)} style={{ flex: 1, padding: "6px 0", borderRadius: 18, border: "none", fontSize: 12, fontWeight: 700, background: ledgerFilter === f ? theme.card : "transparent", color: ledgerFilter === f ? theme.text : theme.textMuted, cursor: "pointer" }}>{f}</button>
                ))}
              </div>
              <div style={{ display: "flex", background: theme.cardAlt, borderRadius: 20, padding: 3 }}>
                {["Day", "Month"].map((v) => (
                  <button key={v} onClick={() => setLedgerView(v)} style={{ padding: "6px 14px", borderRadius: 18, border: "none", fontSize: 12, fontWeight: 700, background: ledgerView === v ? theme.accent : "transparent", color: ledgerView === v ? "#fff" : theme.textMuted, cursor: "pointer" }}>{v}</button>
                ))}
              </div>
            </div>
            {ledgerView === "Month" ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: theme.cardAlt, borderRadius: 20, padding: "8px 14px" }}>
                <button onClick={() => setLedgerMonth(shiftMonth(ledgerMonth, -1))} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", display: "flex" }}><ChevronLeft size={16} /></button>
                <span style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><Calendar size={13} /> {monthLabel(ledgerMonth)}</span>
                <button onClick={() => setLedgerMonth(shiftMonth(ledgerMonth, 1))} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", display: "flex" }}><ChevronRight size={16} /></button>
              </div>
            ) : (
              <input type="date" value={ledgerDay} onChange={(e) => setLedgerDay(e.target.value)} style={{ width: "100%", padding: "8px 14px", borderRadius: 20, border: "none", background: theme.cardAlt, color: theme.text, fontSize: 13, fontWeight: 700, boxSizing: "border-box" }} />
            )}
          </div>
        </TopBar>

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "12px 16px 90px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, fontSize: 12, color: theme.textMuted }}>
            <span>{ledgerBase.length} txns · <span style={{ color: theme.green, fontWeight: 700 }}>Cash {fmt(ledgerCash)}</span> · <span style={{ color: theme.blue, fontWeight: 700 }}>Online {fmt(ledgerOnline)}</span></span>
            <span style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>{fmt(ledgerTotal)}</span>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button onClick={() => exportToPDF(ledgerSorted, ledgerTotal)} style={{ flex: 1, padding: "10px 0", borderRadius: 20, border: `1px solid ${theme.red}55`, background: `${theme.red}18`, color: theme.red, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📄 PDF</button>
            <button onClick={() => exportToCSV(ledgerSorted)} style={{ flex: 1, padding: "10px 0", borderRadius: 20, border: `1px solid ${theme.green}55`, background: `${theme.green}18`, color: theme.green, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📊 CSV</button>
          </div>

          {ledgerGroups.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: theme.textMuted, fontSize: 13, background: theme.card, border: `1px dashed ${theme.border}`, borderRadius: 12 }}>No transactions found.</div>}

          {ledgerGroups.map(([date, list]) => {
            const dayTotal = list.reduce((s, e) => s + e.amount, 0);
            return (
              <div key={date} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, letterSpacing: 0.4 }}>{dayLabel(date)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted }}>{fmt(dayTotal)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {list.map((e) => {
                    const c = catInfo(e.category);
                    return (
                      <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${c.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{c.emoji}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{e.category}{e.spendFor && e.spendFor !== "Self" ? ` · ${e.spendFor}` : ""}</div>
                          <div style={{ fontSize: 11, color: e.account === "Cash" ? theme.green : theme.blue, fontWeight: 700 }}>{(e.account || "Online").toUpperCase()}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(e.amount)}</div>
                        <button onClick={() => persistEntries(entries.filter((x) => x.id !== e.id))} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", display: "flex" }}><Trash2 size={14} /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <BottomNav />
        <PeopleModal />
      </div>
    );
  }

  // ============================= ADD EXPENSE SCREEN =============================
  if (screen === "add") {
    return (
      <div style={{ ...rootStyle, display: "flex", flexDirection: "column", height: "100vh" }}>
        <TopBar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", maxWidth: 480, width: "100%", margin: "0 auto" }}>
          {/* HEADER: amount + account toggle */}
          <div style={{ flexShrink: 0, padding: "20px 16px 16px", textAlign: "center", borderBottom: `1px solid ${theme.border}` }}>
            <button onClick={() => setScreen("home")} style={{ position: "absolute", left: 16, background: "none", border: "none", color: theme.textMuted, cursor: "pointer", display: "flex" }}><ArrowLeft size={18} /></button>
            <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 6 }}>How much?</div>
            <div style={{ fontSize: 40, fontWeight: 800, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
              <span style={{ fontSize: 22, color: theme.textMuted }}>{CURRENCY}</span>{addAmount}
            </div>
            <div style={{ display: "inline-flex", background: theme.cardAlt, borderRadius: 20, padding: 3, marginTop: 14 }}>
              {ACCOUNTS.map((a) => (
                <button key={a.name} onClick={() => setAddAccount(a.name)} style={{ padding: "7px 20px", borderRadius: 18, border: "none", fontSize: 12, fontWeight: 700, background: addAccount === a.name ? theme.card : "transparent", color: addAccount === a.name ? theme.text : theme.textMuted, cursor: "pointer" }}>{a.emoji} {a.name}</button>
              ))}
            </div>
          </div>

          {/* MIDDLE: category grid + date + who-for */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {subProfiles.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", marginBottom: 8 }}>For</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
                  {["Self", ...subProfiles].map((p) => (
                    <button key={p} onClick={() => setAddFor(p)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: addFor === p ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`, background: addFor === p ? `${theme.accent}18` : theme.card, color: theme.text, whiteSpace: "nowrap" }}>{p}</button>
                  ))}
                </div>
              </>
            )}

            <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Category</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
              {CATEGORIES.map((c) => (
                <button key={c.name} onClick={() => setAddCategory(c.name)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 2px", borderRadius: 14, border: addCategory === c.name ? `2px solid ${c.color}` : `1px solid ${theme.border}`, background: addCategory === c.name ? `${c.color}1A` : theme.card, cursor: "pointer" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${c.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{c.emoji}</div>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: addCategory === c.name ? c.color : theme.textMuted, textAlign: "center" }}>{c.name}</span>
                </button>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}><Calendar size={12} /> Expense Date</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setAddDateChoice("today")} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: addDateChoice === "today" ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`, background: addDateChoice === "today" ? `${theme.accent}18` : theme.card, color: addDateChoice === "today" ? theme.accent : theme.text, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Today</button>
              <button onClick={() => setAddDateChoice("yesterday")} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: addDateChoice === "yesterday" ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`, background: addDateChoice === "yesterday" ? `${theme.accent}18` : theme.card, color: addDateChoice === "yesterday" ? theme.accent : theme.text, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Yesterday</button>
              <button onClick={() => setAddDateChoice("custom")} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: addDateChoice === "custom" ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`, background: addDateChoice === "custom" ? `${theme.accent}18` : theme.card, color: addDateChoice === "custom" ? theme.accent : theme.text, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Pick date</button>
            </div>
            {addDateChoice === "custom" && (
              <input type="date" value={addCustomDate} onChange={(e) => setAddCustomDate(e.target.value)} max={todayStr()} style={{ width: "100%", marginTop: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 13, boxSizing: "border-box" }} />
            )}
          </div>

          {/* FOOTER: numpad + submit */}
          <div style={{ flexShrink: 0, padding: "12px 16px calc(12px + env(safe-area-inset-bottom))", borderTop: `1px solid ${theme.border}`, background: theme.bg }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
              {[1,2,3,4,5,6,7,8,9].map((d) => (
                <button key={d} onClick={() => pressDigit(String(d))} style={{ padding: "12px 0", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{d}</button>
              ))}
              <button onClick={pressDot} style={{ padding: "12px 0", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>.</button>
              <button onClick={() => pressDigit("0")} style={{ padding: "12px 0", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>0</button>
              <button onClick={pressBackspace} style={{ padding: "12px 0", borderRadius: 10, border: "none", background: `${theme.red}18`, color: theme.red, fontWeight: 700, fontSize: 15, cursor: "pointer" }}><X size={16} style={{ margin: "0 auto" }} /></button>
            </div>
            <button onClick={submitExpense} disabled={!addCategory || parseFloat(addAmount) <= 0} style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: (!addCategory || parseFloat(addAmount) <= 0) ? theme.cardAlt : theme.accent, color: (!addCategory || parseFloat(addAmount) <= 0) ? theme.textMuted : "#fff", fontWeight: 700, fontSize: 14, cursor: (!addCategory || parseFloat(addAmount) <= 0) ? "not-allowed" : "pointer" }}>
              Add Expense
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================= BUDGET SCREEN =============================
  if (screen === "budget") {
    const cash = accountStats("Cash");
    const online = accountStats("Online");
    return (
      <div style={rootStyle}>
        <TopBar>
          <MonthNav value={budgetMonth} onChange={setBudgetMonth} />
        </TopBar>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 90px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>Monthly Overview</div>
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "16px 18px", marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: theme.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}><TrendingUp size={11} /> RECEIVED</div>
              <div style={{ fontSize: 17, fontWeight: 800, marginTop: 4 }}>{fmt(monthReceived)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: theme.red, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}><TrendingDown size={11} /> SPENT</div>
              <div style={{ fontSize: 17, fontWeight: 800, marginTop: 4 }}>{fmt(monthSpent)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: theme.textMuted, fontWeight: 700 }}>BALANCE</div>
              <div style={{ fontSize: 17, fontWeight: 800, marginTop: 4, color: monthBalance >= 0 ? theme.green : theme.red }}>{fmt(monthBalance)}</div>
            </div>
          </div>

          {ACCOUNTS.map((a) => {
            const stats = a.name === "Cash" ? cash : online;
            const goal = accountGoals[a.name] || 0;
            return (
              <div key={a.name} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "16px 18px", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${a.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{a.emoji}</div>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{a.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditAccountModal(a.name); setEditAccountGoal(String(goal || "")); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 20, border: `1px solid ${theme.border}`, background: theme.cardAlt, color: theme.text, fontSize: 11, fontWeight: 700, cursor: "pointer" }}><Edit3 size={11} /> Edit</button>
                    <button onClick={() => setMoneyModalAccount(a.name)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 20, border: "none", background: a.color, color: "#0E0E16", fontSize: 11, fontWeight: 800, cursor: "pointer" }}><Plus size={11} /> Add</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <div style={{ background: theme.cardAlt, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: theme.textMuted, fontWeight: 700 }}>RECEIVED</div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2 }}>{fmt(stats.received)}</div>
                  </div>
                  <div style={{ background: theme.cardAlt, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: theme.textMuted, fontWeight: 700 }}>SPENT</div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2 }}>{fmt(stats.spent)}</div>
                  </div>
                  <div style={{ background: theme.cardAlt, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: theme.textMuted, fontWeight: 700 }}>BALANCE</div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2, color: stats.balance >= 0 ? theme.green : theme.red }}>{fmt(stats.balance)}</div>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 4, background: theme.cardAlt, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${stats.progress}%`, background: a.color, borderRadius: 4, transition: "width 0.3s ease" }} />
                </div>
                {goal > 0 && <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 6 }}>Goal: {fmt(goal)}</div>}
              </div>
            );
          })}
        </div>
        <BottomNav />
        <PeopleModal />

        {/* ADD MONEY MODAL */}
        {moneyModalAccount && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
            <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: theme.card, borderRadius: "20px 20px 0 0", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Add money to {moneyModalAccount}</h3>
                <button onClick={() => setMoneyModalAccount(null)} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer" }}><X size={18} /></button>
              </div>
              <input type="number" autoFocus value={moneyAmount} onChange={(e) => setMoneyAmount(e.target.value)} placeholder="Amount" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 16, fontWeight: 700, boxSizing: "border-box", marginBottom: 10 }} />
              <input type="text" value={moneyLabel} onChange={(e) => setMoneyLabel(e.target.value)} placeholder="Note (e.g. Salary, Gift)" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 13, boxSizing: "border-box", marginBottom: 16 }} />
              <button onClick={submitAddMoney} disabled={!moneyAmount} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: moneyAmount ? theme.accent : theme.cardAlt, color: moneyAmount ? "#fff" : theme.textMuted, fontWeight: 700, fontSize: 14, cursor: moneyAmount ? "pointer" : "not-allowed" }}>Save</button>
            </div>
          </div>
        )}

        {/* EDIT ACCOUNT GOAL MODAL */}
        {editAccountModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
            <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: theme.card, borderRadius: "20px 20px 0 0", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Set {editAccountModal} goal</h3>
                <button onClick={() => setEditAccountModal(null)} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer" }}><X size={18} /></button>
              </div>
              <input type="number" autoFocus value={editAccountGoal} onChange={(e) => setEditAccountGoal(e.target.value)} placeholder="Monthly spending goal" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 16, fontWeight: 700, boxSizing: "border-box", marginBottom: 16 }} />
              <button onClick={submitAccountGoal} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: theme.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Save Goal</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================= CREDIT (LENDING) SCREEN =============================
  if (screen === "credit") {
    return (
      <div style={rootStyle}>
        <TopBar />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 90px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: `${theme.green}18`, border: `1px solid ${theme.green}44`, borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: theme.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><TrendingUp size={12} /> TO GET</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{fmt(toGet)}</div>
            </div>
            <div style={{ flex: 1, background: `${theme.red}18`, border: `1px solid ${theme.red}44`, borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: theme.red, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><TrendingDown size={12} /> TO PAY</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{fmt(toPay)}</div>
            </div>
          </div>

          <div style={{ display: "flex", background: theme.cardAlt, borderRadius: 20, padding: 3, marginBottom: 16 }}>
            <button onClick={() => setCreditTab("lent")} style={{ flex: 1, padding: "9px 0", borderRadius: 18, border: "none", fontSize: 13, fontWeight: 700, background: creditTab === "lent" ? theme.card : "transparent", color: theme.text, cursor: "pointer" }}>I Lent</button>
            <button onClick={() => setCreditTab("borrowed")} style={{ flex: 1, padding: "9px 0", borderRadius: 18, border: "none", fontSize: 13, fontWeight: 700, background: creditTab === "borrowed" ? theme.card : "transparent", color: theme.text, cursor: "pointer" }}>I Borrowed</button>
          </div>

          {creditList.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", color: theme.textMuted }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: theme.cardAlt, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Users size={24} /></div>
              <div style={{ fontSize: 13 }}>No records found</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {creditList.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, opacity: c.settled ? 0.55 : 1 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: theme.cardAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: theme.accent }}>{c.person[0]?.toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, textDecoration: c.settled ? "line-through" : "none" }}>{c.person}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>{c.note ? `${c.note} · ` : ""}{c.date}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: creditTab === "lent" ? theme.green : theme.red }}>{fmt(c.amount)}</div>
                  <button onClick={() => toggleSettled(c.id)} title="Mark settled" style={{ background: "none", border: "none", color: c.settled ? theme.green : theme.textMuted, cursor: "pointer", display: "flex" }}><Check size={15} /></button>
                  <button onClick={() => removeCredit(c.id)} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", display: "flex" }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowCreditModal(true)} style={{ position: "fixed", bottom: 86, right: 20, width: 54, height: 54, borderRadius: "50%", background: theme.accent, border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 20px ${theme.accent}55`, cursor: "pointer", zIndex: 90 }}>
          <Plus size={24} />
        </button>
        <BottomNav />
        <PeopleModal />

        {showCreditModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
            <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: theme.card, borderRadius: "20px 20px 0 0", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{creditTab === "lent" ? "I Lent Money" : "I Borrowed Money"}</h3>
                <button onClick={() => setShowCreditModal(false)} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer" }}><X size={18} /></button>
              </div>
              <input type="text" autoFocus value={creditPerson} onChange={(e) => setCreditPerson(e.target.value)} placeholder="Person's name" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 14, boxSizing: "border-box", marginBottom: 10 }} />
              <input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="Amount" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 16, fontWeight: 700, boxSizing: "border-box", marginBottom: 10 }} />
              <input type="text" value={creditNote} onChange={(e) => setCreditNote(e.target.value)} placeholder="Note (optional)" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 13, boxSizing: "border-box", marginBottom: 16 }} />
              <button onClick={submitCredit} disabled={!creditPerson.trim() || !creditAmount} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: (creditPerson.trim() && creditAmount) ? theme.accent : theme.cardAlt, color: (creditPerson.trim() && creditAmount) ? "#fff" : theme.textMuted, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Save Record</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
