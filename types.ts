export const LS_KEYS = {
    PAIR_NAME: 'aiChartAnalyst_pairName',
    TIMEFRAME: 'aiChartAnalyst_timeframe',
    ANALYSIS: 'aiChartAnalyst_analysis',
    IMAGE_BASE64: 'aiChartAnalyst_imageBase64',
    IMAGE_MIME_TYPE: 'aiChartAnalyst_imageMimeType',
    RISK_PROFILE: 'aiChartAnalyst_riskProfile',
    FEEDBACK: 'aiChartAnalyst_feedback',
    USER: 'aiChartAnalyst_user'
};

export interface Analysis {
  trend: string;
  supportResistance: string;
  candlestick: string;
  indicators: string;
  explanation: string;
  recommendation: {
    action: string;
    entry: string;
    entryRationale: string;
    stopLoss: string;
    takeProfit: string[];
    riskProfile: 'Low' | 'Medium';
  };
}

export interface Feedback {
  timestamp: string;
  rating: 'helpful' | 'unhelpful';
  text?: string;
  analysis: Analysis;
}

export interface User {
    uid: string;
    name: string;
    email: string;
    code: string;
    picture: string;
    isAdmin: boolean;
}