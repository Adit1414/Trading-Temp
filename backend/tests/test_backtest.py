"""
tests/test_backtest.py — Binance Crypto Backtesting Engine
38 tests covering schemas, strategies, simulation, statistics, chart, engine, API.
"""
from __future__ import annotations
import asyncio, math
from datetime import date
from typing import Any, Dict
from unittest.mock import AsyncMock, patch

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.backtest.engine import BacktestError, run_backtest
from app.modules.backtest.performance import simulate_trades, synthesize
from app.modules.backtest.strategies import get_strategy
from app.modules.backtest.strategies.base import SIGNAL_BUY, SIGNAL_HOLD, SIGNAL_SELL, StrategyConfigError
from app.schemas.backtest import BacktestRunRequest, OrderSizeMode, StrategyName

client = TestClient(app)

# ─── Fixtures ─────────────────────────────────────────────────────────────────
def _df(n=100, p=30000.0):
    np.random.seed(42)
    px = p + np.cumsum(np.random.randn(n) * 50)
    idx = pd.date_range("2024-01-01", periods=n, freq="D", tz="UTC")
    return pd.DataFrame({"open": px, "high": px*1.005, "low": px*0.995,
                         "close": px + np.random.randn(n)*20,
                         "volume": abs(np.random.randn(n))*1e6+1e5}, index=idx)

def _req(**kw):
    d = dict(strategy=StrategyName.EMA_CROSSOVER,
             strategy_config={"fast_period": 12, "slow_period": 26, "source": "CLOSE"},
             name="Test", symbol="BTCUSDT", interval="1d", trading_market="BINANCE",
             initial_cash=10000.0, commission=0.001, slippage=0.0005,
             order_size_mode=OrderSizeMode.PCT_EQUITY, order_size_pct=100.0,
             intraday=False, start_date=date(2024,1,1), end_date=date(2024,6,30))
    d.update(kw); return BacktestRunRequest(**d)

def _bars(n=100):
    from app.services.market_data.base import OHLCV
    np.random.seed(0)
    px = 30000 + np.cumsum(np.random.randn(n)*50)
    idx = pd.date_range("2024-01-01", periods=n, freq="D", tz="UTC")
    return [OHLCV(str(ts), float(p), float(p*1.005), float(p*0.995), float(p+10), 5e5)
            for ts, p in zip(idx, px)]

def _sim(df):
    return simulate_trades(df, 10000, 0.001, 0.0005, OrderSizeMode.PCT_EQUITY, 100.0, None, False)

# ─── Schema tests ──────────────────────────────────────────────────────────────
class TestSchemas:
    def test_symbol_uppercased(self): assert _req(symbol="btcusdt").symbol == "BTCUSDT"
    def test_bad_dates_raise(self):
        from pydantic import ValidationError
        with pytest.raises(ValidationError): _req(start_date=date(2024,6,30), end_date=date(2024,1,1))
    def test_nse_rejected(self):
        from pydantic import ValidationError
        with pytest.raises(ValidationError): _req(trading_market="NSE")
    def test_fixed_usdt_needs_amount(self):
        from pydantic import ValidationError
        with pytest.raises(ValidationError): _req(order_size_mode=OrderSizeMode.FIXED_USDT, order_size_usdt=None)

# ─── EMA strategy ─────────────────────────────────────────────────────────────
class TestEMA:
    s = get_strategy("EMA_CROSSOVER", {"fast_period": 12, "slow_period": 26})

    def test_signal_column(self): assert "signal" in self.s.generate_signals(_df(60)).columns
    def test_signals_valid(self): assert self.s.generate_signals(_df(60))["signal"].isin([-1,0,1]).all()
    def test_warmup_zeroed(self):
        r = self.s.generate_signals(_df(60))
        assert (r["signal"].iloc[:self.s.slow_period] == SIGNAL_HOLD).all()
    def test_range_fast(self):
        with pytest.raises(StrategyConfigError): get_strategy("EMA_CROSSOVER", {"fast_period": 2, "slow_period": 26})
    def test_range_slow(self):
        with pytest.raises(StrategyConfigError): get_strategy("EMA_CROSSOVER", {"fast_period": 12, "slow_period": 201})
    def test_source_hl2(self):
        s = get_strategy("EMA_CROSSOVER", {"fast_period": 12, "slow_period": 26, "source": "HL2"})
        assert s.generate_signals(_df(60))["signal"].isin([-1,0,1]).all()
    def test_source_invalid(self):
        with pytest.raises(StrategyConfigError): get_strategy("EMA_CROSSOVER", {"fast_period": 12, "slow_period": 26, "source": "VWAP"})

# ─── RSI strategy ─────────────────────────────────────────────────────────────
class TestRSI:
    s = get_strategy("RSI_DIVERGENCE", {"period": 14, "lookback_periods": 5})

    def test_rsi_column(self): assert "rsi" in self.s.generate_signals(_df(80)).columns
    def test_rsi_bounds(self):
        r = self.s.generate_signals(_df(80))["rsi"].dropna()
        assert (r >= 0).all() and (r <= 100).all()
    def test_lookback_range(self):
        with pytest.raises(StrategyConfigError): get_strategy("RSI_DIVERGENCE", {"lookback_periods": 11})
    def test_oversold_range(self):
        with pytest.raises(StrategyConfigError): get_strategy("RSI_DIVERGENCE", {"oversold": 5})
    def test_overbought_range(self):
        with pytest.raises(StrategyConfigError): get_strategy("RSI_DIVERGENCE", {"overbought": 95})

# ─── Bollinger bands ──────────────────────────────────────────────────────────
class TestBB:
    s = get_strategy("BOLLINGER_BANDS", {"period": 20, "std_dev": 2.0})

    def test_band_columns(self):
        r = self.s.generate_signals(_df(80))
        for c in ("bb_mid","bb_upper","bb_lower"): assert c in r.columns
    def test_upper_above_lower(self):
        r = self.s.generate_signals(_df(80)).dropna()
        assert (r["bb_upper"] >= r["bb_lower"]).all()
    def test_period_range(self):
        with pytest.raises(StrategyConfigError): get_strategy("BOLLINGER_BANDS", {"period": 5})
    def test_std_range(self):
        with pytest.raises(StrategyConfigError): get_strategy("BOLLINGER_BANDS", {"std_dev": 4.0})

# ─── MACD strategy ────────────────────────────────────────────────────────────
class TestMACD:
    s = get_strategy("MACD_SIGNAL", {"fast_period": 12, "slow_period": 26, "signal_period": 9})

    def test_macd_columns(self):
        r = self.s.generate_signals(_df(80))
        for c in ("macd_line","macd_signal","macd_hist"): assert c in r.columns
    def test_fast_range(self):
        with pytest.raises(StrategyConfigError): get_strategy("MACD_SIGNAL", {"fast_period": 5, "slow_period": 26, "signal_period": 9})
    def test_signal_range(self):
        with pytest.raises(StrategyConfigError): get_strategy("MACD_SIGNAL", {"fast_period": 12, "slow_period": 26, "signal_period": 2})

# ─── Simulation ───────────────────────────────────────────────────────────────
class TestSimulation:
    def test_equity_length(self):
        s = get_strategy("EMA_CROSSOVER", {"fast_period": 12, "slow_period": 26})
        df = s.generate_signals(_df(60))
        eq, _, _, _ = _sim(df)
        assert len(eq) == len(df)
    def test_initial_equity(self):
        s = get_strategy("EMA_CROSSOVER", {"fast_period": 12, "slow_period": 26})
        df = s.generate_signals(_df(60))
        eq, _, _, _ = _sim(df)
        assert eq[0].value == 10000.0
    def test_no_negative(self):
        s = get_strategy("EMA_CROSSOVER", {"fast_period": 12, "slow_period": 26})
        df = s.generate_signals(_df(60))
        _, _, final, _ = _sim(df)
        assert final >= 0
    def test_commissions_tracked(self):
        s = get_strategy("EMA_CROSSOVER", {"fast_period": 12, "slow_period": 26})
        df = s.generate_signals(_df(60))
        _, raw, _, comm = _sim(df)
        if raw: assert comm > 0

# ─── Statistics ───────────────────────────────────────────────────────────────
class TestStatistics:
    def _get_stats(self):
        s  = get_strategy("EMA_CROSSOVER", {"fast_period": 12, "slow_period": 26})
        df = s.generate_signals(_df(80))
        eq, raw, _, comm = _sim(df)
        return synthesize(eq, raw, 10000, df, comm)

    def test_all_fields_present(self):
        stats, _ = self._get_stats()
        for f in ("equity_final","equity_peak","sharpe_ratio","sortino_ratio",
                  "calmar_ratio","cagr_pct","buy_hold_return_pct","alpha_pct","beta",
                  "max_drawdown_pct","avg_drawdown_pct","max_drawdown_duration",
                  "avg_drawdown_duration","exposure_time_pct","commissions_paid"):
            assert hasattr(stats, f), f"Missing field: {f}"

    def test_win_rate_bounds(self):
        stats, _ = self._get_stats()
        assert 0.0 <= stats.win_rate <= 100.0

    def test_equity_peak_gte_final(self):
        stats, _ = self._get_stats()
        assert stats.equity_peak >= stats.equity_final - 0.01

    def test_duration_strings(self):
        stats, _ = self._get_stats()
        assert isinstance(stats.max_drawdown_duration, str)
        assert isinstance(stats.avg_drawdown_duration, str)

    def test_trade_records_have_quantity_usdt(self):
        _, records = self._get_stats()
        for r in records: assert r.quantity_usdt > 0

# ─── Engine integration ───────────────────────────────────────────────────────
class TestEngine:
    def test_success(self):
        bars = _bars(100)
        with patch("app.modules.backtest.engine.get_historical_data", new_callable=AsyncMock) as m:
            m.return_value = bars
            r = asyncio.get_event_loop().run_until_complete(run_backtest(_req()))
        assert r.status.value == "COMPLETED"
        assert r.chart_html
        assert "<html" in r.chart_html.lower()

    def test_no_data_raises(self):
        with patch("app.modules.backtest.engine.get_historical_data", new_callable=AsyncMock) as m:
            m.return_value = []
            with pytest.raises(BacktestError, match="No data"):
                asyncio.get_event_loop().run_until_complete(run_backtest(_req()))

    def test_insufficient_bars(self):
        with patch("app.modules.backtest.engine.get_historical_data", new_callable=AsyncMock) as m:
            m.return_value = _bars(5)
            with pytest.raises(BacktestError, match="Insufficient"):
                asyncio.get_event_loop().run_until_complete(run_backtest(_req()))

# ─── API ──────────────────────────────────────────────────────────────────────
class TestAPI:
    def test_health(self): assert client.get("/health").status_code == 200
    def test_strategies(self):
        resp = client.get("/api/v1/backtest/strategies")
        assert resp.status_code == 200
        data = resp.json()
        ids = [s["id"] for s in data]
        for sid in ("EMA_CROSSOVER","RSI_DIVERGENCE","BOLLINGER_BANDS","MACD_SIGNAL"):
            assert sid in ids
        # Each entry should have config_schema
        for s in data:
            assert "config_schema" in s
            assert "description" in s

    def test_bad_dates_422(self):
        p = {"strategy":"EMA_CROSSOVER","strategy_config":{},"name":"T","symbol":"BTCUSDT",
             "interval":"1d","trading_market":"BINANCE","initial_cash":10000,
             "commission":0.001,"slippage":0.0005,"order_size_mode":"PCT_EQUITY",
             "order_size_pct":100,"intraday":False,"start_date":"2024-06-30","end_date":"2024-01-01"}
        assert client.post("/api/v1/backtest/run", json=p).status_code == 422

    def test_nse_rejected_422(self):
        p = {"strategy":"EMA_CROSSOVER","strategy_config":{},"name":"T","symbol":"RELIANCE",
             "interval":"1d","trading_market":"NSE","initial_cash":10000,
             "commission":0.001,"slippage":0.0005,"order_size_mode":"PCT_EQUITY",
             "order_size_pct":100,"intraday":False,"start_date":"2024-01-01","end_date":"2024-06-30"}
        assert client.post("/api/v1/backtest/run", json=p).status_code == 422

    def test_full_run_mocked(self):
        bars = _bars(100)
        p = {"strategy":"EMA_CROSSOVER",
             "strategy_config":{"fast_period":12,"slow_period":26,"source":"CLOSE"},
             "name":"Full","symbol":"BTCUSDT","interval":"1d","trading_market":"BINANCE",
             "initial_cash":10000,"commission":0.001,"slippage":0.0005,
             "order_size_mode":"PCT_EQUITY","order_size_pct":100,
             "intraday":False,"start_date":"2024-01-01","end_date":"2024-04-10"}
        with patch("app.modules.backtest.engine.get_historical_data", new_callable=AsyncMock) as m:
            m.return_value = bars
            resp = client.post("/api/v1/backtest/run", json=p)
        assert resp.status_code == 200
        d = resp.json()
        assert d["status"] == "COMPLETED"
        assert "chart_html" in d
        stats = d["statistics"]
        for k in ("sharpe_ratio","sortino_ratio","calmar_ratio","cagr_pct",
                  "buy_hold_return_pct","alpha_pct","beta","max_drawdown_pct",
                  "avg_drawdown_pct","commissions_paid","exposure_time_pct"):
            assert k in stats, f"Missing stat: {k}"
