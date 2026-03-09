'use client';

import Link from 'next/link';
import { Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      data-testid="footer-section"
      className="relative py-16 md:py-24 bg-[#0A0A0A] dark:bg-[#0A0A0A] border-t border-white/5"
      role="contentinfo"
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-16">
          <div>
            <h3 className="text-3xl md:text-4xl font-bold text-white font-sans mb-4 tracking-tight">
              Stay Ahead of
              <br />
              the Curve
            </h3>
            <p className="text-zinc-400 text-lg mb-8 max-w-md">
              Get exclusive insights on AI advertising, delivered to your inbox.
            </p>
            <form
              className="flex gap-3"
              onSubmit={(e) => e.preventDefault()}
              aria-label="Newsletter signup"
            >
              <input
                placeholder="Enter your email"
                data-testid="newsletter-input"
                className="newsletter-input flex-1 px-5 py-4 rounded-full text-white placeholder-zinc-500 font-medium"
                required
                type="email"
                aria-label="Email for newsletter"
              />
              <button
                type="submit"
                data-testid="newsletter-submit"
                className="glow-button w-14 h-14 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
                aria-label="Subscribe"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-arrow-right"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">
                Platform
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://demoai.adsgupta.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-white transition-colors duration-300 text-sm"
                  >
                    AI Sandbox
                  </a>
                </li>
                <li>
                  <a
                    href="https://adsgupta.com/#features"
                    className="text-zinc-500 hover:text-white transition-colors duration-300 text-sm"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="https://adsgupta.com/"
                    className="text-zinc-500 hover:text-white transition-colors duration-300 text-sm"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">
                Resources
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/insights"
                    className="text-zinc-500 hover:text-white transition-colors duration-300 text-sm"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <a
                    href="https://adsgupta.com/"
                    className="text-zinc-500 hover:text-white transition-colors duration-300 text-sm"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="https://adsgupta.com/"
                    className="text-zinc-500 hover:text-white transition-colors duration-300 text-sm"
                  >
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">
                Company
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="text-zinc-500 hover:text-white transition-colors duration-300 text-sm"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-zinc-500 hover:text-white transition-colors duration-300 text-sm"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <a
                    href="https://adsgupta.com/"
                    className="text-zinc-500 hover:text-white transition-colors duration-300 text-sm"
                  >
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://adsgupta.com/privacy"
                    className="text-zinc-500 hover:text-white transition-colors duration-300 text-sm"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="https://adsgupta.com/terms"
                    className="text-zinc-500 hover:text-white transition-colors duration-300 text-sm"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <a
              href="https://adsgupta.com"
              className="text-2xl font-bold text-white font-sans"
            >
              ADS<span className="text-cyan-400">GUPTA</span>
            </a>
            <span className="text-zinc-600 text-sm">
              © {new Date().getFullYear()} Ads Gupta. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/adsgupta"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="social-twitter"
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </a>
            <a
              href="https://linkedin.com/company/adsgupta"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="social-linkedin"
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
          </div>
        </div>
      </div>
      {/* adsgupta ecosystem footer script will be injected here */}
    </footer>
  );
}
