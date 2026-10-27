export default function Footer() {
  return (
    <footer id="about" className="bg-charcoal text-cream-100 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-maroon text-cream-50 flex items-center justify-center font-serif text-xl font-bold">H</div>
              <span className="serif-title text-2xl font-bold text-white tracking-wide">HunarHub</span>
            </div>
            <p className="text-xs text-cream-300 leading-relaxed max-w-sm">
              A curated marketplace for home-based female artisans, bakers, and traditional artists in Pakistan.
            </p>
            <div className="flex space-x-3 pt-2">
              {['instagram', 'facebook-f', 'whatsapp'].map((n) => (
                <a key={n} href="#" className="w-8 h-8 rounded-full bg-white/10 hover:bg-maroon transition flex items-center justify-center text-xs text-white">
                  <i className={`fa-brands fa-${n}`}></i>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase font-bold text-gold tracking-widest mb-4">Shop</h4>
            <ul className="space-y-2.5 text-xs text-cream-300">
              <li>Stitching &amp; Embroidery</li>
              <li>Home Baking</li>
              <li>Henna Art</li>
              <li>Handicrafts</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase font-bold text-gold tracking-widest mb-4">For Artisans</h4>
            <ul className="space-y-2.5 text-xs text-cream-300">
              <li>Work with a HunarHub agent</li>
              <li>Quality standards</li>
              <li>Packaging guidelines</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 text-xs text-cream-300">
          <p>&copy; 2026 HunarHub Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
