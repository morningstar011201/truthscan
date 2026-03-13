import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/"; return; }
      setUser(session.user);
      fetchProfile(session.user.id);
    });
  }, []);

  async function fetchProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) {
      setProfile(data);
      setFullName(data.full_name || "");
      setUsername(data.username || "");
      setDob(data.dob || "");
    }
    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    setMsg("");
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      username: username,
      dob: dob,
      updated_at: new Date().toISOString()
    }).eq("id", user.id);
    if (error) { setMsg("❌ " + error.message); setMsgType("error"); }
    else { setMsg("✅ Profile updated successfully!"); setMsgType("success"); }
    setSaving(false);
  }

  async function changePassword() {
    if (!newPassword) { setMsg("❌ Enter a new password!"); setMsgType("error"); return; }
    if (newPassword !== confirmPassword) { setMsg("❌ Passwords don't match!"); setMsgType("error"); return; }
    if (newPassword.length < 6) { setMsg("❌ Password must be at least 6 characters!"); setMsgType("error"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setMsg("❌ " + error.message); setMsgType("error"); }
    else { setMsg("✅ Password changed successfully!"); setMsgType("success"); setNewPassword(""); setConfirmPassword(""); }
    setSaving(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const styles = {
    page: { minHeight: "100vh", background: "#060a12", color: "#e0e8f0", fontFamily: "'Courier New', monospace", padding: "0 0 60px 0" },
    header: { background: "rgba(0,255,224,0.03)", borderBottom: "1px solid rgba(0,255,224,0.1)", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { fontSize: 18, fontWeight: 900, letterSpacing: 3, color: "#fff", cursor: "pointer" },
    logoSpan: { color: "#00ffe0" },
    backBtn: { background: "transparent", border: "1px solid rgba(0,255,224,0.2)", color: "#00ffe0", padding: "7px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, letterSpacing: 1 },
    container: { maxWidth: 580, margin: "0 auto", padding: "32px 20px" },
    avatar: { width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #0a4a42, #0a2a4a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: "#060a12", margin: "0 auto 16px", border: "3px solid rgba(0,255,224,0.3)" },
    emailBadge: { textAlign: "center", marginBottom: 32 },
    emailText: { fontSize: 13, color: "#00ffe0", background: "rgba(0,255,224,0.07)", padding: "6px 18px", borderRadius: 20, display: "inline-block", border: "1px solid rgba(0,255,224,0.15)" },
    planBadge: { fontSize: 11, color: "#888", marginTop: 6 },
    card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,255,224,0.1)", borderRadius: 16, padding: "24px 24px 20px", marginBottom: 20 },
    cardTitle: { fontSize: 11, letterSpacing: 3, color: "#00ffe0", textTransform: "uppercase", marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid rgba(0,255,224,0.08)" },
    label: { fontSize: 10, letterSpacing: 2, color: "#556070", textTransform: "uppercase", marginBottom: 6, display: "block" },
    input: { width: "100%", background: "rgba(0,255,224,0.04)", border: "1px solid rgba(0,255,224,0.12)", borderRadius: 10, padding: "11px 14px", color: "#e0e8f0", fontSize: 13, fontFamily: "'Courier New', monospace", outline: "none", boxSizing: "border-box", marginBottom: 16 },
    inputDisabled: { width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "11px 14px", color: "#445060", fontSize: 13, fontFamily: "'Courier New', monospace", outline: "none", boxSizing: "border-box", marginBottom: 16, cursor: "not-allowed" },
    passWrap: { position: "relative", marginBottom: 16 },
    passInput: { width: "100%", background: "rgba(0,255,224,0.04)", border: "1px solid rgba(0,255,224,0.12)", borderRadius: 10, padding: "11px 40px 11px 14px", color: "#e0e8f0", fontSize: 13, fontFamily: "'Courier New', monospace", outline: "none", boxSizing: "border-box" },
    eyeBtn: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#556070", cursor: "pointer", fontSize: 14 },
    saveBtn: { width: "100%", background: "linear-gradient(135deg, #00ffe0, #00b8a0)", border: "none", borderRadius: 10, padding: "13px", color: "#060a12", fontSize: 13, fontWeight: 900, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase" },
    saveBtnDisabled: { width: "100%", background: "rgba(0,255,224,0.1)", border: "none", borderRadius: 10, padding: "13px", color: "#445060", fontSize: 13, fontWeight: 900, letterSpacing: 2, cursor: "not-allowed", textTransform: "uppercase" },
    msg: { padding: "10px 14px", borderRadius: 10, fontSize: 12, marginTop: 12, textAlign: "center" },
    msgSuccess: { background: "rgba(0,255,100,0.08)", border: "1px solid rgba(0,255,100,0.2)", color: "#00ff88" },
    msgError: { background: "rgba(255,61,110,0.08)", border: "1px solid rgba(255,61,110,0.2)", color: "#ff3d6e" },
    signOutBtn: { width: "100%", background: "transparent", border: "1px solid rgba(255,61,110,0.3)", borderRadius: 10, padding: "12px", color: "#ff3d6e", fontSize: 12, fontWeight: 700, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase" },
    statsRow: { display: "flex", gap: 12 },
    statBox: { flex: 1, background: "rgba(0,255,224,0.04)", border: "1px solid rgba(0,255,224,0.08)", borderRadius: 10, padding: "14px 12px", textAlign: "center" },
    statNum: { fontSize: 24, fontWeight: 900, color: "#00ffe0" },
    statLabel: { fontSize: 10, color: "#556070", letterSpacing: 1, marginTop: 4 },
  };

  if (loading) return (
    <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#00ffe0", fontSize: 13, letterSpacing: 3 }}>LOADING...</div>
    </div>
  );

  const initial = (user?.email?.[0] || "?").toUpperCase();

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.logo} onClick={() => window.location.href = "/"}>
          TRUTH<span style={styles.logoSpan}>SCAN</span>
        </div>
        <button style={styles.backBtn} onClick={() => window.location.href = "/"}>← BACK</button>
      </div>

      <div style={styles.container}>
        {/* Avatar */}
        <div style={styles.avatar}>{initial}</div>
        <div style={styles.emailBadge}>
          <div style={styles.emailText}>{user?.email}</div>
          <div style={styles.planBadge}>
            {profile?.plan === "free" ? "FREE PLAN" : `${(profile?.plan || "").toUpperCase()} PLAN`}
          </div>
        </div>

        {/* Stats */}
        <div style={{ ...styles.card, marginBottom: 20 }}>
          <div style={styles.cardTitle}>Your Stats</div>
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <div style={styles.statNum}>{profile?.total_scans || 0}</div>
              <div style={styles.statLabel}>TOTAL SCANS</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ ...styles.statNum, color: profile?.plan === "free" ? "#ff3d6e" : "#00ffe0" }}>
                {profile?.plan === "free" ? "FREE" : (profile?.plan || "FREE").toUpperCase()}
              </div>
              <div style={styles.statLabel}>CURRENT PLAN</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNum}>
                {(() => {
                  const today = new Date().toISOString().split("T")[0];
                  const isNewDay = profile?.last_scan_date !== today;
                 const LIMITS = { free: 1, daily: 10, basic: 100, standard: 250, pro: 750 };
                const limit = LIMITS[profile?.plan] || 1;
                const used = isNewDay ? 0 : (profile?.daily_scans_used || 0);
                return Math.max(0, limit - used);
                })()}
              </div>
              <div style={styles.statLabel}>SCANS LEFT</div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Profile Info</div>
          <label style={styles.label}>Email (cannot change)</label>
          <input style={styles.inputDisabled} value={user?.email || ""} disabled />
          <label style={styles.label}>Full Name</label>
          <input style={styles.input} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" />
          <label style={styles.label}>Username</label>
          <input style={styles.input} value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" />
          <label style={styles.label}>Date of Birth</label>
          <input style={styles.input} type="date" value={dob} onChange={e => setDob(e.target.value)} />
          <button style={saving ? styles.saveBtnDisabled : styles.saveBtn} onClick={saveProfile} disabled={saving}>
            {saving ? "SAVING..." : "SAVE CHANGES"}
          </button>
          {msg && <div style={{ ...styles.msg, ...(msgType === "success" ? styles.msgSuccess : styles.msgError) }}>{msg}</div>}
        </div>

        {/* Change Password */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Change Password</div>
          <label style={styles.label}>New Password</label>
          <div style={styles.passWrap}>
            <input style={styles.passInput} type={showPass ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
            <button style={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>{showPass ? "🙈" : "👁️"}</button>
          </div>
          <label style={styles.label}>Confirm Password</label>
          <div style={styles.passWrap}>
            <input style={styles.passInput} type={showPass ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" />
          </div>
          <button style={saving ? styles.saveBtnDisabled : styles.saveBtn} onClick={changePassword} disabled={saving}>
            {saving ? "UPDATING..." : "CHANGE PASSWORD"}
          </button>
        </div>

        {/* Sign Out */}
        <button style={styles.signOutBtn} onClick={signOut}>🚪 SIGN OUT</button>
      </div>
    </div>
  );
}
