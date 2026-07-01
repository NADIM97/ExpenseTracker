import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Trash2, Wallet, Check, Share2, Download, Calculator, Moon, Sun, LogOut, X, Plus, Edit3, ArrowLeft } from "lucide-react";

const CATEGORIES = [
  { name: "Food", color: "#D97757", emoji: "🍽️" },
  { name: "Groceries", color: "#9C8C5A", emoji: "🛒" },
  { name: "Fuel", color: "#A65D3F", emoji: "⛽" },
  { name: "Transport", color: "#4A7C7C", emoji: "🚕" },
  { name: "Rent", color: "#6B5B95", emoji: "🏠" },
  { name: "EMI/Loan", color: "#7A4F4F", emoji: "🏦" },
  { name: "Utilities", color: "#88A47C", emoji: "💡" },
  { name: "Mobile/Net", color: "#4F7A8C", emoji: "📶" },
  { name: "Shopping", color: "#C2856E", emoji: "🛍️" },
  { name: "Health", color: "#5C8AA8", emoji: "💊" },
  { name: "Education", color: "#7C6BA8", emoji: "📚" },
  { name: "Travel", color: "#3F8C7A", emoji: "✈️" },
  { name: "Entertainment", color: "#B8860B", emoji: "🎬" },
  { name: "Investment", color: "#2F8C5A", emoji: "📈" },
  { name: "Insurance", color: "#5A6F8C", emoji: "🛡️" },
  { name: "Other", color: "#8C8C8C", emoji: "📦" },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];
const CURRENCY = "₹";
const PAYMENT_MODES = ["Cash", "Online"];

const AUTH_USERS_KEY = "family-tracker:auth-registry";
const CURRENT_USER_SESSION_KEY = "family-tracker:active-session";
const THEME_KEY = "expense-tracker-inr:darkmode";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthKey(d) {
  return d.slice(0, 7);
}

export default function App() {
  // --- NAVIGATION STATE ---
  const [currentScreen, setCurrentScreen] = useState("dashboard"); // "dashboard" | "splitter"

  // --- AUTHENTICATION STATES ---
  const [usersRegistry, setUsersRegistry] = useState(() => {
    const saved = localStorage.getItem(AUTH_USERS_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem(CURRENT_USER_SESSION_KEY) || null;
  });

  const [authMode, setAuthMode] = useState("login"); 
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // --- SUB-ACCOUNT/PERSONS TRACKING STATES ---
  const [subProfiles, setSubProfiles] = useState([]);
  const [subActionTarget, setSubActionTarget] = useState(null); 
  const [subActionView, setSubActionView] = useState("menu"); 
  const [subModalInput, setSubModalInput] = useState("");
  const [selectedSubTarget, setSelectedSubTarget] = useState("Self");

  // --- CORE SYSTEM APP STATES ---
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [budget, setBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [editingBudget, setEditingBudget] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [confetti, setConfetti] = useState([]);

  const [activeProfile, setActiveProfile] = useState("All");
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- BILL SPLITTER TRANSACTIONAL FORM STATES ---
  const [billAmount, setBillAmount] = useState("");
  const [billPeople, setBillPeople] = useState("2");
  const [upiId, setUpiId] = useState("");

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(null);
  const [mode, setMode] = useState("Cash");
  const [justAdded, setJustAdded] = useState(false);

  const [income, setIncome] = useState([]);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeLabel, setIncomeLabel] = useState("Salary");

  useEffect(() => {
    setActiveProfile("All");
    setCurrentScreen("dashboard");
  }, [currentUser]);

  const theme = {
    bg: darkMode ? "#121212" : "#F7F4EF",
    card: darkMode ? "#1E1E1E" : "#FFFFFF",
    text: darkMode ? "#E5E5E5" : "#2B2620",
    textMuted: darkMode ? "#A0A0A0" : "#6B6458",
    border: darkMode ? "#2D2D2D" : "#E8E2D6",
    tabBg: darkMode ? "#2A2A2A" : "#EAE4DA",
    inputBg: darkMode ? "#252525" : "#FFFDF9",
    accent: "#D97757",
    danger: "#C2856E"
  };

  // --- DATA FETCHING & SYNCHRONIZATION ---
  useEffect(() => {
    if (!currentUser) return;
    setLoaded(false);
    const userPrefix = `user:${currentUser}:`;

    try {
      const subRes = localStorage.getItem(userPrefix + "subprofiles");
      setSubProfiles(subRes ? JSON.parse(subRes) : []);
    } catch(e) { setSubProfiles([]); }

    try {
      const res = localStorage.getItem(userPrefix + "entries");
      setEntries(res ? JSON.parse(res) : []);
    } catch (e) { setEntries([]); }

    try {
      const b = localStorage.getItem(userPrefix + "budget");
      setBudget(b ? parseFloat(b) || 0 : 0);
    } catch (e) { setBudget(0); }

    try {
      const inc = localStorage.getItem(userPrefix + "income");
      setIncome(inc ? JSON.parse(inc) : []);
    } catch (e) { setIncome([]); }

    try { setUpiId(localStorage.getItem(userPrefix + "upi") || ""); } catch (e) {}
    setLoaded(true);
  }, [currentUser]);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme) setDarkMode(JSON.parse(savedTheme));
    } catch (e) {}
  }, []);

  const handlePortalAuth = (e) => {
    e.preventDefault();
    setAuthError("");
    const normalizedUser = usernameInput.trim().toLowerCase();

    if (!normalizedUser || !passwordInput) {
      setAuthError("Please fill out all credential fields.");
      return;
    }

    if (authMode === "register") {
      if (usersRegistry[normalizedUser]) {
        setAuthError("This User ID already exists.");
        return;
      }
      const updatedRegistry = { ...usersRegistry, [normalizedUser]: passwordInput };
      setUsersRegistry(updatedRegistry);
      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(updatedRegistry));
      localStorage.setItem(CURRENT_USER_SESSION_KEY, normalizedUser);
      setCurrentUser(normalizedUser);
      clearPortalInputs();
    } else {
      if (usersRegistry[normalizedUser] && usersRegistry[normalizedUser] === passwordInput) {
        localStorage.setItem(CURRENT_USER_SESSION_KEY, normalizedUser);
        setCurrentUser(normalizedUser);
        clearPortalInputs();
      } else {
        setAuthError("Invalid User ID or Password setup.");
      }
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem(CURRENT_USER_SESSION_KEY);
    setCurrentUser(null);
    setEntries([]);
    setIncome([]);
    setBudget(0);
    setSubProfiles([]);
    setSelectedSubTarget("Self");
    setActiveProfile("All");
    setSearchQuery("");
    setCurrentScreen("dashboard");
  };

  const clearPortalInputs = () => {
    setUsernameInput("");
    setPasswordInput("");
    setAuthError("");
  };

  // --- SUB ACCOUNT RUNTIMES & MANAGEMENT ---
  function handleAddSubProfile() {
    const name = subModalInput.trim();
    if (!name || subProfiles.includes(name) || name.toLowerCase() === "self") return;
    const updated = [...subProfiles, name];
    setSubProfiles(updated);
    setSubModalInput("");
    setSubActionTarget(null);
    if (currentUser) {
      localStorage.setItem(`user:${currentUser}:subprofiles`, JSON.stringify(updated));
    }
  }

  function handleRenameSubProfile() {
    const newName = subModalInput.trim();
    if (!newName || !subActionTarget || subProfiles.includes(newName) || newName.toLowerCase() === "self") return;
    
    const updatedProfiles = subProfiles.map(p => p === subActionTarget ? newName : p);
    setSubProfiles(updatedProfiles);
    
    const updatedEntries = entries.map(e => e.spendFor === subActionTarget ? { ...e, spendFor: newName } : e);
    persist(updatedEntries);

    if (selectedSubTarget === subActionTarget) setSelectedSubTarget(newName);
    if (activeProfile === subActionTarget) setActiveProfile(newName);

    setSubModalInput("");
    setSubActionTarget(null);
    if (currentUser) {
      localStorage.setItem(`user:${currentUser}:subprofiles`, JSON.stringify(updatedProfiles));
    }
  }

  function handleRemoveSubProfile(name) {
    const updated = subProfiles.filter(p => p !== name);
    setSubProfiles(updated);
    if (selectedSubTarget === name) setSelectedSubTarget("Self");
    if (activeProfile === name) setActiveProfile("All");
    setSubActionTarget(null);
    if (currentUser) {
      localStorage.setItem(`user:${currentUser}:subprofiles`, JSON.stringify(updated));
    }
  }

  function openAddSubModal() {
    setSubActionTarget("New Profile");
    setSubActionView("add");
    setSubModalInput("");
  }

  function openManageSubModal(name) {
    if (name.toLowerCase() === "self") return; 
    setSubActionTarget(name);
    setSubActionView("menu");
    setSubModalInput(name);
  }

  function persist(next) {
    setEntries(next);
    if (currentUser) {
      localStorage.setItem(`user:${currentUser}:entries`, JSON.stringify(next));
    }
  }

  function persistIncome(next) {
    setIncome(next);
    if (currentUser) {
      localStorage.setItem(`user:${currentUser}:income`, JSON.stringify(next));
    }
  }

  function saveBudgetGoal() {
    const v = parseFloat(budgetInput);
    if (isNaN(v) || v < 0) return;
    setBudget(v);
    setEditingBudget(false);
    if (currentUser) {
      localStorage.setItem(`user:${currentUser}:budget`, String(v));
    }
  }

  function triggerConfetti() {
    const particles = [];
    const colors = ["#D97757", "#4A7C7C", "#2F8C5A", "#6B5B95"];
    for (let i = 0; i < 30; i++) {
      particles.push({
        id: Math.random(),
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.3,
        duration: 1 + Math.random() * 1.2,
        size: 6 + Math.random() * 6
      });
    }
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 2200);
  }

  function toggleTheme() {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    try { localStorage.setItem(THEME_KEY, JSON.stringify(nextMode)); } catch (e) {}
  }

  function addIncome() {
    const v = parseFloat(incomeAmount);
    if (!v || v <= 0) return;
    const entry = { id: uid(), amount: v, label: incomeLabel.trim() || "Salary", date: todayStr() };
    persistIncome([entry, ...income]);
    setIncomeAmount("");
    setShowIncomeForm(false);
    triggerConfetti();
  }

  function quickAdd(amt) {
    if (!category || !currentUser) return;
    const entry = { 
      id: uid(), 
      amount: amt, 
      category, 
      mode, 
      date: todayStr(), 
      spendFor: selectedSubTarget
    };
    persist([entry, ...entries]);
    setJustAdded(true);
    triggerConfetti();
    setTimeout(() => setJustAdded(false), 700);
  }

  function customAdd() {
    const v = parseFloat(amount);
    if (!v || v <= 0 || !category) return;
    quickAdd(v);
    setAmount("");
  }

  function removeEntry(e) {
    const remaining = entries.filter((item) => item.id !== e.id);
    setEntries(remaining);
    localStorage.setItem(`user:${currentUser}:entries`, JSON.stringify(remaining));
  }

  function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,Date,Spent For,Category,Mode,Amount\n";
    searchedEntries.forEach((e) => {
      csvContent += `${e.date},${e.spendFor || "Self"},${e.category},${e.mode || "Cash"},${e.amount}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentUser}_Ledger_${todayStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportToPDF() {
    const printableWindow = window.open("", "_blank", "width=800,height=600");
    const tableRows = searchedEntries.map(e => `
      <tr style="border-bottom: 1px solid #E8E2D6;">
        <td style="padding: 10px; font-size: 13px;">${e.date}</td>
        <td style="padding: 10px; font-size: 13px;"><strong>${e.spendFor || "Self"}</strong></td>
        <td style="padding: 10px; font-size: 13px;">${e.category}</td>
        <td style="padding: 10px; font-size: 13px;">${e.mode || "Cash"}</td>
        <td style="padding: 10px; font-size: 13px; font-weight: bold; text-align: right;">${CURRENCY}${e.amount.toFixed(2)}</td>
      </tr>
    `).join("");

    printableWindow.document.write(`
      <html>
        <head>
          <title>Expense Ledger Statement</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #2B2620; padding: 40px; margin: 0; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2B2620; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #F7F4EF; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; color: #6B6458; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 24px;">Personal Account Audit Ledger</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #6B6458;">Sub-account Attribution Tracking</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 14px;">Total View Scope: <strong>${CURRENCY}${monthTotal.toFixed(2)}</strong></p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6B6458;">Generated: ${todayStr()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Spent For Profile</th>
                <th>Category</th>
                <th>Payment Mode</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #6B6458;">No transactional records found.</td></tr>'}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printableWindow.document.close();
  }

  function shareOnWhatsApp(e) {
    const message = `📊 *Expense Log Update* 📊\n\n👥 *Spent For:* *${e.spendFor || "Self"}*\n📂 *Category:* ${catEmoji(e.category)} ${e.category}\n💰 *Amount:* ${CURRENCY}${e.amount.toFixed(2)}\n💳 *Paid Via:* ${e.mode || "Cash"}\n📅 *Date:* ${e.date}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  // --- FILTER PIPELINE ---
  const filteredEntries = useMemo(() => {
    if (activeProfile === "All") return entries;
    if (activeProfile === "Self") {
      return entries.filter((e) => !e.spendFor || e.spendFor === "Self");
    }
    return entries.filter((e) => e.spendFor === activeProfile);
  }, [entries, activeProfile]);

  const searchedEntries = useMemo(() => {
    if (!searchQuery.trim()) return filteredEntries;
    const cleanQuery = searchQuery.toLowerCase().trim();
    return filteredEntries.filter((e) => {
      return (
        e.category.toLowerCase().includes(cleanQuery) ||
        (e.mode || "").toLowerCase().includes(cleanQuery) ||
        e.date.includes(cleanQuery) ||
        (e.spendFor || "").toLowerCase().includes(cleanQuery) ||
        String(e.amount).includes(cleanQuery)
      );
    });
  }, [filteredEntries, searchQuery]);

  const thisMonth = monthKey(todayStr());
  const monthEntries = useMemo(() => filteredEntries.filter((e) => monthKey(e.date) === thisMonth), [filteredEntries, thisMonth]);
  const monthTotal = useMemo(() => monthEntries.reduce((s, e) => s + e.amount, 0), [monthEntries]);

  const totals = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => (map[c.name] = 0));
    monthEntries.forEach((e) => (map[e.category] = (map[e.category] || 0) + e.amount));
    return map;
  }, [monthEntries]);

  const pieData = useMemo(
    () => CATEGORIES.map((c) => ({ name: c.name, value: totals[c.name], color: c.color })).filter((d) => d.value > 0),
    [totals]
  );

  const catEmoji = (name) => CATEGORIES.find((c) => c.name === name)?.emoji || "•";

  if (!currentUser) {
    return (
      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: darkMode ? "#121212" : "#F7F4EF", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", color: theme.text, transition: "background 0.3s ease" }}>
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 20, padding: "32px 24px", width: "100%", maxWidth: 400, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: theme.text, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Wallet size={20} color={theme.bg} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Tracker Profile Sign In</h2>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Isolated Data Management Ledger</p>
          </div>

          {authError && (
            <div style={{ background: "rgba(217,119,87,0.1)", border: "1px solid #D97757", color: "#D97757", padding: "10px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, marginBottom: 16, textAlign: "center" }}>
              {authError}
            </div>
          )}

          <form onSubmit={handlePortalAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: theme.textMuted, marginBottom: 5, textTransform: "uppercase" }}>User ID / Username</label>
              <input type="text" required value={usernameInput} onChange={e => setUsernameInput(e.target.value)} placeholder="Enter workspace account ID..." style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: theme.textMuted, marginBottom: 5, textTransform: "uppercase" }}>Secret Password</label>
              <input type="password" required value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <button type="submit" style={{ background: theme.text, color: theme.bg, border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>
              {authMode === "login" ? "Verify & Open Dashboard" : "Register Storage Space"}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: theme.textMuted, borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
            {authMode === "login" ? (
              <p style={{ margin: 0 }}>Need separate workspace storage? <button onClick={() => { setAuthMode("register"); setAuthError(""); }} style={{ background: "none", border: "none", color: theme.accent, fontWeight: 700, cursor: "pointer", padding: 0, textDecoration: "underline" }}>Register here</button></p>
            ) : (
              <p style={{ margin: 0 }}>Already have an access profile? <button onClick={() => { setAuthMode("login"); setAuthError(""); }} style={{ background: "none", border: "none", color: theme.accent, fontWeight: 700, cursor: "pointer", padding: 0, textDecoration: "underline" }}>Log in here</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: theme.bg, minHeight: "100vh", color: theme.text, transition: "background 0.3s ease, color 0.3s ease", position: "relative", overflowX: "hidden" }}>
      
      {confetti.map((p) => (
        <div key={p.id} style={{ position: "fixed", top: "-20px", left: `${p.x}%`, width: p.size, height: p.size, backgroundColor: p.color, borderRadius: "50%", zIndex: 9999, pointerEvents: "none", animation: `fall ${p.duration}s linear forwards`, animationDelay: `${p.delay}s` }} />
      ))}
      <style>{`@keyframes fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(105vh) rotate(360deg); opacity: 0; } }`}</style>

      {/* SUB PROFILE MANAGER POPUP MODAL */}
      {subActionTarget && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 10000 }}>
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 20, width: "100%", maxWidth: 360, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                {subActionView === "add" ? "Create New Profile" : `Manage Profile: ${subActionTarget}`}
              </h3>
              <button onClick={() => setSubActionTarget(null)} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer" }}><X size={16}/></button>
            </div>

            {subActionView === "menu" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => { setSelectedSubTarget(subActionTarget); setSubActionTarget(null); }} style={{ width: "100%", padding: "11px", background: theme.text, color: theme.bg, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Select for Current Spends
                </button>
                <button onClick={() => setSubActionView("edit")} style={{ width: "100%", padding: "11px", background: theme.tabBg, color: theme.text, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Edit3 size={14}/> Rename Profile
                </button>
                <button onClick={() => handleRemoveSubProfile(subActionTarget)} style={{ width: "100%", padding: "11px", background: "rgba(217,119,87,0.1)", color: theme.accent, border: `1px solid ${theme.accent}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Delete Profile permanently
                </button>
              </div>
            )}

            {(subActionView === "edit" || subActionView === "add") && (
              <div>
                <input type="text" value={subModalInput} onChange={(e) => setSubModalInput(e.target.value)} placeholder="Enter unique profile name..." style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 13, boxSizing: "border-box", marginBottom: 14 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => subActionView === "add" ? setSubActionTarget(null) : setSubActionView("menu")} style={{ flex: 1, padding: "10px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: theme.text, cursor: "pointer" }}>Back</button>
                  <button onClick={subActionView === "add" ? handleAddSubProfile : handleRenameSubProfile} disabled={!subModalInput.trim()} style={{ flex: 1, padding: "10px", background: subModalInput.trim() ? theme.text : theme.tabBg, color: theme.bg, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: subModalInput.trim() ? "pointer" : "not-allowed" }}>Save Changes</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* SCREEN PAGE 2: BILL SPLITTER SCREEN WORKFLOW */}
      {currentScreen === "splitter" ? (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
          {/* Back Navigation Bar Layout Component matching image_199b5e.png headers */}
          <button 
            onClick={() => setCurrentScreen("dashboard")} 
            style={{ background: "#2B2620", color: "#FFFDF9", border: "none", borderRadius: 12, width: "100%", padding: "12px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.06)", marginBottom: 20 }}
          >
            <ArrowLeft size={16} /> Bill Splitter Tool Module
          </button>

          {/* Central Workspace Canvas Wrapper Container */}
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: "24px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 24px 0", fontSize: 16, fontWeight: 700, color: theme.text, letterSpacing: -0.3 }}>
              Simple Peer Splitter
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: theme.textMuted, textAlign: "center" }}>
                  Total Bill Amount ({CURRENCY})
                </label>
                <input 
                  type="number" 
                  value={billAmount} 
                  onChange={e => setBillAmount(e.target.value)} 
                  placeholder="0.00" 
                  style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15, boxSizing: "border-box" }} 
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: theme.textMuted, textAlign: "center" }}>
                    Number of People
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    value={billPeople} 
                    onChange={e => setBillPeople(e.target.value)} 
                    style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15, boxSizing: "border-box" }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: theme.textMuted, textAlign: "center" }}>
                    Your UPI ID (Optional)
                  </label>
                  <input 
                    type="text" 
                    value={upiId} 
                    onChange={e => { setUpiId(e.target.value); localStorage.setItem(`user:${currentUser}:upi`, e.target.value); }} 
                    placeholder="username@upi" 
                    style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 15, boxSizing: "border-box" }} 
                  />
                </div>
              </div>

              {/* Bottom Calculations View Banner */}
              <div style={{ marginTop: 14, padding: "14px 16px", background: theme.tabBg, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}>
                <span style={{ fontSize: 13, color: theme.text, fontWeight: 500 }}>
                  Share Per Head: <strong>{CURRENCY}{parseFloat(billAmount) && parseInt(billPeople) > 0 ? (parseFloat(billAmount) / parseInt(billPeople)).toFixed(2) : "0.00"}</strong>
                </span>
                <button 
                  onClick={() => {
                    const shareAmt = parseFloat(billAmount) && parseInt(billPeople) > 0 ? (parseFloat(billAmount) / parseInt(billPeople)).toFixed(2) : "0.00";
                    let msg = `Hey, our split share comes out to ${CURRENCY}${shareAmt} each.`;
                    if (upiId) msg += ` You can wire it via UPI directly to: ${upiId}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
                  }} 
                  disabled={!billAmount || parseInt(billPeople) <= 0}
                  style={{ background: "#2B2620", color: "#FFFDF9", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Share Request
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SCREEN PAGE 1: LEDGER ACCOUNT WORKSPACE MAIN DASHBOARD */
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 90px" }}>
          
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: theme.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={15} color={theme.bg} />
              </div>
              <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: -0.3 }}>
                Personal Ledger <span style={{ fontSize: 11, color: theme.accent }}>({currentUser})</span>
              </h1>
            </div>
            
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={toggleTheme} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px", cursor: "pointer", display: "flex", alignItems: "center", color: theme.text }}>
                {darkMode ? <Sun size={13} color="#FFD700" /> : <Moon size={13} />}
              </button>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowBackupMenu(!showBackupMenu)} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", color: theme.text }}>
                  <Download size={12} /> Backup
                </button>
                {showBackupMenu && (
                  <>
                    <div onClick={() => setShowBackupMenu(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} />
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 999, overflow: "hidden", minWidth: 130 }}>
                      <button onClick={() => { exportToCSV(); setShowBackupMenu(false); }} style={{ width: "100%", padding: "8px 12px", border: "none", background: "none", textAlign: "left", fontSize: 12, fontWeight: 500, color: theme.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>📄 CSV Sheet</button>
                      <button onClick={() => { exportToPDF(); setShowBackupMenu(false); }} style={{ width: "100%", padding: "8px 12px", border: "none", borderTop: `1px solid ${theme.border}`, background: "none", textAlign: "left", fontSize: 12, fontWeight: 500, color: theme.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>📕 PDF Statement</button>
                    </div>
                  </>
                )}
              </div>
              <button onClick={handleSignOut} style={{ background: "rgba(217,119,87,0.1)", border: `1px solid ${theme.accent}`, borderRadius: 8, padding: "6px", cursor: "pointer", display: "flex", alignItems: "center", color: theme.accent }}>
                <LogOut size={13} />
              </button>
            </div>
          </header>

          {/* VIEW WORKSPACE FILTERS */}
          <div style={{ display: "flex", gap: 6, background: theme.tabBg, padding: "4px 6px", borderRadius: 10, marginBottom: 12, overflowX: "auto", alignItems: "center" }}>
            <button onClick={() => setActiveProfile("All")} style={{ padding: "6px 12px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 600, background: activeProfile === "All" ? theme.card : "transparent", color: activeProfile === "All" ? theme.text : theme.textMuted, cursor: "pointer", whiteSpace: "nowrap" }}>📊 All Expenses</button>
            <button onClick={() => setActiveProfile("Self")} style={{ padding: "6px 12px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 600, background: activeProfile === "Self" ? theme.card : "transparent", color: activeProfile === "Self" ? theme.text : theme.textMuted, cursor: "pointer", whiteSpace: "nowrap" }}>👤 Self</button>
            
            {subProfiles.map((p) => (
              <div key={p} style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "2px 6px", borderRadius: 8, background: activeProfile === p ? theme.card : "transparent", border: activeProfile === p ? `1px solid ${theme.accent}` : "none", whiteSpace: "nowrap" }}>
                <button onClick={() => setActiveProfile(p)} style={{ background: "none", border: "none", fontSize: 11, fontWeight: 600, color: theme.text, cursor: "pointer", padding: "4px 2px" }}>
                  👥 {p}
                </button>
                <button onClick={(e) => { e.stopPropagation(); openManageSubModal(p); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: "4px", display: "flex", alignItems: "center", opacity: 0.7 }}>
                  ⚙️
                </button>
              </div>
            ))}
            
            <button onClick={openAddSubModal} style={{ padding: "6px 10px", background: theme.card, border: `1px dashed ${theme.border}`, borderRadius: 8, display: "flex", alignItems: "center", cursor: "pointer", color: theme.accent, marginLeft: "auto" }}>
              <Plus size={13} />
            </button>
          </div>

          {/* METRICS HUD CARD */}
          <div style={{ background: darkMode ? "#222" : "#2B2620", color: "#F7F4EF", borderRadius: 16, padding: "16px 18px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ fontSize: 11, opacity: 0.65, textTransform: "uppercase" }}>
                Active View: {activeProfile === "All" ? "Combined Balance Total" : activeProfile}
              </div>
              <div onClick={() => setShowIncomeForm((s) => !s)} style={{ fontSize: 11, opacity: 0.8, cursor: "pointer", textDecoration: "underline" }}>+ Add Income</div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{CURRENCY}{monthTotal.toFixed(2)}</div>
              {editingBudget ? (
                <div style={{ display: "flex", gap: 4 }}>
                  <input type="number" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} style={{ width: 60, fontSize: 12, padding: "2px 4px", borderRadius: 4, border: "none" }} />
                  <button onClick={saveBudgetGoal} style={{ background: "#2F8C5A", border: "none", color: "white", fontSize: 10, padding: "2px 6px", borderRadius: 4, cursor: "pointer" }}>OK</button>
                </div>
              ) : budget > 0 ? (
                <div onClick={() => { setEditingBudget(true); setBudgetInput(String(budget)); }} style={{ fontSize: 12, opacity: 0.75, cursor: "pointer" }}>of {CURRENCY}{budget.toFixed(0)}</div>
              ) : (
                <div onClick={() => setEditingBudget(true)} style={{ fontSize: 12, opacity: 0.8, cursor: "pointer", textDecoration: "underline" }}>Set Budget</div>
              )}
            </div>
          </div>

          {showIncomeForm && (
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 14, marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input type="text" value={incomeLabel} onChange={(e) => setIncomeLabel(e.target.value)} style={{ flex: "1 1 100px", padding: "9px 10px", borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: 13, background: theme.inputBg, color: theme.text }} />
              <input type="number" autoFocus value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} placeholder="Amount" style={{ flex: "1 1 100px", padding: "9px 10px", borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: 13, background: theme.inputBg, color: theme.text }} />
              <button onClick={addIncome} disabled={!incomeAmount} style={{ padding: "0 16px", borderRadius: 8, border: "none", background: incomeAmount ? theme.text : theme.tabBg, color: theme.bg, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Save</button>
            </div>
          )}

          {/* PAGE ROUTER TRIGGER: NAVIGATES TO THE BILL SPLITTER PAGE VIEW */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button 
              onClick={() => setCurrentScreen("splitter")} 
              style={{ flex: 1, background: theme.card, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "11px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}
            >
              <Calculator size={14} /> Bill Splitter Tool Module
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4, alignItems: "center" }}>
            <button onClick={() => setSelectedSubTarget("Self")} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: selectedSubTarget === "Self" ? `2px solid ${theme.text}` : `1px solid ${theme.border}`, background: selectedSubTarget === "Self" ? theme.tabBg : theme.card, color: theme.text, whiteSpace: "nowrap" }}>👤 Self</button>
            
              {subProfiles.map(p => (
                <div key={p} style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "2px 8px", borderRadius: 8, border: selectedSubTarget === p ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`, background: selectedSubTarget === p ? `${theme.accent}15` : theme.card, whiteSpace: "nowrap" }}>
                  <button onClick={() => setSelectedSubTarget(p)} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 600, color: theme.text, cursor: "pointer", padding: "4px 0" }}>
                    👥 {selectedSubTarget === p ? "✅ " : ""}{p}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); openManageSubModal(p); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: "4px", display: "flex", alignItems: "center", opacity: 0.7 }}>
                    ⚙️
                  </button>
                </div>
              ))}
            </div>

          {/* CATEGORY SELECTOR MATRIX */}
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", marginBottom: 8 }}>1. Pick category</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
            {CATEGORIES.map((c) => (
              <button key={c.name} onClick={() => setCategory(c.name)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", borderRadius: 12, border: category === c.name ? `2px solid ${c.color}` : `1px solid ${theme.border}`, background: category === c.name ? `${c.color}1A` : theme.card, cursor: "pointer" }}>
                <span style={{ fontSize: 18 }}>{c.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: category === c.name ? c.color : theme.textMuted }}>{c.name}</span>
              </button>
            ))}
          </div>

          {/* PAYMENT MODE CARDS */}
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", marginBottom: 8 }}>2. Payment Mode</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {PAYMENT_MODES.map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: mode === m ? `2px solid ${theme.text}` : `1px solid ${theme.border}`, background: mode === m ? (darkMode ? "#ffffff1a" : "#2B26200D") : theme.card, fontSize: 13, fontWeight: 700, color: theme.text, cursor: "pointer" }}>
                {m === "Cash" ? "💵" : "💳"} {m}
              </button>
            ))}
          </div>

          {/* AMOUNT LOGGING ENGINES */}
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", marginBottom: 8 }}>3. Enter Amount</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {QUICK_AMOUNTS.map((a) => (
              <button key={a} disabled={!category} onClick={() => quickAdd(a)} style={{ flex: "1 1 18%", padding: "12px 0", borderRadius: 10, border: `1px solid ${theme.border}`, background: category ? theme.card : theme.tabBg, fontSize: 14, fontWeight: 700, color: category ? theme.text : theme.textMuted, cursor: category ? "pointer" : "not-allowed" }}>
                {CURRENCY}{a}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={category ? `Amount for ${selectedSubTarget}…` : "Pick a category first"} disabled={!category} style={{ flex: 1, padding: "11px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, fontSize: 14, background: category ? theme.card : theme.tabBg, color: theme.text }} />
            <button onClick={customAdd} disabled={!category || !amount} style={{ padding: "0 18px", borderRadius: 10, border: "none", background: category && amount ? theme.text : theme.tabBg, color: theme.bg, fontWeight: 700, fontSize: 14, cursor: category && amount ? "pointer" : "not-allowed" }}>
              {justAdded ? <Check size={16} /> : "Add"}
            </button>
          </div>

          {/* PIE METRICS OVERVIEW */}
          {loaded && pieData.length > 0 && (
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={42} paddingAngle={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke={theme.card} strokeWidth={2} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                {pieData.sort((a, b) => b.value - a.value).map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.color }} />
                    <span style={{ color: theme.textMuted }}>{d.name}</span>
                    <span style={{ fontWeight: 600, color: theme.text }}>{CURRENCY}{d.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOG CONSOLE SEARCH MATRIX */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase" }}>Statement Logs Ledger Overview</div>
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: theme.accent, fontSize: 11, fontWeight: 700, padding: 0 }}>Clear Filter</button>}
          </div>

          <div style={{ position: "relative", marginBottom: 12 }}>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 Search categories, modes, sub-accounts..." style={{ width: "100%", padding: "10px 12px 10px 32px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.text, fontSize: 13, boxSizing: "border-box" }} />
          </div>

          {loaded && (
            searchedEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 16px", color: theme.textMuted, fontSize: 13, background: theme.card, border: `1px dashed ${theme.border}`, borderRadius: 12 }}>No logs found matching selection.</div>
            ) : (
              <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: "hidden" }}>
                {searchedEntries.slice(0, 40).map((e) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: `1px solid ${theme.border}` }}>
                    <span style={{ fontSize: 16 }}>{catEmoji(e.category)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: theme.text }}>
                        {e.category}
                        <span style={{ fontSize: 10, color: theme.textMuted, marginLeft: 6, padding: "2px 6px", background: theme.tabBg, borderRadius: 4, fontWeight: 600 }}>
                          For: {e.spendFor || "Self"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: theme.textMuted }}>
                        {e.date} {e.mode ? `· ${e.mode}` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{CURRENCY}{e.amount.toFixed(2)}</div>
                    <button onClick={() => shareOnWhatsApp(e)} style={{ background: "none", border: "none", color: "#4A7C7C", padding: 3, display: "flex" }}><Share2 size={13} /></button>
                    <button onClick={() => removeEntry(e)} style={{ background: "none", border: "none", color: "#C2856E", padding: 3, display: "flex" }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      )}
    </div>
  );
}
