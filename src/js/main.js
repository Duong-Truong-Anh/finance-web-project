// ─── Shared state ─────────────────────────────────────────────
const state = {
  netMonthly: 3145,
  ratio: 40,
  contribYears: 5,
  totalYears: 30,
  milestones: [10, 20, 30],
  growthLo: 0.15,
  growthHi: 0.20,
  tickers: [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  ],
  monthlyLedger: [
    { month: 'JAN', income: 5770, expenses: 2720 },
    { month: 'FEB', income: 4920, expenses: 2580 },
    { month: 'MAR', income: 6200, expenses: 2710 },
    { month: 'APR', income: 5770, expenses: 2840 },
    { month: 'MAY', income: 5770, expenses: 2625 },
    { month: 'JUN', income: 7020, expenses: 2690 },
    { month: 'JUL', income: 5770, expenses: 2750 },
    { month: 'AUG', income: 5770, expenses: 2625 },
    { month: 'SEP', income: 5120, expenses: 2600 },
    { month: 'OCT', income: 5770, expenses: 2830 },
    { month: 'NOV', income: 6450, expenses: 2920 },
    { month: 'DEC', income: 5770, expenses: 2625 },
  ],
};

// Which charts have had their entrance animation played
const animated = { projection: false, cashflow: false };

// GSAP tween object for smooth slider morphing
const tweenedRatio = { value: state.ratio };
let ratioTween = null;

// Last known inner dims for projection entrance animation
let projLastDims = { iW: 0, iH: 0 };

// Cashflow chart state shared with entrance animation
let _cf = {};

// ─── Formatters ───────────────────────────────────────────────
function fmt(v) {
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
  return '$' + Math.round(v);
}

function fmtFull(v) {
  return '$' + Math.round(v).toLocaleString();
}

// ─── Core math ────────────────────────────────────────────────
function buildSeries(ratio, rate) {
  const dep = state.netMonthly * (ratio / 100);
  const mr = rate / 12;
  const pts = [];
  let pv = 0;
  for (let yr = 0; yr <= state.totalYears; yr++) {
    pts.push({ year: yr, value: pv });
    const d = yr < state.contribYears ? dep : 0;
    for (let m = 0; m < 12; m++) pv = pv * (1 + mr) + d;
  }
  return pts;
}

// ─── Shared tooltip ───────────────────────────────────────────
const tooltip = document.getElementById('chart-tooltip');

function showTooltip(html, event) {
  tooltip.innerHTML = html;
  tooltip.style.visibility = 'visible';
  moveTooltip(event);
}

function moveTooltip(event) {
  const x = event.clientX + 14;
  const tw = tooltip.offsetWidth;
  tooltip.style.left = (x + tw > window.innerWidth ? x - tw - 28 : x) + 'px';
  tooltip.style.top = (event.clientY - 10) + 'px';
}

function hideTooltip() {
  tooltip.style.visibility = 'hidden';
}

// ─── Center panel ─────────────────────────────────────────────
function updateMetrics(ratio) {
  const invest = Math.round(state.netMonthly * ratio / 100);
  const save = state.netMonthly - invest;
  document.getElementById('slider-val').textContent = Math.round(ratio);
  document.getElementById('ratio-pct-display').textContent = Math.round(ratio);
  document.getElementById('monthly-invest-display').textContent = fmtFull(invest);
  document.getElementById('monthly-save-display').textContent = fmtFull(save);
  document.getElementById('alloc-invest-bar').style.width = ratio + '%';
}

function updateStocks(ratio) {
  const perStock = Math.round(state.netMonthly * ratio / 100 / state.tickers.length);
  document.getElementById('stock-rows').innerHTML = state.tickers.map(t => `
    <div class="stock-row">
      <span class="stock-ticker">${t.symbol}</span>
      <span class="stock-name">${t.name}</span>
      <span class="stock-alloc">${fmtFull(perStock)}/mo</span>
    </div>
  `).join('');
}

// ─── Projection chart ─────────────────────────────────────────
const projContainer = document.getElementById('chart-container');
const projMargin = { top: 28, right: 24, bottom: 50, left: 68 };

const projSvg = d3.select('#chart-container').append('svg').attr('width', '100%').attr('height', '100%');
const projDefs = projSvg.append('defs');
projDefs.append('clipPath').attr('id', 'proj-clip').append('rect');
const pg = projSvg.append('g').attr('transform', `translate(${projMargin.left},${projMargin.top})`);

const pgGrid   = pg.append('g');
const bandPath = pg.append('path').attr('clip-path', 'url(#proj-clip)').attr('fill', 'var(--band-fill)').attr('stroke', 'none');
const lineLo   = pg.append('path').attr('clip-path', 'url(#proj-clip)').attr('fill', 'none').attr('stroke', 'var(--band-stroke-lo)').attr('stroke-width', 1.5).attr('stroke-dasharray', '5 3');
const lineHi   = pg.append('path').attr('clip-path', 'url(#proj-clip)').attr('fill', 'none').attr('stroke', 'var(--band-stroke-hi)').attr('stroke-width', 2);
const pgMiles  = pg.append('g');
const pgXAxis  = pg.append('g');
const pgYAxis  = pg.append('g');
const pgLeg    = pg.append('g');
const pgCross  = pg.append('line').attr('stroke', '#2a2a2a').attr('stroke-width', 1).attr('stroke-dasharray', '3 3').style('visibility', 'hidden');
const pgOverlay = pg.append('rect').attr('fill', 'none').attr('pointer-events', 'all').style('cursor', 'crosshair');

let _proj = { lo: [], hi: [], xSc: null };

function drawProjection(ratio) {
  const W = projContainer.clientWidth, H = projContainer.clientHeight;
  const iW = W - projMargin.left - projMargin.right;
  const iH = H - projMargin.top - projMargin.bottom;
  if (iW <= 0 || iH <= 0) return;

  projLastDims = { iW, iH };
  projDefs.select('#proj-clip rect').attr('width', iW).attr('height', iH);

  const lo = buildSeries(ratio, state.growthLo);
  const hi = buildSeries(ratio, state.growthHi);
  _proj = { lo, hi, xSc: null };

  const xSc = d3.scaleLinear().domain([0, state.totalYears]).range([0, iW]);
  const ySc = d3.scaleLinear().domain([0, d3.max(hi, d => d.value)]).range([iH, 0]).nice();
  _proj.xSc = xSc;

  pgOverlay.attr('width', iW).attr('height', iH);
  pgCross.attr('y1', 0).attr('y2', iH);

  pgOverlay
    .on('mousemove', function(event) {
      const [mx] = d3.pointer(event);
      const yr = Math.round(_proj.xSc.invert(mx));
      const clampedYr = Math.max(0, Math.min(state.totalYears, yr));
      const loV = _proj.lo[clampedYr]?.value ?? 0;
      const hiV = _proj.hi[clampedYr]?.value ?? 0;
      pgCross.attr('x1', _proj.xSc(clampedYr)).attr('x2', _proj.xSc(clampedYr)).style('visibility', 'visible');
      showTooltip(`
        <div class="tt-year">YR ${clampedYr}</div>
        <div class="tt-row"><span>LOW (15%)</span><span>${fmt(loV)}</span></div>
        <div class="tt-row"><span>HIGH (20%)</span><span>${fmt(hiV)}</span></div>
        <div class="tt-row"><span>BAND SPREAD</span><span>${fmt(hiV - loV)}</span></div>
      `, event);
    })
    .on('mouseleave', function() { pgCross.style('visibility', 'hidden'); hideTooltip(); });

  const area = d3.area()
    .x(d => xSc(d.year)).y0((d, i) => ySc(lo[i].value)).y1(d => ySc(d.value))
    .curve(d3.curveCatmullRom);
  const line = d3.line()
    .x(d => xSc(d.year)).y(d => ySc(d.value))
    .curve(d3.curveCatmullRom);

  bandPath.datum(hi).attr('d', area);
  lineLo.datum(lo).attr('d', line);
  lineHi.datum(hi).attr('d', line);

  pgGrid.selectAll('*').remove();
  ySc.ticks(5).forEach(t => {
    pgGrid.append('line').attr('x1', 0).attr('x2', iW).attr('y1', ySc(t)).attr('y2', ySc(t))
      .attr('stroke', 'var(--border)').attr('stroke-width', 0.5).attr('opacity', 0.08);
  });

  const xAxis = d3.axisBottom(xSc)
    .tickValues(d3.range(0, state.totalYears + 1, 5))
    .tickFormat(d => `Yr${d}`).tickSize(4).tickPadding(6);
  pgXAxis.attr('transform', `translate(0,${iH})`).call(xAxis);
  pgXAxis.select('.domain').attr('stroke', '#333');
  pgXAxis.selectAll('.tick line').attr('stroke', '#333');
  pgXAxis.selectAll('.tick text').attr('fill', '#555').attr('font-size', 9).attr('font-family', 'Courier New,monospace');

  const yAxis = d3.axisLeft(ySc).ticks(5).tickFormat(d => fmt(d)).tickSize(4).tickPadding(6);
  pgYAxis.call(yAxis);
  pgYAxis.select('.domain').attr('stroke', '#333');
  pgYAxis.selectAll('.tick line').attr('stroke', '#333');
  pgYAxis.selectAll('.tick text').attr('fill', '#555').attr('font-size', 9).attr('font-family', 'Courier New,monospace');

  pgXAxis.selectAll('.x-label').remove();
  pgXAxis.append('text').attr('class', 'x-label')
    .attr('x', iW / 2).attr('y', 40).attr('text-anchor', 'middle')
    .attr('fill', '#333').attr('font-size', 9).attr('font-family', 'Courier New,monospace')
    .attr('letter-spacing', '.15em').text('YEARS →');

  pgMiles.selectAll('*').remove();
  state.milestones.forEach(yr => {
    const xp = xSc(yr);
    const loV = lo[yr].value, hiV = hi[yr].value;
    const yMid = ySc((loV + hiV) / 2);
    pgMiles.append('line').attr('x1', xp).attr('x2', xp).attr('y1', 0).attr('y2', iH)
      .attr('stroke', 'var(--accent2)').attr('stroke-width', 1).attr('stroke-dasharray', '4 3').attr('opacity', .35);
    pgMiles.append('text').attr('x', xp).attr('y', iH - 5).attr('text-anchor', 'middle')
      .attr('fill', 'var(--accent2)').attr('font-family', 'Courier New,monospace')
      .attr('font-size', 8).attr('font-weight', '700').attr('letter-spacing', '.1em').text(`YR${yr}`);
    const bw = 116, bh = 36;
    let bx = xp + 7, by = Math.max(2, yMid - bh / 2);
    if (bx + bw > iW - 4) bx = xp - bw - 7;
    if (by + bh > iH - 22) by = iH - 22 - bh;
    by = Math.max(2, by);
    const cg = pgMiles.append('g');
    cg.append('rect').attr('x', bx).attr('y', by).attr('width', bw).attr('height', bh)
      .attr('fill', '#0a0a0a').attr('stroke', '#2a2a2a').attr('stroke-width', 1);
    cg.append('text').attr('x', bx + 7).attr('y', by + 13)
      .attr('font-family', 'Courier New,monospace').attr('font-size', 8).attr('fill', '#3a3a3a').attr('letter-spacing', '.1em')
      .text(`YEAR ${yr} RANGE`);
    cg.append('text').attr('x', bx + 7).attr('y', by + 27)
      .attr('font-family', 'Courier New,monospace').attr('font-size', 11).attr('font-weight', '700').attr('fill', '#aaa')
      .text(`${fmt(loV)} – ${fmt(hiV)}`);
  });

  pgLeg.selectAll('*').remove();
  const lx = iW - 152, ly = 6;
  pgLeg.append('rect').attr('x', lx - 6).attr('y', ly - 2).attr('width', 158).attr('height', 58)
    .attr('fill', '#080808').attr('stroke', '#1a1a1a').attr('stroke-width', 1);
  [
    [0,  '─ ─ ─', 'var(--band-stroke-lo)', '15%/yr  (LOW)'],
    [18, '────',  'var(--band-stroke-hi)', '20%/yr  (HIGH)'],
    [36, '■',     'rgba(232,255,0,.2)',    'GROWTH BAND'],
  ].forEach(([dy, sym, col, lbl]) => {
    pgLeg.append('text').attr('x', lx).attr('y', ly + 14 + dy)
      .attr('font-family', 'Courier New,monospace').attr('font-size', 10).attr('fill', col)
      .text(sym + '  ' + lbl);
  });
}

// ─── Projection entrance animation ────────────────────────────
function runProjectionEntrance() {
  const clipRect = projDefs.select('#proj-clip rect').node();
  const { iW } = projLastDims;
  // Reveal chart left-to-right by tweening clipPath width 0 → iW
  gsap.from(clipRect, {
    attr: { width: 0 },
    duration: 1.4,
    ease: 'power3.inOut',
    onComplete: () => { animated.projection = true; },
  });
}

// ─── Monthly cashflow chart ────────────────────────────────────
const cfContainer = document.getElementById('cashflow-chart-container');
const cfMargin = { top: 24, right: 20, bottom: 36, left: 64 };
const cfSvg = d3.select('#cashflow-chart-container').append('svg')
  .attr('width', '100%').attr('height', '100%');

function drawCashflow(ratio) {
  const W = cfContainer.clientWidth, H = cfContainer.clientHeight;
  const iW = W - cfMargin.left - cfMargin.right;
  const iH = H - cfMargin.top - cfMargin.bottom;
  if (iW <= 0 || iH <= 0) return;

  // Full clear — rebuild from scratch every draw
  cfSvg.selectAll('*').remove();
  const g = cfSvg.append('g').attr('transform', `translate(${cfMargin.left},${cfMargin.top})`);

  const data = state.monthlyLedger.map(d => ({
    ...d,
    net: d.income - d.expenses,
    invest: Math.round((d.income - d.expenses) * ratio / 100),
  }));

  const months = data.map(d => d.month);
  const xSc  = d3.scaleBand().domain(months).range([0, iW]).padding(0.28);
  const ySc  = d3.scaleLinear().domain([0, d3.max(data, d => d.income)]).range([iH, 0]).nice();
  const subX = d3.scaleBand().domain(['income', 'expenses']).range([0, xSc.bandwidth()]).padding(0.06);
  const baseline = ySc(0);

  // ── Grid ───────────────────────────────────────────────────
  const gridG = g.append('g');
  ySc.ticks(4).forEach(t => {
    gridG.append('line')
      .attr('x1', 0).attr('x2', iW).attr('y1', ySc(t)).attr('y2', ySc(t))
      .attr('stroke', 'var(--border)').attr('stroke-width', 0.5).attr('opacity', 0.08);
  });

  // ── Bars ───────────────────────────────────────────────────
  const barsG = g.append('g');

  const incomeBars = barsG.selectAll('.income-bar')
    .data(data).join('rect').attr('class', 'income-bar')
    .attr('x', d => xSc(d.month) + subX('income'))
    .attr('width', subX.bandwidth())
    .attr('fill', 'var(--accent)').attr('opacity', 0.65).style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1);
      showTooltip(`
        <div class="tt-year">${d.month}</div>
        <div class="tt-row"><span>INCOME</span><span>${fmtFull(d.income)}</span></div>
        <div class="tt-row"><span>EXPENSES</span><span>${fmtFull(d.expenses)}</span></div>
        <div class="tt-row"><span>NET CF</span><span>${fmtFull(d.net)}</span></div>
        <div class="tt-row"><span>INVESTED</span><span>${fmtFull(d.invest)}</span></div>
      `, event);
    })
    .on('mousemove', moveTooltip)
    .on('mouseout', function() { d3.select(this).attr('opacity', 0.65); hideTooltip(); });

  const expBars = barsG.selectAll('.expense-bar')
    .data(data).join('rect').attr('class', 'expense-bar')
    .attr('x', d => xSc(d.month) + subX('expenses'))
    .attr('width', subX.bandwidth())
    .attr('fill', 'var(--accent2)').attr('opacity', 0.65).style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1);
      showTooltip(`
        <div class="tt-year">${d.month}</div>
        <div class="tt-row"><span>INCOME</span><span>${fmtFull(d.income)}</span></div>
        <div class="tt-row"><span>EXPENSES</span><span>${fmtFull(d.expenses)}</span></div>
        <div class="tt-row"><span>NET CF</span><span>${fmtFull(d.net)}</span></div>
        <div class="tt-row"><span>INVESTED</span><span>${fmtFull(d.invest)}</span></div>
      `, event);
    })
    .on('mousemove', moveTooltip)
    .on('mouseout', function() { d3.select(this).attr('opacity', 0.65); hideTooltip(); });

  if (!animated.cashflow) {
    // Entrance: start collapsed at baseline — runCashflowEntrance will grow them up
    incomeBars.attr('y', baseline).attr('height', 0);
    expBars.attr('y', baseline).attr('height', 0);
  } else {
    // Normal update: jump directly to final position
    incomeBars.attr('y', d => ySc(d.income)).attr('height', d => baseline - ySc(d.income));
    expBars.attr('y', d => ySc(d.expenses)).attr('height', d => baseline - ySc(d.expenses));
  }

  // ── Net flow line + dots ────────────────────────────────────
  const netG = g.append('g');
  const netLine = d3.line()
    .x(d => xSc(d.month) + xSc.bandwidth() / 2)
    .y(d => ySc(d.net))
    .curve(d3.curveCatmullRom);

  const netPath = netG.append('path').datum(data).attr('d', netLine)
    .attr('fill', 'none').attr('stroke', 'var(--accent3)')
    .attr('stroke-width', 2).attr('stroke-dasharray', '4 2');

  if (!animated.cashflow) {
    const len = netPath.node().getTotalLength();
    netPath.attr('stroke-dasharray', len).attr('stroke-dashoffset', len);
  }

  const dots = netG.selectAll('.net-dot').data(data).join('circle').attr('class', 'net-dot')
    .attr('cx', d => xSc(d.month) + xSc.bandwidth() / 2).attr('cy', d => ySc(d.net))
    .attr('r', animated.cashflow ? 3.5 : 0)
    .attr('fill', 'var(--accent3)').attr('stroke', 'var(--bg)').attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', 5);
      showTooltip(`
        <div class="tt-year">${d.month} — NET FLOW</div>
        <div class="tt-row"><span>NET CF</span><span>${fmtFull(d.net)}</span></div>
        <div class="tt-row"><span>INVESTED (${Math.round(ratio)}%)</span><span>${fmtFull(d.invest)}</span></div>
        <div class="tt-row"><span>SAVED</span><span>${fmtFull(d.net - d.invest)}</span></div>
      `, event);
    })
    .on('mousemove', moveTooltip)
    .on('mouseout', function() { d3.select(this).attr('r', 3.5); hideTooltip(); });

  // ── Axes ───────────────────────────────────────────────────
  const xAxisG = g.append('g').attr('transform', `translate(0,${iH})`)
    .call(d3.axisBottom(xSc).tickSize(4).tickPadding(6));
  xAxisG.select('.domain').attr('stroke', '#333');
  xAxisG.selectAll('.tick line').attr('stroke', '#333');
  xAxisG.selectAll('.tick text').attr('fill', '#555').attr('font-size', 9).attr('font-family', 'Courier New,monospace');

  const yAxisG = g.append('g')
    .call(d3.axisLeft(ySc).ticks(4).tickFormat(d => fmt(d)).tickSize(4).tickPadding(6));
  yAxisG.select('.domain').attr('stroke', '#333');
  yAxisG.selectAll('.tick line').attr('stroke', '#333');
  yAxisG.selectAll('.tick text').attr('fill', '#555').attr('font-size', 9).attr('font-family', 'Courier New,monospace');

  // ── Legend ─────────────────────────────────────────────────
  const legG = g.append('g');
  [
    ['var(--accent)',  '■  INCOME'],
    ['var(--accent2)', '■  EXPENSES'],
    ['var(--accent3)', '─  NET FLOW'],
  ].forEach(([col, label], i) => {
    legG.append('text').attr('x', iW - 220 + i * 76).attr('y', -8)
      .attr('fill', col).attr('font-size', 8).attr('font-family', 'Courier New,monospace')
      .attr('letter-spacing', '.1em').text(label);
  });

  // Store live D3 selections for the entrance animation
  _cf = { ySc, baseline, data, incomeBars, expBars, netPath, dots };

  renderCashflowTable(data, Math.round(ratio));
}

// ─── Cashflow entrance animation ──────────────────────────────
function runCashflowEntrance() {
  animated.cashflow = true; // prevent any re-draw from collapsing bars again

  const { ySc, baseline, data, incomeBars, expBars, netPath, dots } = _cf;

  // Both y and height move in one transition → y + height = baseline at every frame
  incomeBars
    .transition().duration(600).ease(d3.easeCubicOut)
    .delay((d, i) => 60 + i * 50)
    .attr('y', d => ySc(d.income))
    .attr('height', d => baseline - ySc(d.income));

  expBars
    .transition().duration(600).ease(d3.easeCubicOut)
    .delay((d, i) => 90 + i * 50)
    .attr('y', d => ySc(d.expenses))
    .attr('height', d => baseline - ySc(d.expenses));

  if (netPath) {
    gsap.to(netPath.node(), {
      strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', delay: 0.6,
    });
  }

  dots
    .transition().duration(300).ease(d3.easeBackOut.overshoot(2))
    .delay((d, i) => 1100 + i * 40)
    .attr('r', 3.5);
}

// ─── Milestone breakdown ──────────────────────────────────────
function renderMilestoneBreakdown(ratio) {
  const perStock = state.netMonthly * ratio / 100 / state.tickers.length;

  function stockSeries(rate) {
    const mr = rate / 12;
    let pv = 0;
    const vals = {};
    for (let yr = 0; yr <= state.totalYears; yr++) {
      if (state.milestones.includes(yr)) vals[yr] = pv;
      const d = yr < state.contribYears ? perStock : 0;
      for (let m = 0; m < 12; m++) pv = pv * (1 + mr) + d;
    }
    return vals;
  }

  const rows = state.tickers.map(t => {
    const lo = stockSeries(state.growthLo);
    const hi = stockSeries(state.growthHi);
    const cells = state.milestones.map(yr =>
      `<td class="ms-range">${fmt(lo[yr])} – ${fmt(hi[yr])}</td>`
    ).join('');
    return `<tr><td>${t.symbol}</td>${cells}</tr>`;
  }).join('');

  const headers = state.milestones.map(yr => `<th>Yr ${yr}</th>`).join('');
  document.getElementById('milestone-breakdown').innerHTML = `
    <table class="ms-table">
      <thead><tr><th>Ticker</th>${headers}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ─── Page entrance (runs once on load) ────────────────────────
function runPageEntrance() {
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

  // Beat 1 (0–0.5s): panels slide + fade in staggered
  tl.from('header, .header-right', {
    autoAlpha: 0, y: -8, duration: 0.35, stagger: 0.1,
  })
  .from('.panel', {
    autoAlpha: 0, y: 10, duration: 0.35, stagger: 0.07,
  }, '-=0.15')

  // Beat 2 (0.45s): projection chart reveals left-to-right
  .call(() => runProjectionEntrance(), null, 0.45)

  // Beat 3 (1.7s): metric numbers count up from 0
  .call(() => {
    const invest = Math.round(state.netMonthly * state.ratio / 100);
    const save   = state.netMonthly - invest;
    [
      { id: 'monthly-invest-display', target: invest },
      { id: 'monthly-save-display',   target: save },
    ].forEach(({ id, target }) => {
      const el  = document.getElementById(id);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 0.7, ease: 'power2.out',
        onUpdate() { el.textContent = fmtFull(obj.v); },
      });
    });
  }, 1.7);
}

// ─── Cashflow table ───────────────────────────────────────────
function renderCashflowTable(data, ratio) {
  const rows = data.map(d => `
    <tr>
      <td>${d.month}</td>
      <td class="income-cell">${fmtFull(d.income)}</td>
      <td class="expense-cell">−${fmtFull(d.expenses)}</td>
      <td class="net-cell">${fmtFull(d.net)}</td>
      <td class="invest-cell">${fmtFull(d.invest)}</td>
    </tr>
  `).join('');
  document.getElementById('cashflow-table').innerHTML = `
    <table class="cf-table">
      <thead>
        <tr><th>Month</th><th>Income</th><th>Expenses</th><th>Net CF</th><th>Invested (${ratio}%)</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ─── Tab switching ────────────────────────────────────────────
let activeTab = 'projection';

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    if (tab === activeTab) return;
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.getElementById('tab-projection').classList.toggle('hidden', tab !== 'projection');
    document.getElementById('tab-cashflow').classList.toggle('hidden', tab !== 'cashflow');

    requestAnimationFrame(() => {
      if (tab === 'projection') {
        drawProjection(state.ratio);
      } else {
        drawCashflow(state.ratio);
        if (!animated.cashflow) runCashflowEntrance();
      }
    });
  });
});

// ─── Smooth slider (GSAP tween between ratio values) ──────────
function smoothUpdate(newRatio) {
  if (ratioTween) ratioTween.kill();

  ratioTween = gsap.to(tweenedRatio, {
    value: newRatio,
    duration: 0.38,
    ease: 'power2.out',
    onUpdate() {
      const r = tweenedRatio.value;
      updateMetrics(r);
      if (activeTab === 'projection') drawProjection(r);
      else drawCashflow(r);
    },
    onComplete() {
      state.ratio = newRatio;
      updateStocks(newRatio);
      renderMilestoneBreakdown(newRatio);
    },
  });
}

document.getElementById('invest-ratio').addEventListener('input', function() {
  smoothUpdate(+this.value);
});

// ─── ResizeObserver ───────────────────────────────────────────
const ro = new ResizeObserver(() => {
  if (activeTab === 'projection') drawProjection(state.ratio);
  else drawCashflow(state.ratio);
});
ro.observe(projContainer);
ro.observe(cfContainer);

// ─── Init ─────────────────────────────────────────────────────
updateMetrics(state.ratio);
updateStocks(state.ratio);
renderMilestoneBreakdown(state.ratio);
drawProjection(state.ratio);
runPageEntrance();
