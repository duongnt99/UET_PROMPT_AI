// PromptOff.jsx — AI Arena Vietnam 2026
// Pixel-perfect sync from Figma frame 6420:2
import React from "react";
import imgHeroHeadline from "./assets/AI Arena VN.png";
import imgSwagKit from "./assets/SWAG Kit.png";
import imgBgTexture from "./assets/imgBgTexture.png";
import imgBadgeTech from "./assets/imgBadgeTech.png";
import imgBadgeRed from "./assets/imgBadgeRed.png";
import imgBadgeYellow from "./assets/imgBadgeYellow.png";
import imgOverlayCard from "./assets/imgOverlayCard.png";
import imgLogoVnu from "./assets/imgLogoVnu.png";
import imgLogoGoogle from "./assets/imgLogoGoogle.png";
import imgIconSprint from "./assets/imgIconSprint.png";
import imgIconPitch from "./assets/imgIconPitch.png";
import imgIconVerdict from "./assets/imgIconVerdict.png";
import imgIconTwist from "./assets/imgIconTwist.png";
import imgChevron from "./assets/imgChevron.png";
import imgLogoVnuLg from "./assets/imgLogoVnuLg.png";
import imgLogoUet from "./assets/imgLogoUet.png";
import imgOverlaySvg from "./assets/imgOverlaySvg.svg";

// ─── ASSETS ───────────────────────────────────────────────────────────────
// Images have been downloaded to local assets folder.

// ─── TOKENS ───────────────────────────────────────────────────────────────
const BLUE = "#4285f4";
const RED = "#db4437";
const YELLOW = "#f4b400";
const GREEN = "#0f9d58";
const DARK = "#1c1b1b";
const GRAY = "#424753";
const GRADIENT = `linear-gradient(90deg, ${RED} 12.019%, ${YELLOW} 41.827%, ${GREEN} 73.558%, ${BLUE} 99.519%)`;

// Figma canvas: 1528px wide, content at padding 80px → content width = 1368px
// We scale this with a max-width container

// ─── BACKGROUND ───────────────────────────────────────────────────────────
function Background() {
  return (
    <div aria-hidden style={{
      position: "fixed", inset: 0, zIndex: 0,
      pointerEvents: "none", overflow: "hidden",
      background: "#fcf9f8",
    }}>
      <img alt="" src={imgBgTexture} style={{
        position: "absolute", inset: "0 0 0 2px",
        width: "100%", height: "100%",
        objectFit: "cover", opacity: 0.1,
      }} />
      {/* Soft blobs */}
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "rgba(66,133,244,0.15)", filter: "blur(50px)", left: -160, top: -160 }} />
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "rgba(219,68,55,0.1)", filter: "blur(50px)", right: -80, top: 200 }} />
      <div style={{ position: "absolute", width: 550, height: 550, borderRadius: "50%", background: "rgba(244,180,0,0.15)", filter: "blur(50px)", left: -160, top: 533 }} />
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "rgba(15,157,88,0.1)", filter: "blur(50px)", right: 0, bottom: 0 }} />
      {/* Orbit rings */}
      <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", border: "1px dashed rgba(66,133,244,0.1)", right: 128, top: 80 }} />
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", border: "1px dashed rgba(244,180,0,0.1)", right: 192, top: 160 }} />
      {/* Blue tech badge - top right */}
      <div style={{ position: "absolute", top: 115, right: 193, transform: "rotate(12deg)" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "linear-gradient(45deg,#4285f4,#d8e2ff)",
          border: "0.8px solid rgba(255,255,255,.4)", backdropFilter: "blur(2px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0.8, boxShadow: "0 20px 25px -5px rgba(0,0,0,.1)",
        }}>
          <img alt="" src={imgBadgeTech} style={{ width: 25, height: 15 }} />
        </div>
      </div>
      {/* Red badge - left */}
      <div style={{
        position: "absolute", top: 338, left: -27,
        width: 80, height: 80, borderRadius: "50%",
        background: "linear-gradient(225deg,#db4437,#ffdad5)",
        opacity: 0.6, display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(6px)", boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)",
      }}>
        <img alt="" src={imgBadgeRed} style={{ width: 27, height: 27 }} />
      </div>
      {/* Yellow badge - bottom right */}
      <div style={{ position: "absolute", bottom: 124, right: 46, transform: "rotate(-12deg)" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 48,
          background: "linear-gradient(135deg,#f4b400,#ffdea3)",
          opacity: 0.7, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,.1)",
        }}>
          <img alt="" src={imgBadgeYellow} style={{ width: 20, height: 16 }} />
        </div>
      </div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────
// Figma: h=68, logo x=0..299, links centered, CTA right
function Nav() {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, zIndex: 50,
      width: "100%", height: 68,
      display: "flex", alignItems: "center",
      padding: "0 52px",
      backdropFilter: "blur(6px)",
      backgroundColor: "rgba(255,255,255,0.7)",
      boxShadow: "0 1px 2px rgba(0,0,0,.05)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", maxWidth: 1280, margin: "0 auto",
      }}>
        {/* Brand group: Logo text + Partner logos */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Logo gradient */}
          <a href="#" style={{ textDecoration: "none", flexShrink: 0 }}>
            <span style={{
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 800, fontSize: 26, lineHeight: "40px",
              background: GRADIENT,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              whiteSpace: "nowrap",
            }}>AI Arena: Vietnam 2026</span>
          </a>
          {/* Partner logos */}
          <div style={{
            display: "flex", alignItems: "center", gap: 0,
            flexShrink: 0,
            height: 40,
            background: "rgba(255,255,255,0.85)",
            border: "0.8px solid rgba(0,0,0,0.08)",
            borderRadius: 9999,
            padding: "0 10px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            <img alt="VNU" src={imgLogoVnu} style={{ height: 28, width: 70, objectFit: "contain" }} />
            <div style={{ width: 1, height: 22, background: "rgba(0,0,0,0.12)", margin: "0 8px" }} />
            <img alt="Google" src={imgLogoGoogle} style={{ height: 22, width: 62, objectFit: "contain" }} />
          </div>
        </div>
        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[
            { label: "Giới thiệu", href: "#intro", active: true },
            { label: "Lịch trình", href: "#schedule" },
            { label: "Tiêu chí chấm điểm", href: "#criteria" },
            { label: "FAQ", href: "#faq" },
          ].map(({ label, href, active }) => (
            <a key={label} href={href} style={{
              fontFamily: "'Hanken Grotesk',sans-serif",
              fontWeight: 600, fontSize: 14, letterSpacing: "0.7px",
              color: active ? BLUE : GRAY,
              textDecoration: "none",
              borderBottom: active ? `1.6px solid ${BLUE}` : "none",
              paddingBottom: active ? 4 : 0,
              whiteSpace: "nowrap",
            }}>{label}</a>
          ))}
        </div>
        {/* CTA */}
        <a href="#register" style={{
          fontFamily: "'Hanken Grotesk',sans-serif",
          fontWeight: 600, fontSize: 14, letterSpacing: "0.7px",
          color: "#fff", textDecoration: "none", flexShrink: 0,
          background: BLUE, padding: "12px 24px", borderRadius: 9999,
          boxShadow: "0 4px 6px -1px rgba(66,133,244,.3),0 2px 4px -2px rgba(66,133,244,.3)",
          whiteSpace: "nowrap",
        }}>Đăng ký ngay</a>
      </div>
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────
// Figma HeroSection: w=1528, h=657
//   - Headline image:    x=95,  y=57,  w=923, h=118
//   - Logo pill:         x=1086, y=83,  w=347, h=78
//   - Description texts: x=99,  y=210, w=919
//   - Glass card:        x=1085, y=210, w=346, h=345
//   - CTA container:     x=-17, y=-20 (relative to InfoSection overlap), but visually
//                        it's the group 6420:71 at InfoSection y=537-20=517 offset
//   Figma CTA buttons (node 6420:71): Container w=1146, h=128
//     - Thể lệ:    w=140, h=58 → font 25px
//     - Nộp d.á.:  w=275, h=58 → font 25px
//     - Hướng dẫn: w=425, h=53 → font 25px
function HeroSection() {
  return (
    <section id="intro" style={{
      position: "relative", zIndex: 1,
      width: "100%", marginTop: 68,
      // Use a relative layout matching Figma's 1528px canvas scaled to viewport
    }}>
      <div style={{
        position: "relative",
        maxWidth: 1528,
        margin: "0 auto",
        padding: "57px clamp(16px,5.2vw,95px) 0",
      }}>
        <div className="hero-flex" style={{ display: "flex", gap: "clamp(24px,4.2vw,64px)", alignItems: "flex-start" }}>

          {/* LEFT column: spans x=95..1018 in 1528 canvas ≈ 61.4% */}
          <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column" }}>

            {/* Headline image (x=95, y=57, w=923, h=118) */}
            <img
              className="hero-headline"
              alt="AI Arena Vietnam 2026"
              src={imgHeroHeadline}
              style={{
                width: "100%", maxWidth: 923, height: "auto",
                display: "block", marginBottom: 24, marginLeft: -36,
                // In Figma: headline starts at y=57, logo pill at y=83
                // Logo pill overlaps headline top-right area
                // We show headline first then description
              }}
            />

            {/* Description (x=99, y=210 → after headline+pill) */}
            <div style={{ maxWidth: 900 }}>
              {[
                <>Cuộc thi ứng dụng AI do Đại học Quốc gia Hà Nội (ĐHQGHN) triển khai, Trường Đại học Công nghệ (VNU-UET) làm đầu mối phối hợp cùng Google tổ chức. Đây là sân chơi công nghệ cho các bạn sinh viên trên toàn quốc, mở ra cơ hội thực chiến giải quyết các bài toán thực tế thông qua kỹ năng Natural Language Entrepreneurship trên nền tảng hai công cụ chính thức: <strong>Google Gemini</strong> và <strong>Google AI Studio</strong>.</>,
                <>Hành trình trải nghiệm bắt đầu từ Vòng tuyển chọn trực tuyến nhằm tìm kiếm 8 đội thi xuất sắc nhất bước vào Vòng Chung kết. Tại vòng đấu quyết định này, 8 đội sẽ trực tiếp tranh tài trên sân khấu để tìm ra nhà vô địch.</>,
                <>Vòng Chung kết sẽ diễn ra vào ngày <strong>03/11/2026</strong> tại <strong>Đại học Quốc gia Hà Nội</strong><em> (144 Xuân Thủy, Cầu Giấy, Hà Nội)</em>.</>,
              ].map((p, i) => (
                <p key={i} style={{
                  fontFamily: "'Hanken Grotesk',sans-serif",
                  fontWeight: 400, fontSize: "clamp(14px,1.2vw,18px)", lineHeight: "32px",
                  color: "#062f73", textAlign: "justify", margin: 0,
                  marginBottom: i < 2 ? 16 : 0,
                }}>{p}</p>
              ))}
            </div>

            {/* CTA buttons — căn trái với content */}
            <div style={{
              display: "flex", gap: 16, alignItems: "center",
              padding: "clamp(24px,3.1vw,48px) 0 clamp(32px,4.2vw,64px)",
              flexWrap: "wrap",
            }}>
              <a href="#rules" style={{
                fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800,
                fontSize: 20, letterSpacing: "0.7px",
                color: "#fff", textDecoration: "none",
                background: RED, padding: "14px 28px",
                borderRadius: 9999, border: "0.8px solid rgba(255,255,255,.2)",
                whiteSpace: "nowrap", display: "inline-block",
              }}>Thể lệ</a>
              <a href="https://ai-arena-vietnam.uet.edu.vn/tin-tuc/huong-dan-dang-ky-va-audition"
                target="_blank" rel="noreferrer"
                style={{
                  fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800,
                  fontSize: 20, letterSpacing: "0.7px",
                  color: "#fff", textDecoration: "underline",
                  background: BLUE, padding: "14px 28px",
                  borderRadius: 9999,
                  boxShadow: "0 4px 6px -1px rgba(66,133,244,.3),0 2px 4px -2px rgba(66,133,244,.3)",
                  whiteSpace: "nowrap", display: "inline-block",
                }}>Hướng dẫn đăng ký và nộp bài</a>
              <a href="#submit" style={{
                fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800,
                fontSize: 20, letterSpacing: "0.7px",
                color: "#fff", textDecoration: "none",
                background: GREEN, padding: "14px 28px",
                borderRadius: 9999, border: "0.8px solid rgba(255,255,255,.2)",
                whiteSpace: "nowrap", display: "inline-block",
              }}>Nộp dự án vòng 1</a>
            </div>

          </div>


          {/* RIGHT column: glass card */}
          <div className="hero-right-col" style={{
            flexShrink: 0,
            width: "clamp(240px,22.7vw,347px)",
            display: "flex", flexDirection: "column",
            marginTop: "clamp(40px, 8vw, 80px)",
          }}>

            {/* Glass card (x=1085, y=210, w=346, h=345) */}
            <div style={{
              aspectRatio: "1 / 1", width: "100%",
              backdropFilter: "blur(8px)", background: "rgba(255,255,255,.85)",
              border: "0.8px solid rgba(255,255,255,.5)",
              borderRadius: 40, boxShadow: "0 25px 50px -12px rgba(0,0,0,.25)",
              overflow: "hidden", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: 40,
                background: "linear-gradient(45deg,rgba(232,240,254,.4),rgba(230,244,234,.2) 50%,rgba(252,232,230,.2))",
              }} />
              <div style={{
                position: "absolute", right: -16, top: 40, width: 46, height: 47,
              }}>
                <img alt="" src={imgOverlayCard} style={{ width: "100%", height: "100%" }} />
              </div>
              <img alt="" src={imgOverlaySvg} style={{ opacity: 0.15, width: 120, height: 120, position: "absolute", zIndex: 1 }} />
              <img alt="SWAG Kit" src={imgSwagKit} style={{ width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 2 }} />
            </div>
            
            {/* Caption */}
            <div style={{
              marginTop: 20,
              padding: "12px 16px",
              background: "linear-gradient(135deg, #e8f0fe 0%, #fef7e0 100%)",
              border: "1px solid rgba(66,133,244,0.3)",
              borderRadius: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <p style={{
                fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800,
                fontSize: "clamp(13px, 1.2vw, 15px)", lineHeight: "22px", 
                color: "#1a73e8",
                textAlign: "center", margin: 0,
              }}>
                🎁 Các thành viên 8 đội vào chung kết sẽ nhận được Bộ quà tặng của Google
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SCHEDULE ─────────────────────────────────────────────────────────────
const bodyTxt = {
  fontFamily: "'Plus Jakarta Sans',sans-serif",
  fontWeight: 400,
  fontSize: 13.5,
  lineHeight: "21px",
  color: "#475569",
  margin: 0,
};

function ScheduleSection() {
  const phases = [
    {
      color: BLUE,
      bgBadge: "#eef3fb",
      badgeColor: "#1a73e8",
      date: "15/09/2026",
      title: "PHÁT ĐỘNG & MỞ ĐƠN",
      above: true,
      bgGradient: "linear-gradient(157.9deg,#fff 0%,rgba(240,253,250,.4) 100%)",
      body: (
        <p style={bodyTxt}>
          Phát động cuộc thi và mở cổng đăng ký tham gia trực tuyến cho các sinh viên trên toàn quốc.
        </p>
      ),
    },
    {
      color: RED,
      bgBadge: "#fff3f2",
      badgeColor: RED,
      date: "15/09 – 05/10/2026",
      title: "VÒNG TUYỂN CHỌN",
      above: false,
      bgGradient: "linear-gradient(208.5deg,#fff 0%,rgba(244,224,222,.4) 100%)",
      body: (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 5 }}>
          <li style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ color: RED, fontWeight: 700, flexShrink: 0, fontSize: 14, lineHeight: "21px" }}>•</span>
            <span style={bodyTxt}>Đăng ký trực tuyến trên website.</span>
          </li>
          <li style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ color: RED, fontWeight: 700, flexShrink: 0, fontSize: 14, lineHeight: "21px" }}>•</span>
            <span style={bodyTxt}>
              Nộp video &amp; thử thách vibe coding với<br />
              <strong>Google Gemini và Google AI Studio</strong>.
            </span>
          </li>
          <li style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ color: RED, fontWeight: 700, flexShrink: 0, fontSize: 14, lineHeight: "21px" }}>•</span>
            <span style={bodyTxt}>
              <strong>Top 8 đội xuất sắc nhất</strong> tiến vào Chung kết.
            </span>
          </li>
        </ul>
      ),
    },
    {
      color: YELLOW,
      bgBadge: "#fff1f2",
      badgeColor: "#b06000",
      date: "06/10 – 14/10/2026",
      title: (
        <>
          CÔNG BỐ DANH SÁCH CÁC ĐỘI VÀO VÒNG CHUNG KẾT
        </>
      ),
      above: true,
      bgGradient: "linear-gradient(159deg,#fff 0%,rgba(255,241,242,.4) 100%)",
      body: (
        <p style={bodyTxt}>
          Công bố 8 đội thi xuất sắc vào vòng Chung kết
        </p>
      ),
    },
    {
      color: GREEN,
      bgBadge: "#c6fee3",
      badgeColor: "#0f9d58",
      date: "03/11/2026",
      title: "CHUNG KẾT & TRAO GIẢI",
      above: false,
      bgGradient: "linear-gradient(148.5deg,#fff 0%,rgba(236,253,245,.5) 100%)",
      body: (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 5 }}>
          <li style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ color: "#059669", fontWeight: 700, flexShrink: 0, fontSize: 14, lineHeight: "21px" }}>•</span>
            <span style={bodyTxt}>
              <strong>Địa điểm:</strong> Đại học Quốc gia Hà Nội<br />
              <em>(144 Xuân Thủy, Cầu Giấy, Hà Nội)</em>
            </span>
          </li>
          <li style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ color: "#059669", fontWeight: 700, flexShrink: 0, fontSize: 14, lineHeight: "21px" }}>•</span>
            <span style={bodyTxt}>8 đội sẽ tranh tài trực tiếp</span>
          </li>
        </ul>
      ),
    },
  ];

  const renderCard = (phase) => (
    <div className="timeline-card" style={{
      width: "100%",
      maxWidth: 480,
      display: "flex",
      flexDirection: "column",
      gap: 7,
      borderRadius: 16,
      padding: "16px 20px",
      background: phase.bgGradient || "#fff",
      border: `1px solid ${phase.color}`,
      boxShadow: "0 1px 2px rgba(0,0,0,.05)",
      boxSizing: "border-box",
    }}>
      {/* Date Badge */}
      <span style={{
        display: "inline-block",
        alignSelf: "flex-start",
        background: phase.bgBadge || "#fff",
        border: `1px solid ${phase.color}`,
        borderRadius: 8,
        padding: "4px 10px",
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: "0.5px",
        color: phase.badgeColor || phase.color,
      }}>
        {phase.date}
      </span>

      {/* Title */}
      <p style={{
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        fontWeight: 800,
        fontSize: 17,
        lineHeight: "26px",
        letterSpacing: "-0.4px",
        color: "#1e293b",
        margin: 0,
      }}>
        {phase.title}
      </p>

      {/* Body Content */}
      <div>
        {phase.body}
      </div>
    </div>
  );

  return (
    <section id="schedule" style={{ position: "relative", zIndex: 1, width: "100%", padding: "40px clamp(16px,16.8vw,256px) 60px" }}>
      <style>{`
        @media (min-width: 961px) {
          .timeline-desktop {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: auto 32px 24px 32px auto;
            gap: 0 clamp(10px, 1.5vw, 24px);
            position: relative;
            max-width: 1500px;
            margin: 0 auto;
          }
          .timeline-mobile {
            display: none !important;
          }
        }
        @media (max-width: 960px) {
          .timeline-desktop {
            display: none !important;
          }
          .timeline-mobile {
            display: flex !important;
            flex-direction: column;
            gap: 20px;
            max-width: 480px;
            margin: 0 auto;
          }
        }
        .timeline-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .timeline-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.08) !important;
        }
      `}</style>

      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        {/* Title */}
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
          fontSize: "clamp(18px,2.6vw,40px)", lineHeight: "56px",
          color: GRAY, textAlign: "center", margin: "0 0 48px", letterSpacing: "-0.56px",
        }}>Lịch trình cuộc thi</h2>

        {/* Desktop Alternating Grid */}
        <div className="timeline-desktop">
          {/* Continuous Horizontal Spine across Row 3 */}
          <div style={{
            gridRow: 3,
            gridColumn: "1 / -1",
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}>
            <div style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${RED} 12%, ${YELLOW} 42%, ${GREEN} 73%, ${BLUE} 100%)`,
              zIndex: 0,
            }} />
          </div>

          {phases.map((phase, i) => {
            const col = i + 1;
            return (
              <React.Fragment key={i}>
                {/* Row 1: Top Card (Phase 1 & Phase 3) */}
                <div style={{
                  gridRow: 1,
                  gridColumn: col,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-end",
                }}>
                  {phase.above && renderCard(phase)}
                </div>

                {/* Row 2: Top Connector (Phase 1 & Phase 3) */}
                <div style={{
                  gridRow: 2,
                  gridColumn: col,
                  display: "flex",
                  justifyContent: "center",
                }}>
                  {phase.above && (
                    <div style={{
                      width: 2,
                      height: "100%",
                      background: phase.color,
                    }} />
                  )}
                </div>

                {/* Row 3: Dot Circle on Spine */}
                <div style={{
                  gridRow: 3,
                  gridColumn: col,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 2,
                }}>
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: phase.color,
                    boxShadow: "0 0 0 3px #fff, 0 1px 4px rgba(0,0,0,0.2)",
                    flexShrink: 0,
                  }} />
                </div>

                {/* Row 4: Bottom Connector (Phase 2 & Phase 4) */}
                <div style={{
                  gridRow: 4,
                  gridColumn: col,
                  display: "flex",
                  justifyContent: "center",
                }}>
                  {!phase.above && (
                    <div style={{
                      width: 2,
                      height: "100%",
                      background: phase.color,
                    }} />
                  )}
                </div>

                {/* Row 5: Bottom Card (Phase 2 & Phase 4) */}
                <div style={{
                  gridRow: 5,
                  gridColumn: col,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                }}>
                  {!phase.above && renderCard(phase)}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile / Tablet Vertical Timeline (< 960px) */}
        <div className="timeline-mobile">
          {phases.map((phase, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: phase.color,
                boxShadow: "0 0 0 3px #fff, 0 1px 3px rgba(0,0,0,0.15)",
                marginTop: 18,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                {renderCard(phase)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FINALE SECTION ───────────────────────────────────────────────────────
// Figma FinaleSection: w=1528, h=1285
// 4 cards in Container 6420:290 w=1368, h=355
//   Row 1: Sprint (x=0, w=672, h=185) + Pitch (x=696, w=672, h=185) → gap=24
//   Row 2: Verdict (x=0, w=672, h=145) + Twist (x=696, w=672, h=145) → gap=24
// Pie chart (6428:662): x=178, y=609, w=418, h=418
// Score breakdown (6428:561): x=696, y=509 → right half of 1368
function FinaleCard({ color, bgIcon, icon, title, description }) {
  return (
    <div className="finale-card" style={{
      backdropFilter: "blur(8px)", background: "rgba(255,255,255,.85)",
      borderLeft: `4px solid ${color}`,
      borderTop: `0.8px solid ${color}`,
      borderRight: `0.8px solid ${color}`,
      borderBottom: `0.8px solid ${color}`,
      borderRadius: 40,
      boxShadow: "0 20px 40px 0 rgba(66,133,244,.08)",
      display: "flex", gap: 24, alignItems: "flex-start",
      padding: "33.8px 36.8px 33.8px 40px",
      boxSizing: "border-box",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 28, flexShrink: 0,
        background: bgIcon,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,.05)",
      }}>
        <img alt="" src={icon} style={{ width: 20, height: 20, objectFit: "contain" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <p style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
          fontSize: 20, lineHeight: "30px", color: DARK, margin: 0,
        }}>{title}</p>
        <p style={{
          fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 400,
          fontSize: 14, lineHeight: "20px", color: GRAY,
          textAlign: "justify", margin: 0,
        }}>{description}</p>
      </div>
    </div>
  );
}

function FinaleSection() {
  return (
    <section id="criteria" style={{ position: "relative", zIndex: 1, width: "100%", padding: "45px clamp(16px,5.2vw,80px) 80px" }}>
      <div style={{ maxWidth: 1368, margin: "0 auto" }}>

        {/* Title (6420:286): centered */}
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
          fontSize: "clamp(18px,2.6vw,40px)", lineHeight: "56px",
          color: GRAY, textAlign: "center", margin: "0 0 48px", letterSpacing: "-0.56px",
        }}>Thể thức vòng chung kết</h2>

        {/* 2×2 cards — each col = 672/(1368) = 49.1% with 24px gap */}
        {/* Row 1 */}
        <div className="finale-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <FinaleCard color={BLUE} bgIcon="#e8f0fe" icon={imgIconSprint}
            title="The Sprint"
            description="Hai đội đối đầu nhận cùng một bài toán thực tế. Trong vòng 5 phút, các đội tiến hành xây dựng bản thử nghiệm (Proof of Concept) trên Gemini và Google AI Studio, tập trung chứng minh tính khả thi mà không yêu cầu dựng hệ thống backend hoàn chỉnh." />
          <FinaleCard color={YELLOW} bgIcon="#fef7e0" icon={imgIconPitch}
            title="The Pitch"
            description="Mỗi đội có 60 giây để trình bày ngắn gọn về bài toán, giải pháp ứng dụng AI và demo sản phẩm trực tiếp trước Ban giám khảo và khán giả." />
        </div>
        {/* Row 2 */}
        <div className="finale-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 72 }}>
          <FinaleCard color={RED} bgIcon="#fce8e6" icon={imgIconVerdict}
            title="The Verdict"
            description="Mỗi thành viên Ban giám khảo đặt tối đa một câu hỏi chất vấn. Sau đó, Hội đồng giám khảo chấm điểm, đánh giá và quyết định đội thi đi tiếp." />
          <FinaleCard color={GREEN} bgIcon="#e6f4ea" icon={imgIconTwist}
            title="On-stage Twist"
            description="Các thử thách bất ngờ có thể xuất hiện ngay trên sân khấu nhằm thử thách khả năng ứng biến linh hoạt của thí sinh." />
        </div>

        {/* Scoring title (6428:645) */}
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
          fontSize: "clamp(18px,2.1vw,32px)", lineHeight: "56px",
          color: GRAY, textAlign: "center", margin: "0 0 32px", letterSpacing: "-0.56px",
        }}>Cách tính điểm vòng chung kết</h2>

        {/* Score breakdown - 3 cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
        }}>
          {[
            {
              label: "Tính khả thi", pct: "40%", color: "#1a73e8", bgLight: "#e8f0fe",
              desc: "Mức độ hoạt động của sản phẩm; tính hoàn thiện; khả năng sử dụng và trải nghiệm."
            },
            {
              label: "Tính sáng tạo", pct: "30%", color: "#b06000", bgLight: "#fef7e0",
              desc: "Tính mới của ý tưởng và cách khai thác AI."
            },
            {
              label: "Tiềm năng tác động", pct: "30%", color: "#137333", bgLight: "#e6f4ea",
              desc: "Mức độ giải quyết đúng bài toán và khả năng mở rộng."
            },
          ].map(({ label, pct, color, bgLight, desc }) => (
            <div key={label} style={{
              backdropFilter: "blur(8px)", background: "rgba(255,255,255,.85)",
              borderTop: `4px solid ${color}`,
              borderLeft: "0.8px solid rgba(0,0,0,.08)",
              borderRight: "0.8px solid rgba(0,0,0,.08)",
              borderBottom: "0.8px solid rgba(0,0,0,.08)",
              borderRadius: 24,
              boxShadow: "0 10px 30px 0 rgba(66,133,244,.06)",
              padding: "28px 24px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
                  fontSize: 18, color: DARK,
                }}>{label}</span>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800,
                  fontSize: 16, color,
                  background: bgLight,
                  padding: "4px 12px",
                  borderRadius: 16,
                }}>{pct}</span>
              </div>
              <p style={{
                fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 400,
                fontSize: 14, lineHeight: "22px", color: GRAY, margin: 0,
                textAlign: "justify",
              }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── RESOURCES ────────────────────────────────────────────────────────────
function ResourcesSection() {
  return (
    <section id="resources" style={{
      position: "relative", zIndex: 1, width: "100%",
      padding: "0 clamp(16px,16.8vw,256px) 60px",
    }}>
      <style>{`
        .resource-card {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
        }
        .resource-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px -8px rgba(66,133,244,0.2) !important;
        }
        .resource-link-item {
          transition: all 0.2s ease;
          border: 1px solid rgba(66,133,244,0.1);
        }
        .resource-link-item:hover {
          transform: translateX(4px);
          background: #e8f0fe !important;
          border-color: #4285f4;
        }
        .resources-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (min-width: 1024px) {
          .resources-grid {
            display: grid;
            grid-template-columns: 1fr 1.6fr;
            align-items: stretch;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1016, margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
          fontSize: "clamp(18px,2.2vw,32px)", lineHeight: "48px",
          color: DARK, textAlign: "center", margin: "0 0 32px", letterSpacing: "-0.56px",
        }}>Tài nguyên khác</h2>

        <div className="resources-grid">

          {/* Card 1: Featured (VibeCoding) */}
          <div className="resource-card" style={{
            background: "linear-gradient(135deg, #1a73e8 0%, #4285f4 100%)",
            borderRadius: 24,
            boxShadow: "0 10px 30px 0 rgba(26,115,232,0.15)",
            padding: "24px",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Decor blob */}
            <div style={{ position: "absolute", top: -30, right: -30, width: 150, height: 150, background: "rgba(255,255,255,0.1)", borderRadius: "50%", filter: "blur(25px)" }} />

            <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", padding: "4px 12px", borderRadius: 16, marginBottom: 12 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "1px", textTransform: "uppercase" }}>Dành cho người mới</span>
              </div>
              <p style={{
                fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800,
                fontSize: 22, lineHeight: "30px", margin: "0 0 12px"
              }}>Bạn chưa quen với VibeCoding?</p>
              <p style={{
                fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 400,
                fontSize: 15, lineHeight: "24px", color: "rgba(255,255,255,0.9)", margin: "0 0 24px", flex: 1
              }}>
                Cẩm nang VibeCoding này là hướng dẫn tổng thể để bạn bắt đầu, xây dựng và triển khai sản phẩm của mình.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <a href="https://docs.google.com/presentation/d/e/2PACX-1vT5FmgwnjE8Q2FhcWx7Cg89PrW6CujORX4bzUacuABBg1oeFrn6kXkPKhFXGxcVcbfkfUrF5tOxgrDx/pub?start=false&loop=false&delayms=60000&slide=id.g3e3769ea786_0_68" target="_blank" rel="noreferrer" style={{
                  background: "#fff", color: "#1a73e8", padding: "10px 16px", borderRadius: 999,
                  fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 14, textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 8, justifyContent: "center"
                }}>
                  📚 Cẩm nang VibeCoding
                </a>
                <a href="https://docs.google.com/document/d/1YiObQCXJzd4Mw8RkEoDWohclAu_0gJe4-cVuIGg8h08/edit?tab=t.c7mqrgtpn7uv" target="_blank" rel="noreferrer" style={{
                  background: "rgba(255,255,255,0.15)", color: "#fff", padding: "10px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.3)",
                  fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 14, textDecoration: "none", backdropFilter: "blur(4px)",
                  display: "flex", alignItems: "center", gap: 8, justifyContent: "center"
                }}>
                  🚀 Hướng dẫn từng bước
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: Advanced (Grid of Links) */}
          <div className="resource-card" style={{
            backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.8)",
            borderRadius: 24,
            boxShadow: "0 10px 30px 0 rgba(0,0,0,0.04)",
            padding: "24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fef7e0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 20 }}>💡</span>
              </div>
              <p style={{
                fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800,
                fontSize: 20, lineHeight: "28px", color: DARK, margin: 0
              }}>Sẵn sàng làm chủ công nghệ?</p>
            </div>

            <p style={{
              fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 400,
              fontSize: 15, lineHeight: "24px", color: GRAY, margin: "0 0 20px"
            }}>
              Nghiên cứu ngay các tài liệu dưới đây để mở rộng kỹ năng và hoàn thiện giải pháp:
            </p>

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12
            }}>
              {[
                { label: "What is Google AI Studio?", url: "https://www.youtube.com/watch?v=Y6ufrXn_cZs&list=PLIivdWyY5sqIagw3_50GeVHIwcUoOwTa7", icon: "▶️" },
                { label: "Prompting in Google AI Studio", url: "https://www.youtube.com/watch?v=pJk33RMGjsk&list=PLIivdWyY5sqIagw3_50GeVHIwcUoOwTa7&index=3", icon: "▶️" },
                { label: "Multi-modal Capabilities", url: "https://www.youtube.com/watch?v=auJzb1D-fag&list=PLIivdWyY5sqIagw3_50GeVHIwcUoOwTa7&index=3", icon: "▶️" },
                { label: "Prototyping in Google AI Studio", url: "https://www.youtube.com/watch?v=KUrHeIa3kYE&list=PLIivdWyY5sqIagw3_50GeVHIwcUoOwTa7&index=4", icon: "▶️" },
                { label: "Integrating Advance AI in Your Apps", url: "https://www.youtube.com/watch?v=P68moBUMFOg&list=PLIivdWyY5sqIagw3_50GeVHIwcUoOwTa7&index=5", icon: "▶️" },
                { label: "Vibe Code with Gemini", url: "https://codelabs.developers.google.com/vibe-code-with-gemini-in-aistudio?hl=en#0", icon: "💻" },
                { label: "Deploy from AI Studio to Cloud Run", url: "https://codelabs.developers.google.com/deploy-from-aistudio-to-run?hl=en#0", icon: "☁️" },
                { label: "The Starter Tier Explained", url: "https://cloud.google.com/blog/topics/developers-practitioners/the-starter-tier-for-google-ai-studio-explained", icon: "📰" },
              ].map(link => (
                <a key={link.label} href={link.url} target="_blank" rel="noreferrer" className="resource-link-item" style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", background: "rgba(255,255,255,0.9)",
                  borderRadius: 12, textDecoration: "none",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: "#f8fafc",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <span style={{ fontSize: 13 }}>{link.icon}</span>
                  </div>
                  <span style={{
                    fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700,
                    fontSize: 13, color: "#1e293b", flex: 1, lineHeight: "18px"
                  }}>{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────
// Figma FAQSection: x=256..1272 (w=1016) within 1528
// Padding-x = 256px on each side of 1528 → 16.8% of viewport
function FAQSection() {
  const qs = [
    "Đối tượng tham gia cuộc thi là ai?",
    "Quy định về hình thức và thành viên đội thi như thế nào?",
    "Tham gia cuộc thi có mất phí không?",
    "Chi phí tham dự Chung kết cho các thí sinh như thế nào?",
    "Bản quyền các sản phẩm dự thi thuộc về ai?",
    "Các công cụ AI nào được phép sử dụng trong cuộc thi?",
    "Thí sinh được cung cấp tài khoản AI như thế nào?",
    "Phương thức nhập lệnh (Prompting) được quy định ra sao?",
    "Ngôn ngữ chính thức được sử dụng trong cuộc thi là gì?",
    "Thí sinh tham gia vòng chung kết cần chuẩn bị gì?",
  ];
  return (
    <section id="faq" style={{
      position: "relative", zIndex: 1, width: "100%",
      padding: "0 clamp(16px,16.8vw,256px) 80px",
    }}>
      <div style={{ maxWidth: 1016, margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
          fontSize: "clamp(18px,2.6vw,40px)", lineHeight: "64px",
          color: DARK, textAlign: "center", margin: "0 0 40px", letterSpacing: "-0.56px",
        }}>Câu hỏi thường gặp</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {qs.map(q => (
            <div key={q} style={{
              backdropFilter: "blur(8px)", background: "rgba(255,255,255,.85)",
              border: "0.8px solid rgba(255,255,255,.6)",
              borderRadius: 24,
              boxShadow: "0 20px 40px 0 rgba(66,133,244,.08)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "24.8px",
              }}>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
                  fontSize: 18, lineHeight: "28px", color: "#134dab",
                  margin: 0, flex: 1,
                }}>{q}</p>
                <img alt="" src={imgChevron}
                  style={{ width: 12, height: 14, marginLeft: 16, flexShrink: 0 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── ORGANIZERS ───────────────────────────────────────────────────────────
function OrganizersSection() {
  return (
    <section style={{ position: "relative", zIndex: 1, width: "100%", padding: "80px 80px 48px" }}>
      {/* ĐƠN VỊ TỔ CHỨC */}
      <p style={{
        fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
        fontSize: 20, lineHeight: "33px", color: GRAY,
        textAlign: "center", letterSpacing: "2px", textTransform: "uppercase",
        margin: "0 0 20px",
      }}>ĐƠN VỊ TỔ CHỨC</p>

      <div className="organizers-flex" style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 85, marginBottom: 50,
      }}>
        <img className="organizers-img" alt="VNU" src={imgLogoVnuLg}
          style={{ height: 127, width: 315, objectFit: "contain" }} />
        {/* Vertical divider — stroke tăng lên 2px, opacity cao hơn */}
        <div className="organizers-divider" style={{ width: 2, height: 65, background: "rgba(0,0,0,0.25)", borderRadius: 1 }} />
        <img className="organizers-img" alt="Google" src={imgLogoGoogle}
          style={{ height: 111, width: 343, objectFit: "contain" }} />
      </div>

      {/* ĐƠN VỊ ĐĂNG CAI */}
      <p style={{
        fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
        fontSize: 20, lineHeight: "33px", color: GRAY,
        textAlign: "center", letterSpacing: "2px", textTransform: "uppercase",
        margin: "0 0 20px", paddingTop: 32,
      }}>ĐƠN VỊ ĐĂNG CAI</p>

      <div style={{ display: "flex", justifyContent: "center", paddingBottom: 48 }}>
        <img alt="UET" src={imgLogoUet}
          style={{ height: 135, width: 134, objectFit: "contain" }} />
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────
// Figma Footer: h=120, padding x=80
// Left container: x=80, w=368 → brand + email
// Right container: x=1174, w=274 → links
function Footer() {
  return (
    <footer style={{
      position: "relative", zIndex: 1,
      backdropFilter: "blur(6px)",
      background: "rgba(240,237,237,.5)",
      borderTop: "0.8px solid rgba(194,198,213,.1)",
      minHeight: 60,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
        padding: "12px clamp(16px,5.2vw,80px)",
        maxWidth: 1528, margin: "0 auto",
      }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <p style={{
            fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800,
            fontSize: 20, lineHeight: "28px", margin: 0,
          }}>
            <span style={{
              background: GRADIENT,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>AI Arena:Viet Nam 2026</span>
          </p>
          <p style={{
            fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 400,
            fontSize: 14, lineHeight: "20px", color: GRAY, margin: 0,
          }}>📩 Email: ai_arena_vietnam@vnu.edu.vn</p>
        </div>
        {/* Right */}
        <div style={{ display: "flex", gap: 24 }}>
          {["Chính sách bảo mật", "Điều khoản"].map(l => (
            <a key={l} href="#" style={{
              fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 400,
              fontSize: 13, lineHeight: "20px", color: GRAY, textDecoration: "none",
            }}>{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────
export default function PromptOff() {
  return (
    <div style={{ background: "#fcf9f8", minHeight: "100vh", position: "relative" }}>
      <Background />
      <Nav />
      <main style={{ position: "relative", zIndex: 1, zoom: 0.85 }}>
        <style>{`
          /* Global Mobile Fixes */
          @media (max-width: 960px) {
            .hero-flex { flex-direction: column !important; align-items: stretch !important; gap: 32px !important; }
            .hero-right-col { margin-top: 16px !important; width: 100% !important; max-width: 400px !important; align-self: center; }
            .hero-headline { margin-left: 0 !important; }
            .organizers-flex { flex-direction: column !important; gap: 40px !important; }
            .organizers-divider { display: none !important; }
            .organizers-img { max-width: 80vw !important; height: auto !important; }
            
            .finale-grid { grid-template-columns: 1fr !important; }
            .finale-card { padding: 24px !important; flex-direction: column !important; align-items: center !important; }
            .finale-card > div:last-child p { text-align: center !important; }
          }
        `}</style>
        <HeroSection />
        <ScheduleSection />
        <FinaleSection />
        <ResourcesSection />
        <FAQSection />
        <OrganizersSection />
      </main>
      <Footer />
    </div>
  );
}
