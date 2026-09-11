/*!
 * token-governance-model.js — Token Waste / Context Governance factor
 * Target: aiagencycalculator.com  (drop-in alongside gpt-live-1-cost-model.js)
 * Spec:   SPEC-token-waste-context-governance-factor.md (kanban t_8813edb2)
 * Built:  2026-09-11
 *
 * Load-bearing rate facts (verified first-party against developers.openai.com
 * on 2026-09-11; see spec section 2):
 *   gpt-5.6-sol short context: $4.00 in / $0.40 cached in / $5.00 cache write / $20.00 out
 *   gpt-5.6-sol long  context: $8.00 in / $0.80 cached in / $10.00 cache write / $30.00 out
 *   >272K input tokens  -> 2x input, 1.5x output for the FULL request
 *   promo "at least through November 21, 2026" -> list rate $5.00 / $30.00
 *
 * Pure functions only: no DOM, no globals required. Usable from a browser
 * <script> tag (window.TokenGovernance) and from node (module.exports), so the
 * same code can be unit-tested headlessly by tests/token-governance-verify.mjs.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TokenGovernance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Constants — every rate here is first-party verified (spec section 2)
   * ------------------------------------------------------------------ */
  var MODEL = {
    id: 'gpt-5.6-sol',
    label: 'GPT-5.6 Sol (OpenAI)',
    input: 4.00,           // $/1M input, short context, promo        [OAI model page]
    cachedInput: 0.40,     // $/1M cached input (10% of input)        [OAI model page]
    cacheWrite: 5.00,      // $/1M cache write (1.25x input)          [OAI model page]
    output: 20.00,         // $/1M output, short context, promo       [OAI model page]
    longInput: 8.00,       // $/1M input, long context (2x)           [OAI pricing page]
    longOutput: 30.00,     // $/1M output, long context (1.5x)        [OAI pricing page]
    longThreshold: 272000, // input tokens per request; above this the long-context column applies
    priorInput: 5.00,      // pre-cut / post-promo list rate          [AWS 2026-08-21]
    priorOutput: 30.00,    // pre-cut / post-promo list rate          [AWS 2026-08-21]
    promoEndsOn: '2026-11-21'
  };

  var CACHED_RATIO = MODEL.cachedInput / MODEL.input;    // 0.10
  var WRITE_RATIO  = MODEL.cacheWrite  / MODEL.input;    // 1.25

  /* ------------------------------------------------------------------ *
   * Defaults and presets (spec section 4)
   * ------------------------------------------------------------------ */
  var DEFAULTS = {
    tasksPerMonth: 10000,          // illustrative: business workload held constant
    contextTokensPerCall: 150000,  // illustrative: agentic long-context call
    outputTokensPerCall: 8000,     // illustrative
    callsPerTask: 3.0,             // ILLUSTRATIVE (card default for ungoverned)
    wasteRatePct: 25.0,            // ILLUSTRATIVE (card default for ungoverned)
    prune: false,                  // ungoverned: context accumulates across calls
    applySurcharge: true,
    cacheSharePct: 0,              // 0 = disabled (v1 behaviour, cs=0 reproduces it exactly)
    agents: 5,
    capPerAgentMonthly: 1000,
    inputPrice: MODEL.input,
    outputPrice: MODEL.output,
    priorInputPrice: MODEL.priorInput,
    priorOutputPrice: MODEL.priorOutput,
    longContextThreshold: MODEL.longThreshold,
    surchargeInputMult: MODEL.longInput / MODEL.input,    // 2
    surchargeOutputMult: MODEL.longOutput / MODEL.output  // 1.5
  };

  var PRESETS = {
    governed: {
      label: 'Governed — compaction on, capped loops, spend alerts',
      callsPerTask: 1.2,
      wasteRatePct: 5.0,
      prune: true,
      cacheSharePct: 0
    },
    ungoverned: {
      label: 'Ungoverned — unbounded loops, no pruning, no caps',
      callsPerTask: 3.0,
      wasteRatePct: 25.0,
      prune: false,
      cacheSharePct: 0
    }
  };

  function num(v, dflt) {
    var n = typeof v === 'string' ? parseFloat(v) : v;
    return (typeof n === 'number' && isFinite(n)) ? n : dflt;
  }
  function bool(v, dflt) {
    if (typeof v === 'boolean') return v;
    if (v === 'true' || v === 'on' || v === 1 || v === '1') return true;
    if (v === 'false' || v === 'off' || v === 0 || v === '0') return false;
    return dflt;
  }

  /* ------------------------------------------------------------------ *
   * Validate — array of human-readable errors (empty = ok)
   * ------------------------------------------------------------------ */
  function twValidate(inp) {
    var e = [];
    if (!(num(inp.tasksPerMonth, 0) > 0)) e.push('Tasks per month must be greater than zero.');
    if (!(num(inp.contextTokensPerCall, 0) >= 1)) e.push('Context tokens per call must be at least 1.');
    if (!(num(inp.outputTokensPerCall, 0) >= 0)) e.push('Output tokens per call cannot be negative.');
    if (!(num(inp.callsPerTask, 0) >= 1)) e.push('Calls per task (context re-read multiplier) must be at least 1.');
    var w = num(inp.wasteRatePct, 0);
    if (w < 0 || w >= 100) e.push('Wasted-token rate must be between 0% and 99%.');
    var cs = num(inp.cacheSharePct, 0);
    if (cs < 0 || cs > 95) e.push('Cached-context share must be between 0% and 95%.');
    return e;
  }

  /* ------------------------------------------------------------------ *
   * twCompute — the whole factor. Single source of truth for every number
   * in the spec's worked example.
   * ------------------------------------------------------------------ */
  function twCompute(o, _skipDeriv) {
    var inp = {}, k;
    for (k in DEFAULTS) inp[k] = DEFAULTS[k];
    for (k in MODEL) if (k in o) inp[k] = o[k];
    for (k in o) if (o[k] !== undefined && o[k] !== null) inp[k] = o[k];

    var tasks  = num(inp.tasksPerMonth, DEFAULTS.tasksPerMonth);
    var ctx    = num(inp.contextTokensPerCall, DEFAULTS.contextTokensPerCall);
    var outTok = num(inp.outputTokensPerCall, DEFAULTS.outputTokensPerCall);
    var calls  = num(inp.callsPerTask, DEFAULTS.callsPerTask);
    var W      = num(inp.wasteRatePct, DEFAULTS.wasteRatePct) / 100;
    var prune  = bool(inp.prune, DEFAULTS.prune);
    var cs     = num(inp.cacheSharePct, 0) / 100;
    var agents = num(inp.agents, DEFAULTS.agents);
    var cap    = num(inp.capPerAgentMonthly, DEFAULTS.capPerAgentMonthly);

    var pIn      = num(inp.inputPrice, MODEL.input);
    var pOut     = num(inp.outputPrice, MODEL.output);
    var priorIn  = num(inp.priorInputPrice, MODEL.priorInput);
    var priorOut = num(inp.priorOutputPrice, MODEL.priorOutput);
    var thresh   = num(inp.longContextThreshold, MODEL.longThreshold);
    var sInMult  = num(inp.surchargeInputMult, MODEL.longInput / MODEL.input);
    var sOutMult = num(inp.surchargeOutputMult, MODEL.longOutput / MODEL.output);

    /* 1. Context growth — an unpruned agent carries the transcript forward, so
     *    the average call in a k-call task sees (k+1)/2 contexts' worth of input. */
    var growth = prune ? 1 : (calls + 1) / 2;
    var perCallIn = ctx * growth;

    /* 2. Long-context cliff — the threshold is per request, on input tokens. */
    var surchargeActive = bool(inp.applySurcharge, true) && perCallIn > thresh;
    var effIn  = pIn  * (surchargeActive ? sInMult  : 1);
    var effOut = pOut * (surchargeActive ? sOutMult : 1);

    /* 3. Cache blending (v1.1 lever; cacheSharePct=0 reproduces v1 exactly).
     *    Call 1 writes the stable prefix at 1.25x; calls 2..k read it at 10%. */
    var inRateMult = (calls > 0)
      ? (1 + (calls - 1) * ((1 - cs) + cs * CACHED_RATIO)) / calls + cs * (WRITE_RATIO - 1) / calls
      : 1;
    var inRate = effIn * inRateMult;

    /* 4. Billed volume: ideal tokens x growth x calls / (1 - waste). */
    var idealIn  = tasks * ctx;
    var idealOut = tasks * outTok;
    var billedIn  = idealIn  * growth * calls / (1 - W);
    var billedOut = idealOut * calls / (1 - W);
    var reReadIn  = idealIn  * (growth * calls - 1);
    var reReadOut = idealOut * (calls - 1);
    var wasteIn   = billedIn  - idealIn  * growth * calls;
    var wasteOut  = billedOut - idealOut * calls;

    /* 5. Cost. All money uses the rates the workload actually triggers. */
    var mIn  = function (t) { return t * inRate / 1e6; };
    var mOut = function (t) { return t * effOut / 1e6; };
    var cost = mIn(billedIn) + mOut(billedOut);

    /* 6. The same behaviour on the pre-cut / post-promo list sheet. */
    var priorEffIn  = priorIn  * (surchargeActive ? sInMult  : 1);
    var priorEffOut = priorOut * (surchargeActive ? sOutMult : 1);
    var costPrior = billedIn * priorEffIn * inRateMult / 1e6 + billedOut * priorEffOut / 1e6;

    /* 7. Baselines.
     *    floorCostBase      = minimum tokens at the headline rate — what a
     *                         per-token estimate predicts.
     *    floorCostTriggered = minimum tokens at the rates this workload triggers. */
    var floorCostBase      = idealIn * pIn / 1e6 + idealOut * pOut / 1e6;
    var floorCostTriggered = mIn(idealIn) + mOut(idealOut);

    /* 8. Exact three-line waterfall at the triggered rates:
     *    floorCostTriggered + reReadCost + wasteCost === cost  (asserted) */
    var reReadCost = mIn(reReadIn) + mOut(reReadOut);
    var wasteCost  = mIn(wasteIn)  + mOut(wasteOut);

    /* 9. The cliff, isolated: same billed volume at short-context rates. */
    var costNoSurcharge = billedIn * pIn * inRateMult / 1e6 + billedOut * pOut / 1e6;
    var surchargeCost   = cost - costNoSurcharge;

    /* 10. Vendor-recommended units. */
    var costPerTask      = cost / tasks;
    var costPerTaskPrior = costPrior / tasks;
    var governanceMultiple = floorCostBase > 0 ? cost / floorCostBase : null;
    var behaviouralMultiple = floorCostTriggered > 0 ? cost / floorCostTriggered : null;

    /* 11. Price / promo exposure at this volume. */
    var priceEffect   = cost - costPrior;              // negative = the cut saved money here
    var priceEffectPct = costPrior > 0 ? priceEffect / costPrior * 100 : 0;
    var promoDelta    = costPrior - cost;              // cost of the promo ending, same behaviour
    var promoDeltaPct = cost > 0 ? promoDelta / cost * 100 : 0;

    /* 12. Sensitivity: d(cost)/dW = cost / (1 - W), per percentage point. */
    var sensitivityPerPct = cost / ((1 - W) * 100);

    /* 12b. Marginal cost of one more call per task (numeric derivative, since
     *      the unpruned growth term makes cost quadratic in calls). */
    var eps = 0.01;
    var marginalCallCost = null;
    if (!_skipDeriv) {
      var plus = twCompute(Object.assign({}, inp, { callsPerTask: calls + eps, wasteRatePct: W * 100 }), true);
      marginalCallCost = (plus.monthlyCost - cost) / eps;
    }

    /* 13. Cap breach — which day of the month the budget is gone. */
    var daily  = cost / 30.4;
    var budget = (cap > 0 && agents > 0) ? cap * agents : null;
    var breachDay = (budget && daily > 0) ? budget / daily : null;

    return {
      inputs: {
        tasksPerMonth: tasks, contextTokensPerCall: ctx, outputTokensPerCall: outTok,
        callsPerTask: calls, wasteRatePct: W * 100, prune: prune, cacheSharePct: cs * 100,
        agents: agents, capPerAgentMonthly: cap, inputPrice: pIn, outputPrice: pOut,
        priorInputPrice: priorIn, priorOutputPrice: priorOut,
        longContextThreshold: thresh, applySurcharge: bool(inp.applySurcharge, true)
      },
      growth: growth,
      perCallInputTokens: perCallIn,
      surchargeActive: surchargeActive,
      effectiveInputPrice: effIn,
      effectiveInputPriceWithCache: inRate,
      effectiveOutputPrice: effOut,
      totalCallsPerMonth: tasks * calls,

      billedInputTokens: billedIn, billedOutputTokens: billedOut,
      idealInputTokens: idealIn, idealOutputTokens: idealOut,
      reReadInputTokens: reReadIn, reReadOutputTokens: reReadOut,
      wasteInputTokens: wasteIn, wasteOutputTokens: wasteOut,
      billedTokensTotal: billedIn + billedOut,
      wasteTokensTotal: wasteIn + wasteOut,
      reReadTokensTotal: reReadIn + reReadOut,

      monthlyCost: cost,
      monthlyCostPrior: costPrior,
      floorCostBase: floorCostBase,
      floorCostTriggered: floorCostTriggered,
      reReadCost: reReadCost,
      wasteCost: wasteCost,
      surchargeCost: surchargeCost,
      monthlyCostNoSurcharge: costNoSurcharge,
      governancePremium: cost - floorCostBase,
      governanceMultiple: governanceMultiple,
      behaviouralMultiple: behaviouralMultiple,
      priceEffect: priceEffect,
      priceEffectPct: priceEffectPct,
      promoDelta: promoDelta,
      promoDeltaPct: promoDeltaPct,
      costPerTask: costPerTask,
      costPerTaskPrior: costPerTaskPrior,
      sensitivityPerPct: sensitivityPerPct,
      marginalCallCost: marginalCallCost,
      dailyCost: daily,
      budget: budget,
      breachDay: breachDay,

      /* invariants — the harness asserts these to the cent */
      checkWaterfall: (floorCostTriggered + reReadCost + wasteCost) - cost,
      checkVolumeIn:  (idealIn  + reReadIn  + wasteIn)  - billedIn,
      checkVolumeOut: (idealOut + reReadOut + wasteOut) - billedOut,

      model: MODEL.id
    };
  }

  /* ------------------------------------------------------------------ *
   * twCompare — month-over-month price effect vs volume/governance effect.
   * Pass the two scenario input objects (e.g. PRESETS.governed /
   * PRESETS.ungoverned merged over your workload). Returns an exact
   * decomposition: totalChange === priceEffect + volumeEffect.
   * ------------------------------------------------------------------ */
  function twCompare(baselineInp, actualInp) {
    var base  = twCompute(baselineInp);   // e.g. governed, prior sheet
    var after = twCompute(baselineInp);   // governed, promoted sheet
    var actual = twCompute(actualInp);    // ungoverned, promoted sheet
    var priceEffect  = after.monthlyCost - base.monthlyCostPrior;      // the cut, at baseline volume
    var volumeEffect = actual.monthlyCost - after.monthlyCost;         // governance/behaviour gap
    var totalChange  = actual.monthlyCost - base.monthlyCostPrior;
    return {
      baselinePriorCost: base.monthlyCostPrior,
      baselinePostCost: after.monthlyCost,
      actualCost: actual.monthlyCost,
      priceEffect: priceEffect,
      volumeEffect: volumeEffect,
      totalChange: totalChange,
      check: (priceEffect + volumeEffect) - totalChange,
      baseline: base,
      baselinePost: after,
      actual: actual
    };
  }

  /* ------------------------------------------------------------------ *
   * Presentation helpers (pure, so they are testable too)
   * ------------------------------------------------------------------ */
  function fmtM(tokens) { return (Math.round(tokens / 1e5) / 10).toFixed(1) + 'M'; }
  function fmtUSD(n) {
    var v = Math.round(n * 100) / 100;
    return '$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function fmtUSD0(n) {
    return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  return {
    MODEL: MODEL,
    DEFAULTS: DEFAULTS,
    PRESETS: PRESETS,
    compute: twCompute,
    compare: twCompare,
    validate: twValidate,
    fmtM: fmtM,
    fmtUSD: fmtUSD,
    fmtUSD0: fmtUSD0
  };
});
