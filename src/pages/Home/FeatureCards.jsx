export default function FeatureCards() {
  return (
    <section className="py-24 bg-black">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16" style={{ opacity: 1, transform: "none" }}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-12 text-white  leading-tight">Transform Your Tax Practice Into a Scalable Operation</h1>
          </div>
          <div className="space-y-8 text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto">
            <p className="leading-relaxed" style={{ opacity: 1, transform: "none" }}>From Intake to Filing, All in One System
              Tired of juggling disconnected tools, manual follow-ups, and endless client emails? Imagine managing your entire tax <span className="text-white font-semibold"> practice from one powerful dashboard.</span></p>
            <p className="leading-relaxed" style={{ opacity: 1, transform: "none" }}>Think CRM meets workflow automation, but purpose-built for tax professionals. Simply onboard clients, send secure requests, track return progress, and let AI handle reminders, document collection, and task routing automatically.</p>
            <p className="leading-relaxed" style={{ opacity: 1, transform: "none" }}>No more missed documents. No more guessing return status. Whether you’re a solo preparer or a multi-office firm, our platform gives you complete visibility and control over every client, every return, every season.</p>
            <div className="text-center pt-8" style={{ opacity: 1, transform: "none" }}>
              <p className="text-xl font-medium mb-8 text-zinc-200">Confidently grow your firm with less stress and more structure.
              </p><a href="/create-account"><button className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 h-11 rounded-[10px] bg-white hover:bg-zinc-100 text-black px-8 py-6 text-lg font-semibold transition-all duration-300 transform hover:scale-105">Get Started Today</button></a>
              <p className="text-sm text-zinc-400 mt-4"> Start managing your tax practice smarter todayAI-Powered Tax Operations
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
