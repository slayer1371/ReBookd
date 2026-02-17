import { BizOnboardLayout } from "./biz-onboard-layout";

export const metadata = {
  title: "Set Up Your Business | Rebookd",
  description: "Register your business and start filling last-minute cancellations.",
};

export default function BizLayout({ children }: { children: React.ReactNode }) {
  return <BizOnboardLayout>{children}</BizOnboardLayout>;
}
