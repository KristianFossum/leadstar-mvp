const HomePage = () => {
  return (
    <section
      className="flex overflow-hidden relative flex-col justify-center items-center w-full h-screen min-h-screen"
      style={{
        backgroundImage: "url(https://cpcty.xyz/hero-capacity.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex z-10 flex-col items-center px-6 py-16 text-center">
        <h1
          className="mb-6 text-6xl font-semibold tracking-tight leading-tight text-gray-900 md:text-7xl animate-fade-in-up"
          style={{ letterSpacing: "-0.03em" }}
        >
          Capacity
        </h1>
        <p className="max-w-xl text-2xl font-light text-gray-700 delay-200 md:text-3xl animate-fade-in-up">
          Turn any idea into a working web app
        </p>
      </div>
    </section>
  );
};

export default HomePage;
