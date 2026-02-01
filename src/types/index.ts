export type Period = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
export type View = 'dashboard' | 'curvas' | 'funding' | 'taxas' | 'historico' | 'posicoes' | 'configuracoes' | 'auth';

export interface EquityDataPoint {
  date: string;
  equityUSD: number;
  equityBTC: number;
  pnlCumulative: number;
  [key: string]: string | number;
}

export interface FundingDataPoint {
  date: string;
  BTCUSDT: number;
  ETHUSDT: number;
  SOLUSDT: number;
  total: number;
  [key: string]: string | number;
}

export interface FeesDataPoint {
  date: string;
  maker: number;
  taker: number;
  total: number;
  [key: string]: string | number;
}

export interface Trade {
  id: string;
  date: string;
  pair: string;
  direction: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  fees: number;
  duration: number;
}

export interface Position {
  id: string;
  asset: string;
  direction: 'LONG' | 'SHORT';
  leverage: number;
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercent: number;
  margin: number;
  liquidationPrice: number;
  fundingRate: number;
  fundingInterval: string;
}
