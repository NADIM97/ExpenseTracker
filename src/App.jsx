import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Trash2, Wallet, Check, Share2, Download, Calculator, PiggyBank, Moon, Sun } from "lucide-react";

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
const PROFILES = ["Self", "Family Member 1", "Family Member 2"];
const CURRENCY = "₹";
const PAYMENT_MODES = ["Cash", "Online"];
const STORAGE_KEY = "expense-tracker-inr:entries";
const BUDGET_KEY = "expense-tracker-inr:budget";
const INCOME_KEY = "expense-tracker-inr:income";
const PIGGY_KEY = "expense-tracker-inr:piggy";
const UPI_KEY = "expense-tracker-inr:upi";
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
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [budget, setBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [editingBudget, setEditingBudget] = useState(false);

  // New Attraction Feature: Dark Mode State
  const [darkMode, setDarkMode] = useState(false);

  // New Attraction Feature: Confetti Particle State
  const [confetti, setConfetti] = useState([]);

  const [activeProfile, setActiveProfile] = useState("All");
  const [selectedProfile, setSelectedProfile] = useState("Self");

  const [showSplitter, setShowSplitter] = useState(false);
  const [showPiggy, setShowPiggy] = useState(false);

  const [billAmount, setBillAmount] = useState("");
  const [billPeople, setBillPeople] = useState("2");
  const [upiId, setUpiId] = useState("");

  const [piggyTarget, setPiggyTarget] = useState(5000);
  const [piggySaved, setPiggySaved] = useState(0);
  const [piggyInput, setPiggyInput] = useState("");

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(null);
  const [mode, setMode] = useState("Cash");
  const [justAdded, setJustAdded] = useState(false);

  const [income, setIncome] = useState([]);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeLabel, setIncomeLabel] = useState("Salary");

  // Dynamic Theme Colors configuration
  const theme = {
    bg: darkMode ? "#121212" : "#F7F4EF",
    card: darkMode ? "#1E1E1E" : "#FFFFFF",
    text: darkMode ? "#E5E5E5" : "#2B2620",
    textMuted: darkMode ? "#A0A0A0" : "#6B6458",
    border: darkMode ? "#2D2D2D" : "#E8E2D6",
    tabBg: darkMode ? "#2A2A2A" : "#EAE4DA",
    inputBg: darkMode ? "#252525" : "#FFFDF9",
    accent: "#D97757",
  };

  useEffect(() => {
    try {
      const res = localStorage.getItem(STORAGE_KEY);
      if (res) setEntries(JSON.parse(res));
    } catch (e) {}
    try {
      const b = localStorage.getItem(BUDGET_KEY);
      if (b) setBudget(parseFloat(b) || 0);
    } catch (e) {}
    try {
      const inc = localStorage.getItem(INCOME_KEY);
      if (inc) setIncome(JSON.parse(inc));
    } catch (e) {}
    try {
      const savedUpi = localStorage.getItem(UPI_KEY);
      if (savedUpi) setUpiId(savedUpi);
    } catch (e) {}
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme) setDarkMode(JSON.parse(savedTheme));
    } catch (e) {}
    try {
      const pig = localStorage.getItem(PIGGY_KEY);
      if (pig) {
        const parsed = JSON.parse(pig);
        setPiggyTarget(parsed.target || 5000);
        setPiggySaved(parsed.saved || 0);
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  // Micro-interaction: Trigger Confetti Animation Explosion
  function triggerConfetti() {
    const particles = [];
    const colors = ["#D97757", "#4A7C7C", "#2F8C5A", "#6B5B95", "#B8860B", "#FFD700", "#FF69B4"];
    for (let i = 0; i < 40; i++) {
      particles.push({
        id: Math.random(),
        x: Math.random() * 100, // horizontal start position percentage
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.4,
        duration: 1 + Math.random() * 1.5,
        size: 6 + Math.random() * 8
      });
    }
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 2500); // Clean up particles out of memory
  }

  function toggleTheme() {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(nextMode));
    } catch (e) {}
  }

  function persist(next) {
    setEntries(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (e) {}
  }

  function saveUpiId(val) {
    setUpiId(val);
    try { localStorage.setItem(UPI_KEY, val); } catch (e) {}
  }

  function savePiggyGoal() {
    const v = parseFloat(piggyInput);
    if (!v || v <= 0) return;
    setPiggySaved(v);
    setPiggyInput("");
    triggerConfetti(); // Celebrate financial stashing!
    try {
      localStorage.setItem(PIGGY_KEY, JSON.stringify({ target: piggyTarget, saved: v }));
    } catch (e) {}
  }

  function updatePiggyTarget(val) {
    const v = parseFloat(val);
    if (!v || v <= 0) return;
    setPiggyTarget(v);
    try {
      localStorage.setItem(PIGGY_KEY, JSON.stringify({ target: v, saved: piggySaved }));
    } catch (e) {}
  }

  function persistIncome(next) {
    setIncome(next);
    try { localStorage.setItem(INCOME_KEY, JSON.stringify(next)); } catch (e) {}
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
    if (!category) return;
    const entry = { id: uid(), amount: amt, category, mode, date: todayStr(), profile: selectedProfile };
    persist([entry, ...entries]);
    setJustAdded(true);
    triggerConfetti(); // Celebrate tracking an expense!
    setTimeout(() => setJustAdded(false), 700);
  }

  function customAdd() {
    const v = parseFloat(amount);
    if (!v || v <= 0 || !category) return;
    quickAdd(v);
    setAmount("");
  }

  function removeEntry(id) {
    persist(entries.filter((e) => e.id !== id));
  }

  function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,Date,Profile,Category,Mode,Amount\n";
    entries.forEach((e) => {
      csvContent += `${e.date},${e.profile || "Self"},${e.category},${e.mode || "Cash"},${e.amount}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Family_Expenses_${todayStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function shareOnWhatsApp(e) {
    const message = `📊 *Expense Update* 📊\n\n👤 *Logged for:* ${e.profile || "Self"}\n📂 *Category:* ${catEmoji(e.category)} ${e.category}\n💰 *Amount:* ${CURRENCY}${e.amount.toFixed(2)}\n💳 *Paid Via:* ${e.mode || "Cash"}\n📅 *Date:* ${e.date}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  function shareSplitRequest() {
    const message = `🍕 *Bill Split Request* 🍕\n\n💰 *Total Bill:* ${CURRENCY}${billAmount}\n👥 *Split Between:* ${billPeople} people\n📉 *Your Share:* ${CURRENCY}${splitResult}\n\n👉 Please pay via UPI to: *${upiId}*\n\n_Calculated instantly using Family Tracker. Try it here!_`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  const filteredEntries = useMemo(() => {
    if (activeProfile === "All") return entries;
    return entries.filter((e) => (e.profile || "Self") === activeProfile);
  }, [entries, activeProfile]);

  const thisMonth = monthKey(todayStr());
  const monthEntries = useMemo(() => filteredEntries.filter((e) => monthKey(e.date) === thisMonth), [filteredEntries, thisMonth]);
  const monthTotal = useMemo(() => monthEntries.reduce((s, e) => s + e.amount, 0), [monthEntries]);
  const monthIncomeEntries = useMemo(() => income.filter((i) => monthKey(i.date) === thisMonth), [income, thisMonth]);
  const monthIncomeTotal = useMemo(() => monthIncomeEntries.reduce((s, i) => s + i.amount, 0), [monthIncomeEntries]);
  const monthBalance = monthIncomeTotal - monthTotal;

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

  const piggyPct = Math.min(100, (piggySaved / piggyTarget) * 100);
  const catEmoji = (name) => CATEGORIES.find((c) => c.name === name)?.emoji || "•";

  const splitResult = useMemo(() => {
    const amt = parseFloat(billAmount) || 0;
    const people = parseInt(billPeople) || 1;
    return (amt / people).toFixed(2);
  }, [billAmount, billPeople]);

  const qrCodeUrl = useMemo(() => {
    if (!upiId || !parseFloat(billAmount)) return null;
    const upiString = `upi://pay?pa=${upiId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiString)}`;
  }, [upiId, billAmount]);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: theme.bg, minHeight: "100vh", color: theme.text, transition: "background 0.3s ease, color 0.3s ease", position: "relative", overflowX: "hidden" }}>
      
      {/* Dynamic Confetti Floating Canvas Layout */}
      {confetti.map((p) => (
        <div
          key={p.id}
          style={{
            position: "fixed",
            top: "-20px",
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            zIndex: 9999,
            pointerEvents: "none",
            animation: `fall ${p.duration}s linear forward`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Embedded CSS Injection for Confetti Explosion Effect */}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 90px" }}>
        
        {/* Header with Dark Mode Toggle integration */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: theme.text, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s ease" }}>
              <Wallet size={15} color={theme.bg} />
            </div>
            <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: -0.3 }}>Family Tracker</h1>
          </div>
          
          <div style={{ display: "flex", gap: 6 }}>
            {/* Dynamic Attractions: Theme Switcher Button */}
            <button onClick={toggleTheme} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px", cursor: "pointer", display: "flex", alignItems: "center", color: theme.text }}>
              {darkMode ? <Sun size={13} color="#FFD700" /> : <Moon size={13} />}
            </button>
            <button onClick={exportToCSV} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", color: theme.text }}>
              <Download size={12} /> Excel Backup
            </button>
          </div>
        </header>

        {/* Profile Tabs */}
        <div style={{ display: "flex", gap: 4, background: theme.tabBg, padding: 3, borderRadius: 10, marginBottom: 12 }}>
          {["All", ...PROFILES].map((prof) => (
            <button key={prof} onClick={() => setActiveProfile(prof)} style={{ flex: 1, padding: "6px 2px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 600, background: activeProfile === prof ? theme.card : "transparent", color: activeProfile === prof ? theme.text : theme.textMuted, cursor: "pointer", transition: "all 0.2s ease" }}>
              {prof}
            </button>
          ))}
        </div>

        {/* Budget Card */}
        <div style={{ background: darkMode ? "#222" : "#2B2620", color: "#F7F4EF", borderRadius: 16, padding: "16px 18px", marginBottom: 12, border: darkMode ? "1px solid #333" : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div style={{ fontSize: 11, opacity: 0.65, textTransform: "uppercase" }}>Viewing: {activeProfile} Expenses</div>
            <div onClick={() => setShowIncomeForm((s) => !s)} style={{ fontSize: 11, opacity: 0.8, cursor: "pointer", textDecoration: "underline" }}>+ add income</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{CURRENCY}{monthTotal.toFixed(2)}</div>
            {budget > 0 ? (
              <div onClick={() => { setEditingBudget(true); setBudgetInput(String(budget)); }} style={{ fontSize: 12, opacity: 0.75, cursor: "pointer" }}>of {CURRENCY}{budget.toFixed(0)}</div>
            ) : (
              <div onClick={() => setEditingBudget(true)} style={{ fontSize: 12, opacity: 0.8, cursor: "pointer", textDecoration: "underline" }}>set budget</div>
            )}
          </div>
          {monthIncomeTotal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, opacity: 0.75 }}>
              <span>Income: {CURRENCY}{monthIncomeTotal.toFixed(0)}</span>
              <span style={{ color: monthBalance >= 0 ? "#9FCB9A" : "#E0735A", fontWeight: 600 }}>Balance: {CURRENCY}{monthBalance.toFixed(0)}</span>
            </div>
          )}
        </div>

        {showIncomeForm && (
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 14, marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input type="text" value={incomeLabel} onChange={(e) => setIncomeLabel(e.target.value)} style={{ flex: "1 1 100px", padding: "9px 10px", borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: 13, background: theme.inputBg, color: theme.text }} />
            <input type="number" autoFocus value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} placeholder="Amount" style={{ flex: "1 1 100px", padding: "9px 10px", borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: 13, background: theme.inputBg, color: theme.text }} />
            <button onClick={addIncome} disabled={!incomeAmount} style={{ padding: "0 16px", borderRadius: 8, border: "none", background: incomeAmount ? theme.text : theme.tabBg, color: theme.bg, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Save</button>
          </div>
        )}

        {/* Smart Tools Grid */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={() => { setShowSplitter(!showSplitter); setShowPiggy(false); }} style={{ flex: 1, background: showSplitter ? theme.text : theme.card, color: showSplitter ? theme.bg : theme.text, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "10px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
            <Calculator size={14} /> Bill Splitter
          </button>
          <button onClick={() => { setShowPiggy(!showPiggy); setShowSplitter(false); }} style={{ flex: 1, background: showPiggy ? theme.text : theme.card, color: showPiggy ? theme.bg : theme.text, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "10px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
            <PiggyBank size={14} /> Piggy Bank
          </button>
        </div>

        {/* Bill Splitter Container */}
        {showSplitter && (
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 700 }}>🍕 Instant Bill Splitter & UPI QR</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              <input type="text" placeholder="Your UPI ID (e.g. name@oksbi)" value={upiId} onChange={(e) => saveUpiId(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: 12, background: theme.inputBg, color: theme.text }} />
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" placeholder="Total Bill (₹)" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} style={{ flex: 2, padding: "8px 10px", borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: 13, background: theme.inputBg, color: theme.text }} />
                <input type="number" placeholder="People" value={billPeople} onChange={(e) => setBillPeople(e.target.value)} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: 13, background: theme.inputBg, color: theme.text }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.bg, padding: "10px 12px", borderRadius: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: theme.textMuted }}>Each Share:</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: theme.accent }}>{CURRENCY}{splitResult}</span>
            </div>
            {qrCodeUrl && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 0 4px", borderTop: `1px dashed ${theme.border}` }}>
                <div style={{ background: "white", padding: 6, border: "1px solid #E8E2D6", borderRadius: 8 }}>
                  <img src={qrCodeUrl} alt="UPI QR Code" style={{ display: "block" }} />
                </div>
                <button onClick={shareSplitRequest} style={{ background: "#4A7C7C", border: "none", color: "white", padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  Send WhatsApp Request
                </button>
              </div>
            )}
          </div>
        )}

        {/* Piggy Bank Module */}
        {showPiggy && (
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>🎯 Savings Target</h3>
              <input type="number" value={piggyTarget} onChange={(e) => updatePiggyTarget(e.target.value)} style={{ width: 80, padding: "4px 6px", borderRadius: 6, border: `1px solid ${theme.border}`, fontSize: 12, textAlign: "right", fontWeight: 700, background: theme.inputBg, color: theme.text }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{CURRENCY}{piggySaved} <span style={{ fontSize: 12, fontWeight: 400, color: theme.textMuted }}>saved of {CURRENCY}{piggyTarget}</span></div>
            <div style={{ height: 8, background: theme.tabBg, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", width: `${piggyPct}%`, background: "#2F8C5A", borderRadius: 4 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" placeholder="Update total stash..." value={piggyInput} onChange={(e) => setPiggyInput(e.target.value)} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: 12, background: theme.inputBg, color: theme.text }} />
              <button onClick={savePiggyGoal} style={{ background: "#2F8C5A", border: "none", borderRadius: 8, padding: "0 14px", color: "white", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Update</button>
            </div>
          </div>
        )}

        {/* Input Form Setup */}
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", marginBottom: 8 }}>1. Tag to Profile</div>
        <select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, fontSize: 13, fontWeight: 600, marginBottom: 14, cursor: "pointer" }}>
          {PROFILES.map(p => <option key={p} value={p}>Log entry for: {p}</option>)}
        </select>

        <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", marginBottom: 8 }}>2. Pick category</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
          {CATEGORIES.map((c) => (
            <button key={c.name} onClick={() => setCategory(c.name)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", borderRadius: 12, border: category === c.name ? `2px solid ${c.color}` : `1px solid ${theme.border}`, background: category === c.name ? `${c.color}1A` : theme.card, cursor: "pointer" }}>
              <span style={{ fontSize: 18 }}>{c.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: category === c.name ? c.color : theme.textMuted }}>{c.name}</span>
            </button>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", marginBottom: 8 }}>3. Cash or online</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {PAYMENT_MODES.map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: mode === m ? `2px solid ${theme.text}` : `1px solid ${theme.border}`, background: mode === m ? (darkMode ? "#ffffff1a" : "#2B26200D") : theme.card, fontSize: 13, fontWeight: 700, color: theme.text, cursor: "pointer" }}>
              {m === "Cash" ? "💵" : "💳"} {m}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", marginBottom: 8 }}>4. Tap amount</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {QUICK_AMOUNTS.map((a) => (
            <button key={a} disabled={!category} onClick={() => quickAdd(a)} style={{ flex: "1 1 18%", padding: "12px 0", borderRadius: 10, border: `1px solid ${theme.border}`, background: category ? theme.card : theme.tabBg, fontSize: 14, fontWeight: 700, color: category ? theme.text : theme.textMuted, cursor: category ? "pointer" : "not-allowed" }}>
              {CURRENCY}{a}
            </button>
          ))}
        </div>

        {/* Custom Input Box & Add Button */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={category ? "Custom amount…" : "Pick a category first"} disabled={!category} style={{ flex: 1, padding: "11px 12px", borderRadius: 10, border: `1px solid ${theme.border}`, fontSize: 14, background: category ? theme.card : theme.tabBg, color: theme.text }} />
          <button onClick={customAdd} disabled={!category || !amount} style={{ padding: "0 18px", borderRadius: 10, border: "none", background: category && amount ? theme.text : theme.tabBg, color: theme.bg, fontWeight: 700, fontSize: 14, cursor: category && amount ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s ease" }}>
            {justAdded ? <Check size={16} /> : "Add"}
          </button>
        </div>

        {/* Chart Summary Container */}
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

        {/* Transactions History List */}
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 12 }}>
          Recent Transactions ({activeProfile})
        </div>
        {loaded && (
          filteredEntries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 16px", color: theme.textMuted, fontSize: 13, background: theme.card, border: `1px dashed ${theme.border}`, borderRadius: 12 }}>
              No records found for this profile.
            </div>
          ) : (
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: "hidden" }}>
              {filteredEntries.slice(0, 25).map((e) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: `1px solid ${theme.border}` }}>
                  <span style={{ fontSize: 16 }}>{catEmoji(e.category)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: theme.text }}>{e.category} <span style={{ fontSize: 10, background: theme.tabBg, padding: "1px 6px", borderRadius: 4, marginLeft: 4, color: theme.text }}>{e.profile || "Self"}</span></div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>
                      {e.date} {e.mode ? `· ${e.mode === "Cash" ? "💵" : "💳"} ${e.mode}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: theme.text }}>{CURRENCY}{e.amount.toFixed(2)}</div>
                  
                  <button onClick={() => shareOnWhatsApp(e)} style={{ background: "none", border: "none", color: "#4A7C7C", cursor: "pointer", padding: 3, display: "flex" }} title="Share to WhatsApp">
                    <Share2 size={13} />
                  </button>
                  
                  <button onClick={() => removeEntry(e.id)} style={{ background: "none", border: "none", color: "#C2856E", cursor: "pointer", padding: 3, display: "flex" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )
        )}

      </div>
    </div>
  );
}
