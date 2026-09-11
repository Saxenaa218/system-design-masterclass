import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, DollarSign, TrendingUp } from 'lucide-react';

interface OrderLevel {
  price: number;
  qty: number;
  total: number;
}

interface TradeTapeItem {
  id: string;
  price: number;
  qty: number;
  side: 'BUY' | 'SELL';
  time: string;
}

export const OrderBookVisualizer: React.FC = () => {
  const [bids, setBids] = useState<OrderLevel[]>([
    { price: 182.40, qty: 450, total: 450 },
    { price: 182.35, qty: 820, total: 1270 },
    { price: 182.30, qty: 1200, total: 2470 },
    { price: 182.25, qty: 2500, total: 4970 },
    { price: 182.20, qty: 5000, total: 9970 },
  ]);

  const [asks, setAsks] = useState<OrderLevel[]>([
    { price: 182.45, qty: 350, total: 350 },
    { price: 182.50, qty: 900, total: 1250 },
    { price: 182.55, qty: 1400, total: 2650 },
    { price: 182.60, qty: 3100, total: 5750 },
    { price: 182.65, qty: 4800, total: 10550 },
  ]);

  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [priceInput, setPriceInput] = useState<number>(182.45);
  const [qtyInput, setQtyInput] = useState<number>(200);
  const [trades, setTrades] = useState<TradeTapeItem[]>([
    { id: 't-1', price: 182.42, qty: 100, side: 'BUY', time: '14:32:01.002' },
    { id: 't-2', price: 182.40, qty: 300, side: 'SELL', time: '14:32:02.145' },
  ]);

  const bestBid = bids[0]?.price || 0;
  const bestAsk = asks[0]?.price || 0;
  const spread = (bestAsk - bestBid).toFixed(2);

  const handlePlaceOrder = () => {
    const qty = Number(qtyInput);
    const price = orderType === 'MARKET' ? (orderSide === 'BUY' ? bestAsk : bestBid) : Number(priceInput);

    if (orderSide === 'BUY' && price >= bestAsk) {
      // Crosses spread -> Immediate Execution Match
      const execQty = Math.min(qty, asks[0].qty);
      const newTrade: TradeTapeItem = {
        id: `t-${Date.now()}`,
        price: bestAsk,
        qty: execQty,
        side: 'BUY',
        time: new Date().toLocaleTimeString() + `.${Math.floor(Math.random() * 900 + 100)}`
      };
      setTrades(prev => [newTrade, ...prev.slice(0, 7)]);

      // Update Asks
      if (asks[0].qty <= execQty) {
        setAsks(prev => prev.slice(1));
      } else {
        setAsks(prev => [{ ...prev[0], qty: prev[0].qty - execQty }, ...prev.slice(1)]);
      }
    } else if (orderSide === 'SELL' && price <= bestBid) {
      // Crosses spread -> Immediate Execution Match
      const execQty = Math.min(qty, bids[0].qty);
      const newTrade: TradeTapeItem = {
        id: `t-${Date.now()}`,
        price: bestBid,
        qty: execQty,
        side: 'SELL',
        time: new Date().toLocaleTimeString() + `.${Math.floor(Math.random() * 900 + 100)}`
      };
      setTrades(prev => [newTrade, ...prev.slice(0, 7)]);

      // Update Bids
      if (bids[0].qty <= execQty) {
        setBids(prev => prev.slice(1));
      } else {
        setBids(prev => [{ ...prev[0], qty: prev[0].qty - execQty }, ...prev.slice(1)]);
      }
    } else {
      // Passive Limit Order -> Insert into Order Book
      if (orderSide === 'BUY') {
        const newBids = [...bids, { price, qty, total: qty }].sort((a, b) => b.price - a.price);
        setBids(newBids);
      } else {
        const newAsks = [...asks, { price, qty, total: qty }].sort((a, b) => a.price - b.price);
        setAsks(newAsks);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Ticker Bar */}
      <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>AAPL / USD</span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-emerald)' }}>${bestBid.toFixed(2)}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Spread: ${spread}</span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          Matching Engine Latency: &lt; 42 µs | Sequencer FIFO
        </div>
      </div>

      {/* Main Order Book & Order Form Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr minmax(220px, 260px)', gap: '20px' }}>
        {/* Order Entry Form */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '14px', color: '#fff' }}>Order Entry (FIX)</h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => setOrderSide('BUY')}
              className={`btn ${orderSide === 'BUY' ? 'btn-emerald' : 'btn-secondary'}`}
              style={{ fontSize: '12px', padding: '8px' }}
            >
              BUY / BID
            </button>
            <button
              onClick={() => setOrderSide('SELL')}
              className={`btn ${orderSide === 'SELL' ? 'btn-rose' : 'btn-secondary'}`}
              style={{ fontSize: '12px', padding: '8px' }}
            >
              SELL / ASK
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => setOrderType('LIMIT')}
              className={`btn ${orderType === 'LIMIT' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '6px' }}
            >
              Limit Order
            </button>
            <button
              onClick={() => setOrderType('MARKET')}
              className={`btn ${orderType === 'MARKET' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '6px' }}
            >
              Market Order
            </button>
          </div>

          {orderType === 'LIMIT' && (
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Limit Price ($):</label>
              <input
                type="number"
                step="0.05"
                value={priceInput}
                onChange={(e) => setPriceInput(Number(e.target.value))}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: '#fff', fontSize: '13px', width: '100%' }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Quantity (Shares):</label>
            <input
              type="number"
              step="50"
              value={qtyInput}
              onChange={(e) => setQtyInput(Number(e.target.value))}
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: '#fff', fontSize: '13px', width: '100%' }}
            />
          </div>

          <button
            className={`btn ${orderSide === 'BUY' ? 'btn-emerald' : 'btn-rose'}`}
            onClick={handlePlaceOrder}
            style={{ marginTop: '8px' }}
          >
            {orderSide === 'BUY' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            Submit {orderSide} Order
          </button>
        </div>

        {/* L2 Depth Order Book Table */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', height: '100%' }}>
            {/* Bids Column */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--accent-emerald-light)', marginBottom: '8px' }}>
                <span>BUY (BIDS)</span>
                <span>QTY</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {bids.map(b => (
                  <div key={b.price} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.08)', padding: '5px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>${b.price.toFixed(2)}</span>
                    <span style={{ color: '#fff' }}>{b.qty.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Asks Column */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '8px' }}>
                <span>SELL (ASKS)</span>
                <span>QTY</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {asks.map(a => (
                  <div key={a.price} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(244, 63, 94, 0.08)', padding: '5px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>${a.price.toFixed(2)}</span>
                    <span style={{ color: '#fff' }}>{a.qty.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trade Tape / Executions */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '13px', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} color="var(--accent-cyan)" /> Real-Time Trades
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '220px' }}>
            {trades.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.2)', padding: '4px 6px', borderRadius: '3px' }}>
                <span style={{ color: t.side === 'BUY' ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
                  ${t.price.toFixed(2)}
                </span>
                <span style={{ color: '#fff' }}>{t.qty}</span>
                <span style={{ color: 'var(--text-dim)' }}>{t.time.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
