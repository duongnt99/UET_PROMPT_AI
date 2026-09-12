import { LANDING_ASSETS } from "@/config/landing-assets";

export function LandingBackground() {
  return (
    <div aria-hidden className="landing-page-background pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={LANDING_ASSETS.bgTexture}
        className="absolute inset-0 h-full w-full object-cover opacity-10"
        style={{ left: 2 }}
      />
      <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#4285f4]/15 blur-[50px]" />
      <div className="absolute right-[-80px] top-[200px] h-[500px] w-[500px] rounded-full bg-[#db4437]/10 blur-[50px]" />
      <div className="absolute -left-40 top-[533px] h-[550px] w-[550px] rounded-full bg-[#f4b400]/15 blur-[50px]" />
      <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-[#0f9d58]/10 blur-[50px]" />
      <div className="absolute right-32 top-20 h-[800px] w-[800px] rounded-full border border-dashed border-[#4285f4]/10" />
      <div className="absolute right-48 top-40 h-[600px] w-[600px] rounded-full border border-dashed border-[#f4b400]/10" />
      <div className="absolute right-[193px] top-[115px] rotate-[12deg]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/40 bg-gradient-to-br from-[#4285f4] to-[#d8e2ff] opacity-80 shadow-xl backdrop-blur-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={LANDING_ASSETS.badgeTech} className="h-[15px] w-[25px]" />
        </div>
      </div>
      <div className="absolute -left-[27px] top-[338px] flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#db4437] to-[#ffdad5] opacity-60 shadow-lg backdrop-blur-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={LANDING_ASSETS.badgeRed} className="h-[27px] w-[27px]" />
      </div>
      <div className="absolute bottom-[124px] right-[46px] -rotate-[12deg]">
        <div className="flex h-14 w-14 items-center justify-center rounded-[48px] bg-gradient-to-br from-[#f4b400] to-[#ffdea3] opacity-70 shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={LANDING_ASSETS.badgeYellow} className="h-4 w-5" />
        </div>
      </div>
    </div>
  );
}
