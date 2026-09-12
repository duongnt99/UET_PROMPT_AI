import { LANDING_ASSETS } from "@/config/landing-assets";
import { CO_ORGANIZERS, HOST_ORGANIZERS } from "@/config/organizers";

export function LandingOrganizers() {
  const vnu = CO_ORGANIZERS.find((item) => item.shortName === "ĐHQGHN");
  const google = CO_ORGANIZERS.find((item) => item.shortName === "Google");
  const uet = HOST_ORGANIZERS[0];

  return (
    <section className="relative z-[1] px-5 py-20 md:px-20 md:pb-12">
      <p className="display mb-5 text-center text-xl font-bold uppercase tracking-[2px] text-[#424753]">
        Đơn vị tổ chức
      </p>

      <div className="landing-organizers-flex mb-[50px] flex flex-wrap items-center justify-center gap-8 lg:gap-[85px]">
        <a href={vnu?.href ?? "https://www.vnu.edu.vn/"} target="_blank" rel="noreferrer" className="transition hover:opacity-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="VNU"
            src={LANDING_ASSETS.logoVnuLg}
            className="landing-organizers-img h-auto max-h-[127px] w-auto max-w-[min(315px,72vw)] object-contain lg:h-[127px] lg:w-[315px]"
          />
        </a>
        <div className="landing-organizers-divider h-[65px] w-0.5 rounded-sm bg-black/25" />
        <a href={google?.href ?? "https://about.google/"} target="_blank" rel="noreferrer" className="transition hover:opacity-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Google"
            src={LANDING_ASSETS.logoGoogle}
            className="landing-organizers-img h-auto max-h-[111px] w-auto max-w-[min(280px,72vw)] object-contain lg:h-[111px] lg:w-[343px]"
          />
        </a>
      </div>

      <p className="display mb-5 pt-8 text-center text-xl font-bold uppercase tracking-[2px] text-[#424753]">
        Đơn vị đăng cai
      </p>

      <div className="flex justify-center pb-12">
        <a href={uet?.href ?? "https://uet.vnu.edu.vn/"} target="_blank" rel="noreferrer" className="transition hover:opacity-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="UET" src={LANDING_ASSETS.logoUet} className="h-[135px] w-[134px] object-contain" />
        </a>
      </div>
    </section>
  );
}
