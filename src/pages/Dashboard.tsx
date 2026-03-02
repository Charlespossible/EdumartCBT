import React, { useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import PaymentModal from "../components/PaymentModal";
import Profile from "../components/Profile";
import Performance from "../components/Performance";
import ExamHistory from "../components/ExamHistory";
import Setting from "../components/Setting";
import Sidebar from "../components/Sidebar";
import { FaChartLine, FaTrophy, FaClipboardList, FaBars } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import baseApi from "../utils/baseApi";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UserStats {
  totalExams: number;
  highestScore: number;
  examsPassed: number;
}

interface Modal {
  profile: boolean;
  performance: boolean;
  examHistory: boolean;
  settings: boolean;
  payment: boolean;
}

interface ReferralData {
  referredCount: number;
  totalEarnings: number;
  earningsPerReferral: number;
  subscriptionFee: number;
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`skeleton-pulse rounded-lg ${className}`} />
);

// ─── Modal Shell ───────────────────────────────────────────────────────────────

const ModalShell: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ title, onClose, children, wide = false }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(10,14,26,0.72)", backdropFilter: "blur(8px)" }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-hidden flex flex-col`}
      style={{ animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "1.1rem", margin: 0 }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", color: "#6b7280", transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          aria-label="Close"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
    </div>
  </div>
);

// ─── Progress Ring ─────────────────────────────────────────────────────────────

const ProgressRing: React.FC<{ value: number; max: number; size?: number; color?: string }> = ({
  value, max, size = 56, color = "#66934e",
}) => {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - pct * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [user, setUser] = useState(auth?.user || null);
  const [loading, setLoading] = useState({
    user: true, stats: true, examTypes: true, subscriptions: true, referrals: true,
  });
  const [modals, setModals] = useState<Modal>({
    profile: false, performance: false, examHistory: false, settings: false, payment: false,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [referralData, setReferralData] = useState<ReferralData>({
    referredCount: 0, totalEarnings: 0, earningsPerReferral: 0, subscriptionFee: 2000,
  });
  const [stats, setStats] = useState<UserStats>({ totalExams: 0, highestScore: 0, examsPassed: 0 });
  const [examData, setExamData] = useState({
    availableTypes: [] as string[],
    subscribedTypes: [] as string[],
    selectedType: null as string | null,
  });
  const [copiedLink, setCopiedLink] = useState(false);

  const getToken = () => localStorage.getItem("accessToken");

  const apiRequest = useCallback(async (endpoint: string) => {
    try {
      const token = getToken();
      if (!token) throw new Error("No token");
      const res = await axios.get(`${baseApi}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: res.data };
    } catch (err) {
      console.error(`API ${endpoint}:`, err);
      return { success: false, error: err };
    }
  }, []);

  const toggleModal = (name: keyof Modal, value?: boolean) =>
    setModals(prev => ({ ...prev, [name]: value !== undefined ? value : !prev[name] }));

  useEffect(() => {
    if (auth?.user) {
      setUser(auth.user);
    } else {
      try {
        const s = localStorage.getItem("user");
        if (s) setUser(JSON.parse(s));
      } catch {}
    }
    setLoading(prev => ({ ...prev, user: false }));
  }, [auth?.user]);

  useEffect(() => {
    axios.get(`${baseApi}/exam/exam-types`)
      .then(res => setExamData(prev => ({ ...prev, availableTypes: res.data })))
      .catch(() => toast.error("Failed to load exam types."))
      .finally(() => setLoading(prev => ({ ...prev, examTypes: false })));
  }, []);

  useEffect(() => {
    if (!user) return;
    apiRequest("/subscription/payment-status").then(r => {
      if (r.success) setExamData(prev => ({ ...prev, subscribedTypes: r.data.subscribedExamTypes || [] }));
    }).finally(() => setLoading(prev => ({ ...prev, subscriptions: false })));
  }, [user, apiRequest]);

  useEffect(() => {
    apiRequest("/exam/stats").then(r => {
      if (r.success) setStats(r.data);
    }).finally(() => setLoading(prev => ({ ...prev, stats: false })));
  }, [apiRequest]);

  useEffect(() => {
    if (loading.user || !user) return;
    apiRequest("/referrals/referral-stats").then(r => {
      if (r.success) setReferralData({
        referredCount: r.data.referredCount || 0,
        totalEarnings: r.data.totalEarnings || 0,
        earningsPerReferral: r.data.earningsPerReferral || 0,
        subscriptionFee: r.data.subscriptionFee || 2000,
      });
    }).finally(() => setLoading(prev => ({ ...prev, referrals: false })));
  }, [loading.user, user, apiRequest]);

  const handleTakeExam = (t: string) => navigate(`/exams?examType=${t.toLowerCase()}`);
  const handleSubscribe = (t: string) => {
    setExamData(prev => ({ ...prev, selectedType: t }));
    toggleModal("payment", true);
  };
  const handleCopyLink = () => {
    if (!user?.email) return;
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.email}`).then(() => {
      setCopiedLink(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopiedLink(false), 2600);
    });
  };
  const handleFreeTest = () => {
    if (user) navigate("/olevel");
    else { toast.error("Please log in first."); navigate("/login"); }
  };

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  const passRate = stats.totalExams > 0
    ? Math.round((stats.examsPassed / stats.totalExams) * 100) : 0;

  const isL = (k: keyof typeof loading) => loading[k];

  // ─ Styles ─
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap');
    :root {
      --g: #66934e; --gd: #4d7039; --gl: #f0f7ec; --gm: #d4eac8;
      --navy: #0d1b2a; --navym: #1a2d42; --navyl: #243b55;
      --t1: #111827; --t2: #6b7280; --t3: #9ca3af;
      --bdr: #e5e7eb; --surf: #ffffff; --bg: #f5f7f9;
      --sh1: 0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);
      --sh2: 0 4px 16px rgba(0,0,0,0.08),0 2px 6px rgba(0,0,0,0.04);
      --sh3: 0 10px 40px rgba(0,0,0,0.1),0 4px 12px rgba(0,0,0,0.06);
      --rad: 16px; --rads: 10px; --tr: 0.2s cubic-bezier(0.4,0,0.2,1);
    }
    .db-root { display:flex; min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif; color:var(--t1); }

    /* Sidebar */
    .db-sidebar { width:260px; flex-shrink:0; background:var(--navy); position:fixed; inset-y:0; left:0; z-index:50; transform:translateX(-100%); transition:transform 0.3s cubic-bezier(0.4,0,0.2,1); box-shadow:4px 0 24px rgba(0,0,0,0.18); }
    .db-sidebar.open { transform:translateX(0); }
    @media(min-width:768px){ .db-sidebar { position:relative; transform:translateX(0); } }
    .db-overlay { position:fixed; inset:0; z-index:40; background:rgba(0,0,0,0.5); backdrop-filter:blur(3px); }

    /* Content */
    .db-content { flex:1; display:flex; flex-direction:column; min-width:0; overflow:hidden; }
    .db-header { background:var(--surf); border-bottom:1px solid var(--bdr); padding:0 24px; height:64px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:30; gap:16px; }
    .db-main { flex:1; overflow-y:auto; padding:28px 24px 48px; display:flex; flex-direction:column; gap:32px; }
    @media(max-width:640px){ .db-main { padding:18px 14px 36px; } }

    /* Header typography */
    .hdr-greet { font-weight:600; font-size:1rem; color:var(--t1); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .hdr-greet span { font-family:'Fraunces',serif; font-weight:600; color:var(--g); }

    /* Hamburger */
    .hbg { width:38px; height:38px; display:flex; align-items:center; justify-content:center; border-radius:var(--rads); background:transparent; border:none; cursor:pointer; color:var(--t2); transition:background var(--tr),color var(--tr); flex-shrink:0; }
    .hbg:hover { background:var(--gl); color:var(--g); }

    /* Buttons */
    .btn-p { display:inline-flex; align-items:center; justify-content:center; background:var(--g); color:#fff; font-family:'DM Sans',sans-serif; font-weight:600; font-size:.875rem; padding:9px 18px; border-radius:var(--rads); border:none; cursor:pointer; transition:background var(--tr),transform var(--tr),box-shadow var(--tr); box-shadow:0 2px 8px rgba(102,147,78,.28); white-space:nowrap; }
    .btn-p:hover { background:var(--gd); transform:translateY(-1px); box-shadow:0 4px 14px rgba(102,147,78,.38); }
    .btn-o { display:inline-flex; align-items:center; justify-content:center; background:transparent; color:var(--g); font-family:'DM Sans',sans-serif; font-weight:600; font-size:.875rem; padding:9px 18px; border-radius:var(--rads); border:1.5px solid var(--g); cursor:pointer; transition:background var(--tr),transform var(--tr); white-space:nowrap; }
    .btn-o:hover { background:var(--gl); transform:translateY(-1px); }
    .btn-gh { display:inline-flex; align-items:center; justify-content:center; background:var(--gl); color:var(--g); font-family:'DM Sans',sans-serif; font-weight:600; font-size:.875rem; padding:9px 20px; border-radius:var(--rads); border:none; cursor:pointer; transition:background var(--tr),transform var(--tr); white-space:nowrap; }
    .btn-gh:hover { background:var(--gm); transform:translateY(-1px); }
    .btn-w { background:#fff; color:var(--g); font-family:'DM Sans',sans-serif; font-weight:700; font-size:.875rem; padding:9px 20px; border-radius:var(--rads); border:none; cursor:pointer; transition:transform var(--tr),box-shadow var(--tr); white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,.1); }
    .btn-w:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.15); }

    /* Section */
    .sec-hdr { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:16px; gap:12px; flex-wrap:wrap; }
    .sec-title { font-family:'Fraunces',serif; font-weight:600; font-size:1.2rem; color:var(--t1); margin:0; }
    .sec-sub { font-size:.8rem; color:var(--t3); margin:2px 0 0; }

    /* Banner */
    .banner { background:linear-gradient(135deg,var(--g) 0%,#4d7039 100%); border-radius:var(--rad); padding:22px 28px; display:flex; align-items:center; justify-content:space-between; gap:16px; box-shadow:0 4px 20px rgba(102,147,78,.35); position:relative; overflow:hidden; flex-wrap:wrap; }
    .banner::before { content:''; position:absolute; width:280px; height:280px; background:radial-gradient(circle,rgba(255,255,255,.12) 0%,transparent 65%); right:-40px; top:-80px; pointer-events:none; }
    .banner-txt { position:relative; z-index:1; }
    .banner-title { font-family:'Fraunces',serif; font-size:1.1rem; font-weight:700; color:#fff; margin:0 0 4px; }
    .banner-sub { font-size:.82rem; color:rgba(255,255,255,.76); margin:0; }

    /* Stat tiles */
    .perf-row { display:grid; grid-template-columns:repeat(3,1fr) 1fr; gap:16px; align-items:stretch; }
    @media(max-width:900px){ .perf-row { grid-template-columns:1fr 1fr; } }
    @media(max-width:540px){ .perf-row { grid-template-columns:1fr; } }
    .stat-tile { background:var(--surf); border-radius:var(--rad); box-shadow:var(--sh1); border:1px solid var(--bdr); overflow:hidden; position:relative; transition:transform var(--tr),box-shadow var(--tr); }
    .stat-tile:hover { transform:translateY(-3px); box-shadow:var(--sh2); }
    .stat-inner { display:flex; align-items:flex-start; gap:14px; padding:20px; position:relative; z-index:1; }
    .stat-glow { position:absolute; inset:0; pointer-events:none; }
    .stat-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; transition:transform var(--tr); }
    .stat-tile:hover .stat-icon { transform:scale(1.08); }
    .stat-lbl { font-size:.74rem; font-weight:600; color:var(--t3); letter-spacing:.05em; text-transform:uppercase; margin:0; }
    .stat-val { font-family:'Fraunces',serif; font-size:1.75rem; font-weight:700; margin:3px 0 0; line-height:1; }
    .stat-meta { font-size:.74rem; color:var(--t3); margin:4px 0 0; }

    /* Pass rate dark card */
    .pass-card { background:linear-gradient(135deg,var(--navy) 0%,var(--navyl) 100%); border-radius:var(--rad); padding:20px; color:#fff; position:relative; overflow:hidden; }
    .pass-card::after { content:''; position:absolute; width:200px; height:200px; background:radial-gradient(circle,rgba(102,147,78,.25) 0%,transparent 70%); right:-40px; bottom:-60px; pointer-events:none; }
    .pass-lbl { font-size:.72rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:rgba(255,255,255,.5); margin:0 0 10px; }
    .pass-pct { font-family:'Fraunces',serif; font-size:.9rem; font-weight:700; color:#fff; }
    .pass-nums { font-weight:600; font-size:.95rem; margin:0 0 2px; }
    .pass-psub { font-size:.76rem; color:rgba(255,255,255,.58); margin:0; }

    /* Exam cards */
    .exam-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
    .exam-card { background:var(--surf); border-radius:var(--rad); border:1px solid var(--bdr); box-shadow:var(--sh1); display:flex; flex-direction:column; overflow:hidden; position:relative; transition:transform var(--tr),box-shadow var(--tr); }
    .exam-card:hover { transform:translateY(-3px); box-shadow:var(--sh2); }
    .exam-accent { height:4px; background:linear-gradient(90deg,var(--g) 0%,#85b35c 100%); }
    .exam-body { padding:18px 18px 12px; flex:1; }
    .exam-foot { padding:0 18px 18px; }
    .exam-icon { width:40px; height:40px; border-radius:10px; background:var(--gl); color:var(--g); display:flex; align-items:center; justify-content:center; }
    .exam-title { font-family:'Fraunces',serif; font-size:1rem; font-weight:600; margin:10px 0 5px; color:var(--t1); }
    .exam-desc { font-size:.78rem; color:var(--t3); margin:0; line-height:1.45; }
    .badge-sub { display:inline-flex; align-items:center; background:#d1fae5; color:#065f46; font-size:.7rem; font-weight:700; padding:3px 8px; border-radius:20px; letter-spacing:.03em; margin-bottom:10px; }

    /* Referral */
    .ref-grid { display:grid; grid-template-columns:2fr 1fr 1fr; gap:16px; }
    @media(max-width:800px){ .ref-grid { grid-template-columns:1fr; } }
    .ref-link-card { background:var(--surf); border:1px solid var(--bdr); border-radius:var(--rad); box-shadow:var(--sh1); padding:22px; }
    .ref-link-card h4 { font-family:'Fraunces',serif; font-weight:600; font-size:.95rem; margin:0 0 4px; color:var(--t1); }
    .ref-link-card p { font-size:.78rem; color:var(--t3); margin:0 0 14px; }
    .ref-row { display:flex; border:1.5px solid var(--bdr); border-radius:var(--rads); overflow:hidden; transition:border-color var(--tr); }
    .ref-row:focus-within { border-color:var(--g); }
    .ref-row input { flex:1; min-width:0; padding:9px 12px; font-size:.78rem; background:var(--bg); border:none; outline:none; color:var(--t2); font-family:'DM Sans',sans-serif; }
    .ref-row button { background:var(--g); color:#fff; border:none; cursor:pointer; padding:9px 14px; font-size:.8rem; font-weight:600; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:6px; transition:background var(--tr); flex-shrink:0; }
    .ref-row button:hover { background:var(--gd); }
    .ref-row button.copied { background:#065f46; }
    .ref-stat { background:var(--surf); border:1px solid var(--bdr); border-radius:var(--rad); box-shadow:var(--sh1); padding:22px; transition:transform var(--tr),box-shadow var(--tr); position:relative; overflow:hidden; }
    .ref-stat:hover { transform:translateY(-2px); box-shadow:var(--sh2); }
    .ref-stat h4 { font-size:.72rem; font-weight:600; letter-spacing:.05em; text-transform:uppercase; color:var(--t3); margin:0 0 10px; }
    .ref-big { font-family:'Fraunces',serif; font-size:1.9rem; font-weight:700; color:var(--g); margin:0 0 4px; line-height:1; }
    .ref-meta { font-size:.76rem; color:var(--t3); margin:0; }

    /* Skeleton */
    .skeleton-pulse { background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size:200% 100%; animation:shimmer 1.4s infinite linear; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Empty */
    .empty { grid-column:1/-1; background:var(--surf); border:1px dashed var(--bdr); border-radius:var(--rad); padding:40px 24px; text-align:center; }
    .empty p { color:var(--t3); font-size:.875rem; margin:6px 0 0; }

    /* Exam skeleton */
    .exam-skel { background:var(--surf); border:1px solid var(--bdr); border-radius:var(--rad); overflow:hidden; }

    /* Divider */
    .divider { border:none; border-top:1px solid var(--bdr); margin:0; }

    /* Modal */
    @keyframes modalIn { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
  `;

  return (
    <>
      <style>{css}</style>

      <div className="db-root">
        {/* ── Sidebar ── */}
        <div className={`db-sidebar ${isSidebarOpen ? "open" : ""}`}>
          <Sidebar
            openProfileModal={() => { toggleModal("profile", true); setIsSidebarOpen(false); }}
            openPerformanceModal={() => { toggleModal("performance", true); setIsSidebarOpen(false); }}
            openExamHistoryModal={() => { toggleModal("examHistory", true); setIsSidebarOpen(false); }}
            openSettingsModal={() => { toggleModal("settings", true); setIsSidebarOpen(false); }}
          />
        </div>

        {isSidebarOpen && (
          <div className="db-overlay" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* ── Main content ── */}
        <div className="db-content">

          {/* Header */}
          <header className="db-header">
            <button
              className="hbg"
              onClick={() => setIsSidebarOpen(v => !v)}
              aria-label="Toggle navigation"
              style={{ display: undefined }} // let CSS handle visibility per breakpoint
            >
              <FaBars size={17} />
            </button>

            <p className="hdr-greet">
              {isL("user") ? (
                <span style={{ color: "var(--t3)", fontWeight: 400 }}>Loading…</span>
              ) : (
                <>{greeting()}, <span>{user?.firstName || "there"}{user?.lastName ? ` ${user.lastName}` : ""}</span></>
              )}
            </p>

            <button className="btn-gh" onClick={handleFreeTest}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Free Test
            </button>
          </header>

          {/* Main */}
          <main className="db-main">

            {/* ── Banner ── */}
            <div className="banner">
              <div className="banner-txt">
                <p className="banner-title">Ready to practice?</p>
                <p className="banner-sub">
                  {examData.subscribedTypes.length > 0
                    ? `You have ${examData.subscribedTypes.length} active subscription${examData.subscribedTypes.length > 1 ? "s" : ""}. Jump back in anytime.`
                    : "Subscribe to an exam below and start preparing today."}
                </p>
              </div>
              {examData.subscribedTypes.length > 0 && (
                <button className="btn-w" onClick={() => handleTakeExam(examData.subscribedTypes[0])}>
                  Continue Studying →
                </button>
              )}
            </div>

            {/* ── Performance ── */}
            <section>
              <div className="sec-hdr">
                <div>
                  <h2 className="sec-title">Your Performance</h2>
                  <p className="sec-sub">Stats from all your exam attempts</p>
                </div>
              </div>

              <div className="perf-row">
                {/* Total exams */}
                <div className="stat-tile">
                  <div className="stat-inner">
                    <div className="stat-icon" style={{ background: "#f0f7ec", color: "#66934e" }}>
                      <FaChartLine size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="stat-lbl">Total Exams</p>
                      {isL("stats") ? <Skeleton className="h-7 w-16 mt-1" /> : (
                        <p className="stat-val" style={{ color: "#66934e" }}>{stats.totalExams}</p>
                      )}
                      <p className="stat-meta">All-time attempts</p>
                    </div>
                  </div>
                  <div className="stat-glow" style={{ background: "radial-gradient(circle at 80% 50%,rgba(102,147,78,.1) 0%,transparent 70%)" }} />
                </div>

                {/* Highest score */}
                <div className="stat-tile">
                  <div className="stat-inner">
                    <div className="stat-icon" style={{ background: "#fffbeb", color: "#d97706" }}>
                      <FaTrophy size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="stat-lbl">Highest Score</p>
                      {isL("stats") ? <Skeleton className="h-7 w-16 mt-1" /> : (
                        <p className="stat-val" style={{ color: "#d97706" }}>{stats.highestScore}%</p>
                      )}
                      <p className="stat-meta">Personal best</p>
                    </div>
                  </div>
                  <div className="stat-glow" style={{ background: "radial-gradient(circle at 80% 50%,rgba(217,119,6,.08) 0%,transparent 70%)" }} />
                </div>

                {/* Exams passed */}
                <div className="stat-tile">
                  <div className="stat-inner">
                    <div className="stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                      <FaClipboardList size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="stat-lbl">Exams Passed</p>
                      {isL("stats") ? <Skeleton className="h-7 w-16 mt-1" /> : (
                        <p className="stat-val" style={{ color: "#2563eb" }}>{stats.examsPassed}</p>
                      )}
                      <p className="stat-meta">≥ 50% threshold</p>
                    </div>
                  </div>
                  <div className="stat-glow" style={{ background: "radial-gradient(circle at 80% 50%,rgba(37,99,235,.08) 0%,transparent 70%)" }} />
                </div>

                {/* Pass rate dark card */}
                <div className="pass-card">
                  <p className="pass-lbl">Pass Rate</p>
                  {isL("stats") ? (
                    <Skeleton className="w-14 h-14 rounded-full" />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
                      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ProgressRing value={stats.examsPassed} max={stats.totalExams} />
                        <span className="pass-pct" style={{ position: "absolute" }}>{passRate}%</span>
                      </div>
                      <div>
                        <p className="pass-nums">{stats.examsPassed} / {stats.totalExams}</p>
                        <p className="pass-psub">
                          {passRate >= 70 ? "Excellent!" : passRate >= 50 ? "Good progress!" : "Keep going!"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <hr className="divider" />

            {/* ── Available Exams ── */}
            <section>
              <div className="sec-hdr">
                <div>
                  <h2 className="sec-title">Available Exams</h2>
                  <p className="sec-sub">Subscribe to unlock full past question access</p>
                </div>
              </div>

              <div className="exam-grid">
                {isL("examTypes") ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="exam-skel">
                      <div style={{ height: 4, background: "var(--bdr)" }} />
                      <div style={{ padding: 18 }}>
                        <Skeleton className="h-10 w-10 mb-3" />
                        <Skeleton className="h-5 w-28 mb-2" />
                        <Skeleton className="h-3 w-36 mb-5" />
                        <Skeleton className="h-9 w-full" />
                      </div>
                    </div>
                  ))
                ) : examData.availableTypes.length === 0 ? (
                  <div className="empty">
                    <div style={{ fontSize: "1.8rem" }}>📋</div>
                    <p>No exam types available at this time.</p>
                  </div>
                ) : (
                  examData.availableTypes.map(t => {
                    const subscribed = examData.subscribedTypes.includes(t);
                    return (
                      <div key={t} className="exam-card">
                        <div className="exam-accent" />
                        <div className="exam-body">
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                            <div className="exam-icon">
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            {subscribed && (
                              <span className="badge-sub">
                                <svg width="9" height="9" fill="currentColor" viewBox="0 0 20 20" style={{ marginRight: 4 }}>
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Active
                              </span>
                            )}
                          </div>
                          <h3 className="exam-title">{t}</h3>
                          <p className="exam-desc">
                            {subscribed ? "Full access to past questions." : "Subscribe to unlock past questions."}
                          </p>
                        </div>
                        <div className="exam-foot">
                          {subscribed ? (
                            <button className="btn-p" style={{ width: "100%" }} onClick={() => handleTakeExam(t)}>
                              Start Exam
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginLeft: 6 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </button>
                          ) : (
                            <button className="btn-o" style={{ width: "100%" }} onClick={() => handleSubscribe(t)}>
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Subscribe — ₦2,000
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <hr className="divider" />

            {/* ── Referral ── */}
            {!isL("user") && user && (
              <section>
                <div className="sec-hdr">
                  <div>
                    <h2 className="sec-title">Referral Program</h2>
                    <p className="sec-sub">
                      Earn ₦{referralData.earningsPerReferral.toLocaleString()} for every friend who subscribes
                    </p>
                  </div>
                </div>

                <div className="ref-grid">
                  {/* Link card */}
                  <div className="ref-link-card">
                    <h4>Your Referral Link</h4>
                    <p>Share this link — you'll earn a commission on every new subscription.</p>
                    <div className="ref-row">
                      <input
                        type="text"
                        value={`${window.location.origin}/register?ref=${user.email}`}
                        readOnly
                        aria-label="Your referral link"
                      />
                      <button
                        onClick={handleCopyLink}
                        className={copiedLink ? "copied" : ""}
                        aria-label="Copy referral link"
                      >
                        {copiedLink ? (
                          <>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Link
                          </>
                        )}
                      </button>
                    </div>
                    <p style={{ marginTop: 10, fontSize: ".75rem", color: "var(--t3)" }}>
                      You earn 5% (₦{referralData.earningsPerReferral.toLocaleString()}) of each ₦{referralData.subscriptionFee.toLocaleString()} subscription fee.
                    </p>
                  </div>

                  {/* Referral count */}
                  <div className="ref-stat">
                    <h4>Total Referrals</h4>
                    {isL("referrals") ? (
                      <><Skeleton className="h-9 w-16 mb-2" /><Skeleton className="h-3 w-28" /></>
                    ) : (
                      <>
                        <p className="ref-big">{referralData.referredCount}</p>
                        <p className="ref-meta">
                          {referralData.referredCount === 0
                            ? "No referrals yet — share your link!"
                            : `${referralData.referredCount} successful referral${referralData.referredCount > 1 ? "s" : ""}`}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Earnings */}
                  <div className="ref-stat">
                    <h4>Total Earnings</h4>
                    {isL("referrals") ? (
                      <><Skeleton className="h-9 w-24 mb-2" /><Skeleton className="h-3 w-28" /></>
                    ) : (
                      <>
                        <p className="ref-big">₦{referralData.totalEarnings.toLocaleString("en-NG", { minimumFractionDigits: 0 })}</p>
                        <p className="ref-meta">
                          {referralData.totalEarnings === 0 ? "Start referring to earn" : "Lifetime referral earnings"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </section>
            )}

          </main>
        </div>

        {/* ── Modals ── */}
        {modals.profile && (
          <ModalShell title="My Profile" onClose={() => toggleModal("profile", false)}>
            <Profile />
          </ModalShell>
        )}
        {modals.performance && (
          <ModalShell title="Performance Metrics" wide onClose={() => toggleModal("performance", false)}>
            <Performance />
          </ModalShell>
        )}
        {modals.examHistory && (
          <ModalShell title="Exam History" wide onClose={() => toggleModal("examHistory", false)}>
            <ExamHistory />
          </ModalShell>
        )}
        {modals.settings && (
          <ModalShell title="Account Settings" onClose={() => toggleModal("settings", false)}>
            <Setting />
          </ModalShell>
        )}
        {modals.payment && examData.selectedType && (
          <PaymentModal
            email={user?.email || ""}
            examType={examData.selectedType}
            onClose={() => toggleModal("payment", false)}
            onSuccess={() => {
              setExamData(prev => ({
                ...prev,
                subscribedTypes: [...prev.subscribedTypes, examData.selectedType!],
              }));
              toast.success(`Subscribed to ${examData.selectedType}!`);
              toggleModal("payment", false);
            }}
          />
        )}

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </>
  );
};

export default Dashboard;
