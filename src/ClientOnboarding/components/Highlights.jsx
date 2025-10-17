function Highlights() {
  return (
    <section className="py-5 bg-light">
      <div className="container text-center">
        <div className="row g-4">
          {["SOC2 COMPLIANT", "HIPAA READY", "99.9% UPTIME", "24/7 SUPPORT"].map((item, i) => (
            <div className="col-6 col-md-3" key={i}>
              <div className="p-3 bg-white shadow-sm rounded">
                <i className="bi bi-check-circle-fill text-success fs-3"></i>
                <h6 className="mt-2">{item}</h6>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Highlights;
