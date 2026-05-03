import React from 'react';
import { FileText, ChevronLeft } from 'lucide-react';

export default function TermsOfService({ onBack }: { onBack: () => void }) {
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
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-display italic font-black text-brand-text tracking-tighter">Usage Covenant</h1>
          <p className="text-stone-400 font-medium">The guiding principles of our digital heritage circle.</p>
        </header>

        <div className="prose prose-stone max-w-none prose-headings:font-display prose-headings:italic prose-headings:font-black prose-p:text-stone-500 prose-p:leading-relaxed">
          <h2>1. Cultural Respect</h2>
          <p>
            Users must interact with the platform and its AI tutor with respect for Acholi traditions. Any use of the platform to generate hateful or culturally offensive content is strictly prohibited.
          </p>

          <h2>2. No Professional Advice</h2>
          <p>
            While LyecAI provides cultural and linguistic guidance, it is should not be taken as a definitive legal or historical authority. Our archives are living documents.
          </p>

          <h2>3. Intellectual Property</h2>
          <p>
            The Acholi language and heritage belong to its people. The code and AI implementation are the intellectual property of the developers.
          </p>

          <h2>4. Termination</h2>
          <p>
            We reserve the right to restrict access to the archives for users who violate the core principles of cultural preservation and respect.
          </p>
        </div>
      </div>
    </div>
  );
}
