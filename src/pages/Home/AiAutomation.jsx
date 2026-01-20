import { useRef } from "react";

export default function AiAutomation() {
  const examples = [
    "Send a reminder if documents aren’t uploaded in 3 days.",
    "Move return to review when preparer marks it complete.",
    "Notify client when e-file is accepted."
  ];

  return (
    <section className="py-24 bg-black relative overflow-hidden" id="automation">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Edit & Automate With <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">Natural Language</span>
          </h2>
          <p className="text-xl text-zinc-400 leading-relaxed">
            Describe what you want to happen, and let the system do the work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Visual Representation */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
              <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="ml-4 text-xs text-zinc-500 font-mono">automation-copilot.exe</div>
              </div>

              <div className="space-y-4 font-mono text-sm">
                <div className="text-zinc-500"># Just type what you need...</div>
                {examples.map((example, i) => (
                  <div key={i} className="flex gap-3 text-zinc-300">
                    <span className="text-blue-400">$</span>
                    <span className="typing-effect">{example}</span>
                  </div>
                ))}
                <div className="flex gap-3">
                  <span className="text-blue-400">$</span>
                  <span className="w-2 h-5 bg-blue-400 animate-pulse"></span>
                </div>
              </div>
            </div>

            {/* Value Prop Badge */}
            <div className="absolute -bottom-6 -right-6 bg-zinc-900 border border-zinc-700 p-4 rounded-xl shadow-xl max-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white font-bold">No Coding</span>
              </div>
              <p className="text-xs text-zinc-400">Perfect for firms that want power without complexity.</p>
            </div>
          </div>

          {/* Context/Explanation */}
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Voice or Text Commands</h3>
                <p className="text-zinc-400">Simply describe your workflow rules in plain English. Our AI interprets your intent and builds the automation for you.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Instant Execution</h3>
                <p className="text-zinc-400">From reminders to task movement, automations run instantly 24/7, ensuring nothing slips through the cracks.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 border border-green-500/20">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Zero complexity</h3>
                <p className="text-zinc-400">Perfect for firms that want enterprise-grade power without the complexity of traditional CRM setup.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
