import React from 'react';
import { Shield, ChevronLeft } from 'lucide-react';

export default function PrivacyPolicy({ onBack }: { onBack: () => void }) {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-stone-400 hover:text-brand-primary transition-colors font-black uppercase tracking-widest text-[10px]"
      >
        <ChevronLeft className="w-4 h-4" />
        Return to Archives
      </button>

      <div className="interactive-card p-8 md:p-12 bg-white space-y-10">
        <header className="space-y-4">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex items-center justify-center text-brand-primary">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-display italic font-black text-brand-text tracking-tighter">Privacy Archive</h1>
          <p className="text-stone-400 font-medium">How we preserve your digital footprint along with our heritage.</p>
        </header>

        <div className="prose prose-stone max-w-none prose-headings:font-display prose-headings:italic prose-headings:font-black prose-p:text-stone-500 prose-p:leading-relaxed">
          <h2>1. Data Collection</h2>
          <p>
            LyecAI collects minimal data necessary to provide our cultural preservation services. This includes authentication data if you choose to sign in, and any text or voice inputs used to interact with the AI tutor.
          </p>

          <h2>2. AI Processing</h2>
          <p>
            Your interactions with the AI are processed to generate bilingually accurate responses. We do not use your personal archives for third-party marketing.
          </p>

          <h2>3. Audio Data</h2>
          <p>
            Voice recordings are processed in real-time to provide translation and guidance. We do not store permanent audio recordings of your voice on our servers unless specifically requested for "Oral History" contributions.
          </p>

          <h2>4. Cultural Sensitivity</h2>
          <p>
            We are committed to the data sovereignty of the Acholi people. All cultural information shared within this app is intended for educational and preservation purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
