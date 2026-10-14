import React, { useState } from 'react';
import { X, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/audio';

interface GetOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GetOfferModal: React.FC<GetOfferModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-sm bg-[#161821] border border-[#2b3042] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-90 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Promo Header */}
        <div className="p-5 text-center bg-gradient-to-b from-emerald-500/20 via-[#161821] to-[#161821] pt-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-black text-[11px] font-black uppercase tracking-wider mb-2 shadow-md shadow-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Limited Time Deal • 50% OFF</span>
          </div>

          <h2 className="text-xl font-black text-white">Unlock Yousician Premium+</h2>
          <p className="text-xs text-gray-400 mt-1">
            Unlimited song access, Metallica masterclass & multi-instrument learning
          </p>
        </div>

        {/* Feature List */}
        <div className="px-5 space-y-2 mb-4">
          {[
            'Unlimited practice time with real-time audio feedback',
            'Over 10,000+ popular songs and artist lessons',
            'All instruments included: Guitar, Piano, Bass, Ukulele',
            'Personalized practice paths & level assessments',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Plan Toggles */}
        <div className="px-5 space-y-2 mb-4">
          {/* Yearly Plan */}
          <div
            onClick={() => {
              sound.playClick();
              setSelectedPlan('yearly');
            }}
            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              selectedPlan === 'yearly'
                ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-[#1b1f2b] border-[#292e40] text-gray-400'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">Annual Membership</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-black">
                  Save 50%
                </span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">$6.99 / month (billed annually)</div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === 'yearly'
                  ? 'border-emerald-500 bg-emerald-500 text-black'
                  : 'border-gray-500'
              }`}
            >
              {selectedPlan === 'yearly' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>

          {/* Monthly Plan */}
          <div
            onClick={() => {
              sound.playClick();
              setSelectedPlan('monthly');
            }}
            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              selectedPlan === 'monthly'
                ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'bg-[#1b1f2b] border-[#292e40] text-gray-400'
            }`}
          >
            <div>
              <span className="text-xs font-black text-white">Monthly Flexible</span>
              <div className="text-[11px] text-gray-400 mt-0.5">$13.99 / month, cancel anytime</div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === 'monthly'
                  ? 'border-emerald-500 bg-emerald-500 text-black'
                  : 'border-gray-500'
              }`}
            >
              {selectedPlan === 'monthly' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="p-5 pt-0">
          <button
            onClick={() => {
              sound.playSuccessSound();
              alert('🎉 You unlocked the Yousician Prototype Offer! Enjoy unlimited access.');
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-300 active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Start 7-Day Free Trial</span>
          </button>
          <p className="text-[10px] text-gray-500 text-center mt-2">
            Cancel anytime in Google Play / App Store before trial ends.
          </p>
        </div>
      </div>
    </div>
  );
};
