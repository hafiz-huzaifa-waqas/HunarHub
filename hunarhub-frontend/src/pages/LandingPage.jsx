import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 Naya import

export default function LandingPage() {
  const heroStageRef = useRef(null);
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false); // 👈 Animation ke liye state

  useEffect(() => {
    const stage = heroStageRef.current;
    if (!stage || !('IntersectionObserver' in window)) return;

    const phones = Array.from(stage.querySelectorAll('[data-anim]'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        phones.forEach((p) => {
          const cls = 'animate-' + p.getAttribute('data-anim');
          if (e.isIntersecting) {
            if (!p.classList.contains(cls)) {
              void p.offsetWidth;
              p.classList.add(cls);
            }
          } else {
            p.classList.remove(cls);
          }
        });
      });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // 👇 Zabardast Transition Function
  const handleGetStarted = (e) => {
    e.preventDefault(); // Default link behavior rok diya
    setIsNavigating(true); // Animation start ki
    
    // 800ms (0.8 second) baad naye page par bhej dega
    setTimeout(() => {
      navigate('/home');
    }, 800); 
  };

  return (
    // 👇 Poora page fade + zoom out hoga jab isNavigating true hoga
    <div 
      className={`bg-[#faf8f6] text-[#2b170e] min-h-screen selection:bg-[#6e1a27] selection:text-white transition-all duration-700 ease-in-out ${
        isNavigating ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
      }`}
    >
      
      {/* Header */}
            {/* Header */}
      <header className="w-full bg-[#faf8f6]/90 backdrop-blur-md px-6 lg:px-12 py-4 flex items-center justify-between border-b border-[#ece5df] sticky top-0 z-50">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          
          {/* 👇 Yahan baaki pages wala proper logo aur text lagaya hai */}
          <a aria-label="Hunar Hub Home" className="flex items-center space-x-2.5 group flex-shrink-0" href="#">
            <div className="w-10 h-10 rounded-full bg-[#701C28] text-[#FAF9F6] flex items-center justify-center font-serif text-2xl font-bold group-hover:bg-[#58141F] transition shadow-sm">
              H
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A] group-hover:text-[#701C28] transition">
                HunarHub
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#3B2219] font-bold -mt-1">
                Handcrafted &amp; Local
              </span>
            </div>
          </a>

          <nav className="flex items-center space-x-6 text-sm font-medium">
            <button 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-[#6e1a27] to-[#8a2434] text-[#ffffff] text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full border border-[#6e1a27] hover:brightness-110 transition-all shadow-[0_6px_16px_rgba(110,26,39,0.28)]"
            >
              Get started
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-b from-[#fbf9f7] via-[#faf8f6] to-[#f4eee8] px-4 py-6 min-h-[calc(100vh-4.5rem)] flex items-center" data-purpose="hero-banner">
          <div className="max-w-7xl mx-auto flex flex-col items-center">
            
            {/* 3-Phone Showcase */}
            <div ref={heroStageRef} id="heroStage" className="w-full flex items-center justify-center gap-4 lg:gap-8 mb-3 overflow-x-auto overflow-y-hidden no-scrollbar py-[2.2rem]">
              
              {/* Left Phone */}
              <div className="shrink-0 animate-phone-left motion-reduce:animate-none" data-anim="phone-left">
                 {/* ... (Left Phone ka code wesa hi rahega jo aapke paas hai) ... */}
                 <div className="w-[260px] sm:w-[280px] lg:w-[290px] shrink-0 bg-white rounded-[40px] p-3 shadow-[0_24px_50px_-12px_rgba(43,23,14,0.28)] border-[5px] border-[#2b170e] flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1">
                  <div className="w-16 h-3.5 bg-[#2b170e] rounded-full mx-auto mb-3 mt-1"></div>
                  <div className="px-2 pt-1 pb-4 flex flex-col h-full text-left">
                    <div className="flex items-center justify-between mb-3 text-xs text-[#8a7a72]">
                      <span className="text-[11px] font-semibold tracking-wider text-[#6e1a27] uppercase">Profile</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#f6e9ea] text-[10px] text-[#6e1a27] font-medium border border-[#6e1a27]/25">★ Top Rated</span>
                    </div>
                    <div className="w-full h-24 rounded-2xl bg-gradient-to-br from-[#43151b] to-[#5b1e25] flex items-center justify-center mb-3 relative overflow-hidden shadow-inner border border-[#6a202a]/40">
                      <span className="text-4xl font-light text-[#fdeef2]">Z</span>
                      <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[#f9d4df] font-medium">Clifton, Karachi</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#2b170e] mb-0.5">Zainab Khan</h4>
                    <span className="text-[11px] font-medium text-[#6e1a27] mb-2 block">Tailoring &amp; Embroidery</span>
                    <div className="bg-[#faf8f6] p-2.5 rounded-xl border border-[#ece5df] mb-3">
                      <h5 className="text-xs font-semibold text-[#2b170e] mb-1">Custom kurta stitching</h5>
                      <p className="text-[10px] text-[#7a6a63] leading-relaxed line-clamp-3">Zainab Khan, tailor in Clifton, Karachi. Hand finishing, measurements at your door, ready in 5 days.</p>
                    </div>
                    <div className="mt-auto pt-2 flex items-center justify-between border-t border-[#ece5df]">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-[#8a7a72]">Starting at</span>
                        <span className="text-xs font-bold text-[#2b170e]">Rs. 1,200</span>
                      </div>
                      <button className="bg-[#6e1a27] text-[#ffffff] text-[11px] font-semibold py-1.5 px-3.5 rounded-full hover:bg-[#571320] transition-colors shadow-sm">Book for Rs. 1,200</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Phone */}
              <div className="relative z-10 shrink-0 animate-phone-center motion-reduce:animate-none" data-anim="phone-center">
                <div className="w-[280px] sm:w-[305px] lg:w-[320px] shrink-0 bg-white rounded-[44px] p-3.5 shadow-[0_24px_50px_-12px_rgba(43,23,14,0.28)] border-[5px] border-[#6e1a27] z-10 scale-100 sm:scale-105 transition-transform duration-300 hover:scale-[1.07]">
                  <div className="w-20 h-4 bg-[#2b170e] rounded-full mx-auto mb-4 mt-1"></div>
                  <div className="flex flex-col items-center pt-2 pb-6 px-3 text-center">
                    <div className="relative w-28 h-32 flex flex-col items-center justify-end mb-4 overflow-hidden">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#6e1a27] to-[#d99aa6] mb-1.5 shadow-inner"></div>
                      <div className="w-24 h-16 bg-[#6e1a27] rounded-t-[34px]"></div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#2b170e] leading-[1.08] mb-3">
                      HUNAR<br/><span className="text-[#6e1a27]">HUB</span>
                    </h1>
                    <p className="text-xs text-[#7a6a63] leading-relaxed max-w-[210px] mb-5 font-normal">Karachi's premier network connecting clients with verified women experts and female artisans.</p>
                    {/* 👇 Center phone ka button bhi update kiya */}
                    <button 
                      onClick={handleGetStarted}
                      className="get-started-pulse w-full max-w-[240px] bg-gradient-to-r from-[#6e1a27] to-[#8a2434] text-[#ffffff] text-sm font-bold py-3.5 px-6 rounded-full hover:brightness-110 transition-all block text-center shadow-[0_10px_26px_rgba(110,26,39,0.45)] active:scale-95"
                    >
                      Get started
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Phone */}
              <div className="shrink-0 animate-phone-right motion-reduce:animate-none" data-anim="phone-right">
                {/* ... (Right Phone ka code wesa hi rahega jo aapke paas hai) ... */}
                <div className="w-[260px] sm:w-[280px] lg:w-[290px] shrink-0 bg-white rounded-[40px] p-3 shadow-[0_24px_50px_-12px_rgba(43,23,14,0.28)] border-[5px] border-[#2b170e] flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1">
                  <div className="w-16 h-3.5 bg-[#2b170e] rounded-full mx-auto mb-3 mt-1"></div>
                  <div className="px-2 pt-1 pb-4 flex flex-col h-full text-left">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-[10px] text-[#8a7a72] block uppercase tracking-wider">Welcome back</span>
                        <span className="text-xs font-bold text-[#2b170e]">Hello, Aisha 👋</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#6e1a27] text-[#ffffff] font-bold text-xs flex items-center justify-center">A</div>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 mb-2">
                      <span className="text-[10px] bg-[#6e1a27] text-[#ffffff] font-semibold px-2 py-0.5 rounded-full shrink-0">Tailor</span>
                      <span className="text-[10px] bg-[#faf8f6] text-[#7a6a63] px-2 py-0.5 rounded-full shrink-0 border border-[#ece5df]">Cook</span>
                      <span className="text-[10px] bg-[#faf8f6] text-[#7a6a63] px-2 py-0.5 rounded-full shrink-0 border border-[#ece5df]">Tech</span>
                      <span className="text-[10px] bg-[#faf8f6] text-[#7a6a63] px-2 py-0.5 rounded-full shrink-0 border border-[#ece5df]">Craft</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="bg-[#faf8f6] p-2 rounded-xl border border-[#ece5df]">
                        <img alt="Mehndi art" className="w-full h-16 md:h-20 object-cover rounded-xl mb-2" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUsF4Uu4b-kORJquYQzRZus4yK32IDdR5swn5Zjd1VqfIt-ICrW-zgxb25&s=10"/>
                        <div className="text-[11px] font-semibold text-[#2b170e] truncate">Crochet Sunflower</div>
                        <div className="text-[10px] text-[#7a6a63]">Rs. 1200</div>
                      </div>
                      <div className="bg-[#faf8f6] p-2 rounded-xl border border-[#ece5df]">
                        <img alt="Web design" className="w-full h-16 md:h-20 object-cover rounded-xl mb-2" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQL2urtirzcT3d79Vn8Se-xeDsA9h3XLNqaiRLBDoiQWsTK_uUMVpol7DA&s=10"/>
                        <div className="text-[11px] font-semibold text-[#2b170e] truncate">Gift box for girls</div>
                        <div className="text-[10px] text-[#7a6a63]">Rs. 2200</div>
                      </div>
                      <div className="bg-[#faf8f6] p-2 rounded-xl border border-[#ece5df]">
                        <img alt="Home baking" className="w-full h-16 md:h-20 object-cover rounded-xl mb-2" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbdHkjXOgygoKqGBDq2Zm3_w-x7suZpFFXSR6yOS9hT2zvReAewKkvPADy&s=10"/>
                        <div className="text-[11px] font-semibold text-[#2b170e] truncate">Crochet Keychain</div>
                        <div className="text-[10px] text-[#7a6a63]">Rs. 400</div>
                      </div>
                      <div className="bg-[#faf8f6] p-2 rounded-xl border border-[#ece5df]">
                        <img alt="Pottery class" className="w-full h-16 md:h-20 object-cover rounded-xl mb-2" src="https://www.thesprucecrafts.com/thmb/BYqH1u_7sTRDbrVrkPUVw8G4jNY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/diy-fall-painting-4774607-7-c17f10384d5642d7b0d930d78a23c463.jpg"/>
                        <div className="text-[11px] font-semibold text-[#2b170e] truncate">Tree Painting</div>
                        <div className="text-[10px] text-[#7a6a63]">Rs. 3000</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}