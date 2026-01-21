export default function NewsletterSection() {
  return (
    <section className="px-3 sm:px-4 md:px-6 py-10 sm:py-14 md:py-16 lg:py-20">
      
      {/* FULL WIDTH BOX ON LARGE SCREEN */}
      <div className="w-full flex justify-center">
        <div className="bg-[#00C0C6] rounded-xl sm:rounded-2xl p-5 sm:p-7 md:p-10 w-full max-w-[1400px] 
                        flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-5 md:gap-6">

          {/* LEFT TEXT */}
          <div className="md:w-1/2 w-full">
            <h3 className="text-white font-semibold text-xl sm:text-2xl md:text-2xl">
              STAY UPDATED
            </h3>

            <p className="text-white text-xs sm:text-sm mt-2 sm:mt-2 max-w-md">
              Get the latest insights on tax practice management, industry trends,
              and product updates delivered to your inbox.
            </p>
          </div>

          {/* INPUT + BUTTON */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:w-1/2 sm:justify-end w-full">
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-white !rounded-[10px] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm !text-[#4B5563] w-full sm:w-56 md:w-60 outline-none"
            />

            <button className="bg-[#FF7A1A] text-white text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 !rounded-[10px] whitespace-nowrap w-full sm:w-auto">
              Subscribe
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
