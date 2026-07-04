import Link from "next/link";
import { BrandLogo } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-block">
            <BrandLogo />
          </Link>
          {children}
        </div>
      </div>
      <div className="relative hidden brand-gradient lg:block">
        <div className="flex h-full flex-col justify-center px-16 text-white">
          <h2 className="text-4xl font-bold leading-tight">
            One platform for your whole customer journey.
          </h2>
          <p className="mt-4 max-w-md text-lg text-white/80">
            Marketing, sales, and service — unified. NexusCRM gives your team the context to grow
            better, together.
          </p>
          <ul className="mt-8 space-y-3 text-white/90">
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-white" /> Track every contact & deal
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-white" /> Automate marketing campaigns
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-white" /> Delight customers with fast support
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
