import { Link } from 'react-router-dom';
import { Download, Github, Twitter, Heart } from 'lucide-react';
import { SmartLink } from './AdBanner';

export function Footer() {
  return (
    <footer className="border-t border-slate-700/50 bg-slate-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">DownAir</span>
            </Link>
            <p className="text-slate-400 text-sm">
              The fastest and most reliable social media downloader. Download videos and audio from 12+ platforms.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-slate-400 hover:text-cyan-400 transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-slate-400 hover:text-cyan-400 transition-colors">About Us</Link></li>
              <li><Link to="/guides" className="text-slate-400 hover:text-cyan-400 transition-colors">Tech Guides</Link></li>
              <li><SmartLink>Explore More Tools</SmartLink></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="text-slate-400 hover:text-cyan-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/dmca" className="text-slate-400 hover:text-cyan-400 transition-colors">DMCA / Copyright</Link></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Supported Platforms</h3>
            <div className="flex flex-wrap gap-2">
              {['YouTube', 'TikTok', 'Instagram', 'Twitter/X', 'Facebook', 'Reddit', 'Vimeo'].map((p) => (
                <span key={p} className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-md">{p}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} DownAir. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-red-400" /> for the web
            </span>
            <a href="#" className="hover:text-cyan-400 transition-colors"><Github className="w-4 h-4" /></a>
            <a href="#" className="hover:text-cyan-400 transition-colors"><Twitter className="w-4 h-4" /></a>
          </div>
          <SmartLink className="text-xs">Discover more tools &rarr;</SmartLink>
        </div>
      </div>
    </footer>
  );
}
