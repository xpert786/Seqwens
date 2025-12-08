export default function NewsletterSection() {
  return (
    <section className="px-6 py-20 ">
      
      {/* FULL WIDTH BOX ON LARGE SCREEN */}
      <div className="w-full flex justify-center">
        <div className="bg-[#00C0C6] rounded-2xl p-10 w-full max-w-[1400px] 
                        flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          {/* LEFT TEXT */}
          <div className="md:w-1/2">
            <h3 className="text-white font-semibold text-2xl">
              STAY UPDATED
            </h3>

            <p className="text-white text-sm mt-2 max-w-md">
              Get the latest insights on tax practice management, industry trends,
              and product updates delivered to your inbox.
            </p>
          </div>

          {/* INPUT + BUTTON */}
          <div className="flex items-center gap-3 md:w-1/2 justify-end">
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-white !rounded-md px-4 py-2 text-sm !text-[#4B5563] w-60 outline-none"
            />

            <button className="bg-[#FF7A1A] text-white text-sm font-medium px-5 py-2 !rounded-md">
              Subscribe
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
