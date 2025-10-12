import React, { useState, useEffect } from 'react';
import type { Analysis, Feedback } from '../types';
import { LS_KEYS } from '../types';
import { TrendIcon, SupportResistanceIcon, CandlestickIcon, IndicatorIcon, RecommendationIcon, ThumbsUpIcon, ThumbsDownIcon, BrainIcon } from './icons';

interface AnalysisResultProps {
    analysis: Analysis;
}

const AnalysisItem: React.FC<{ icon: React.ReactNode; title: string; content: string, delay?: number }> = ({ icon, title, content, delay = 0 }) => (
    <div 
        className="flex items-start space-x-4 p-4 bg-gray-900/50 rounded-lg animate-fade-in-up"
        style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
        <div className="flex-shrink-0 h-8 w-8 text-amber-400">{icon}</div>
        <div>
            <h4 className="font-semibold text-lg text-white">{title}</h4>
            <p className="text-gray-300">{content}</p>
        </div>
    </div>
);

const RecommendationItem: React.FC<{ label: string; value: string; rationale?: string; }> = ({ label, value, rationale }) => (
    <div className="py-2 border-b border-gray-700 last:border-b-0">
        <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">{label}</span>
            <span className="font-mono text-white bg-gray-700 px-2 py-1 rounded">{value}</span>
        </div>
        {rationale && (
            <p className="text-xs text-gray-400 italic pt-1.5 pl-1">
                {rationale}
            </p>
        )}
    </div>
);


export const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis }) => {
    const { recommendation } = analysis;
    const isBuy = recommendation.action.toLowerCase() === 'buy';
    const actionColor = isBuy ? 'text-green-400' : 'text-red-400';
    const actionBgColor = isBuy ? 'bg-green-900/50' : 'bg-red-900/50';

    const riskProfileColor = recommendation.riskProfile === 'Low' 
        ? 'bg-teal-900/70 text-teal-300' 
        : 'bg-amber-900/70 text-amber-300';

    const [rating, setRating] = useState<'helpful' | 'unhelpful' | null>(null);
    const [textFeedback, setTextFeedback] = useState('');
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    // Reset feedback state when a new analysis is provided
    useEffect(() => {
        setRating(null);
        setTextFeedback('');
        setFeedbackSubmitted(false);
    }, [analysis]);

    const handleFeedbackSubmit = () => {
        if (!rating) return;

        const newFeedback: Feedback = {
            timestamp: new Date().toISOString(),
            rating,
            text: textFeedback.trim(),
            analysis,
        };
        
        try {
            const existingFeedbackStr = localStorage.getItem(LS_KEYS.FEEDBACK);
            const existingFeedback = existingFeedbackStr ? JSON.parse(existingFeedbackStr) : [];
            const updatedFeedback = [...existingFeedback, newFeedback];
            localStorage.setItem(LS_KEYS.FEEDBACK, JSON.stringify(updatedFeedback));
            setFeedbackSubmitted(true);
        } catch (error) {
            console.error("Failed to save feedback to localStorage", error);
        }
    };

    return (
        <div className="w-full space-y-4">
            <AnalysisItem icon={<TrendIcon />} title="Trend Utama" content={analysis.trend} delay={0} />
            <AnalysisItem icon={<SupportResistanceIcon />} title="Support & Resistance" content={analysis.supportResistance} delay={100} />
            <AnalysisItem icon={<CandlestickIcon />} title="Pola Candlestick" content={analysis.candlestick} delay={200} />
            <AnalysisItem icon={<IndicatorIcon />} title="Indikator (MA, RSI, MACD)" content={analysis.indicators} delay={300} />
            <AnalysisItem icon={<BrainIcon />} title="Penjelasan Analisa & Strategi" content={analysis.explanation} delay={400} />
            
            <div 
                className="flex items-start space-x-4 p-4 bg-gray-900/50 rounded-lg animate-fade-in-up"
                style={{ animationDelay: '500ms', opacity: 0 }}
            >
                <div className={`flex-shrink-0 h-8 w-8 ${actionColor}`}><RecommendationIcon /></div>
                <div className="flex-grow">
                    <div className="flex flex-wrap gap-2 justify-between items-center mb-2">
                        <h4 className="font-semibold text-lg text-white">Rekomendasi Entry</h4>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${riskProfileColor}`}>
                                {recommendation.riskProfile} Risk
                            </span>
                            <span className={`px-3 py-1 text-sm font-bold rounded-full uppercase tracking-wider ${actionColor} ${actionBgColor}`}>
                                {recommendation.action}
                            </span>
                        </div>
                    </div>
                    <div className="mt-2">
                        <RecommendationItem label="Entry" value={recommendation.entry} rationale={recommendation.entryRationale} />
                        <RecommendationItem label="Stop Loss" value={recommendation.stopLoss} />
                        {recommendation.takeProfit.map((tp, index) => (
                           <RecommendationItem key={index} label={`Take Profit ${index + 1}`} value={tp} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Feedback Section */}
            <div 
                className="p-4 bg-gray-900/50 rounded-lg animate-fade-in-up"
                style={{ animationDelay: '600ms', opacity: 0 }}
            >
                {feedbackSubmitted ? (
                    <div className="text-center py-4">
                        <h4 className="font-semibold text-lg text-green-400">Thank you for your feedback!</h4>
                        <p className="text-gray-400 text-sm mt-1">Your input helps us improve the AI analysis.</p>
                    </div>
                ) : (
                    <>
                        <h4 className="font-semibold text-lg text-white mb-3 text-center">Was this analysis helpful?</h4>
                        <div className="flex justify-center items-center space-x-4">
                            <button
                                onClick={() => setRating('helpful')}
                                className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${rating === 'helpful' ? 'bg-green-500/20 text-green-400 ring-2 ring-green-500' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}`}
                                aria-label="Helpful"
                            >
                                <ThumbsUpIcon className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => setRating('unhelpful')}
                                className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${rating === 'unhelpful' ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}`}
                                aria-label="Not Helpful"
                            >
                                <ThumbsDownIcon className="w-6 h-6" />
                            </button>
                        </div>
                        {rating && (
                            <div className="mt-4 animate-fade-in-up" style={{opacity: 0, animationDelay: '100ms'}}>
                                <textarea
                                    value={textFeedback}
                                    onChange={(e) => setTextFeedback(e.target.value)}
                                    placeholder="Optional: Tell us more..."
                                    rows={3}
                                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                />
                                <button
                                    onClick={handleFeedbackSubmit}
                                    className="w-full mt-2 font-semibold py-2 px-4 rounded-lg transition-all duration-300 bg-amber-600 text-white hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    Submit Feedback
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

        </div>
    );
};

// Global animation styles
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
@keyframes pulse-shadow {
    0%, 100% {
        box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.2), 0 4px 6px -2px rgba(245, 158, 11, 0.1);
    }
    50% {
        box-shadow: 0 20px 25px -5px rgba(245, 158, 11, 0.3), 0 10px 10px -5px rgba(245, 158, 11, 0.2);
    }
}

.animate-fade-in-down {
  animation: fadeInDown 0.6s ease-out forwards;
}
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}
.animate-shake {
  animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
}
.animate-pulse-shadow {
    animation: pulse-shadow 2.5s infinite;
}
`;
document.head.appendChild(style);