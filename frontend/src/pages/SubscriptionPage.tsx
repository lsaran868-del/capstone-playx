import React, { useEffect, useState } from 'react';
import { Crown, Check, Sparkles, Zap } from 'lucide-react';
import api from '../services/api';
import { SubscriptionPlan } from '../types';
import { useAuth } from '../context/AuthContext';

const SubscriptionPage: React.FC = () => {
  const { user, upgradeSubscription } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/subscriptions/plans');
        setPlans(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleUpgrade = async (planId: string) => {
    setUpgrading(true);
    try {
      await upgradeSubscription(planId);
      alert('Congratulations! Demo subscription upgraded to Premium!');
    } catch (err) {
      console.error(err);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 pb-20 select-none max-w-5xl mx-auto">
      {/* Banner */}
      <div className="text-center space-y-3 pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-400 text-xs font-extrabold uppercase tracking-wider border border-amber-500/30">
          <Crown className="w-4 h-4" />
          <span>PLAYX Premium</span>
        </div>
        <h1 className="text-4xl font-black text-white">Experience Music Without Limits</h1>
        <p className="text-sm text-spotify-subtext max-w-xl mx-auto">
          Ad-free listening, High-Fidelity audio quality, unlimited skips, and offline listening.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {plans.map((plan) => {
          const isCurrent = (user?.subscription || 'Free') === plan.name;
          const isPremium = plan.name === 'Premium';

          return (
            <div
              key={plan.id}
              className={`p-8 rounded-3xl flex flex-col justify-between relative transition-all duration-300 ${
                isPremium
                  ? 'bg-gradient-to-b from-spotify-card via-spotify-card to-emerald-950/40 border-2 border-spotify-green shadow-2xl shadow-spotify-green/10'
                  : 'bg-spotify-card border border-spotify-hover/40'
              }`}
            >
              {isPremium && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-spotify-green text-black font-black text-[10px] uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">{plan.name} Plan</h3>
                  <p className="text-xs text-spotify-subtext">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-xs font-semibold text-spotify-subtext">/ month</span>
                </div>

                <div className="space-y-3 border-t border-spotify-hover/40 pt-6">
                  {plan.features?.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs font-medium text-white">
                      <div className="w-5 h-5 rounded-full bg-spotify-green/20 text-spotify-green flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-full bg-spotify-hover text-spotify-subtext font-bold text-xs cursor-default"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading}
                    className={`w-full py-3.5 rounded-full font-bold text-xs transition-transform hover:scale-105 shadow-xl ${
                      isPremium
                        ? 'bg-spotify-green text-black shadow-spotify-green/20'
                        : 'bg-white text-black'
                    }`}
                  >
                    {upgrading ? 'Upgrading...' : `Upgrade to ${plan.name} (Demo)`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPage;
