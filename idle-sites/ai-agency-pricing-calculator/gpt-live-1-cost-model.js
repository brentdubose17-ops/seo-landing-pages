/*
 * GPT-Live-1 voice + backend cost model (canonical implementation).
 *
 * GENERATED from gpt-live-1-cost-calculator.html — do not edit by hand.
 * Regenerate with: node tests/gpt-live-1-verify.mjs --emit gpt-live-1-cost-model.js
 *
 * Interface: billedVoiceSeconds(sessionSeconds, transport, initSeconds)
 *            voiceCostUsd(sessionSeconds, transport, ratePerSecond)
 *            computeModel(params) -> results
 *            exportModel(params)  -> machine-readable JSON payload
 */
var GPT_LIVE_MODEL = {
        id: 'gpt-live-1-two-meter-cost-v1',
        asOf: '2026-09-10',
        voice: {
            /* OpenAI-published (model card + pricing page + voice latency & cost guide) */
            ratePerMinute: 0.05,
            ratePerSecond: 0.05 / 60,
            initSeconds: 15,
            initScope: 'webrtc',
            rounding: 'none',
            billableBasis: 'active_session'
        },
        month: { primaryDays: 30, altDays: 31, avgDays: 365 / 12 },
        backends: {
            /* OpenAI-published, Standard tier, $ per 1M tokens (short / long context) */
            'gpt-5.6-terra': { label: 'GPT-5.6 Terra', inRate: 2.00, cachedRate: 0.20, cacheWriteRate: 2.50, outRate: 12.00, longInRate: 4.00, longCachedRate: 0.40, longCacheWriteRate: 5.00, longOutRate: 18.00, published: true },
            'gpt-5.6-luna': { label: 'GPT-5.6 Luna', inRate: 0.20, cachedRate: 0.02, cacheWriteRate: 0.25, outRate: 1.20, longInRate: 0.40, longCachedRate: 0.04, longCacheWriteRate: 0.50, longOutRate: 1.80, published: true },
            'gpt-6-astra': { label: 'GPT-6 Astra', inRate: 10.00, cachedRate: 1.00, cacheWriteRate: 12.50, outRate: 50.00, longInRate: 20.00, longCachedRate: 2.00, longCacheWriteRate: 25.00, longOutRate: 75.00, published: true },
            'gpt-5.6-sol': { label: 'GPT-5.6 Sol', inRate: 4.00, cachedRate: 0.40, cacheWriteRate: 5.00, outRate: 20.00, longInRate: 8.00, longCachedRate: 0.80, longCacheWriteRate: 10.00, longOutRate: 30.00, published: true },
            'gpt-5.6-cyber': { label: 'GPT-5.6 Cyber', inRate: 12.50, cachedRate: 1.25, cacheWriteRate: 15.625, outRate: 75.00, longInRate: null, longCachedRate: null, longCacheWriteRate: null, longOutRate: null, published: true },
            'custom': { label: 'Custom / third-party', inRate: 2.00, cachedRate: 0.20, cacheWriteRate: 2.50, outRate: 12.00, longInRate: 4.00, longCachedRate: 0.40, longCacheWriteRate: 5.00, longOutRate: 18.00, published: false }
        },
        tiers: {
            1: { ceiling: 25, paid: '$5 paid', perMonth: '$100/mo' },
            2: { ceiling: 50, paid: '$50 paid', perMonth: '$500/mo' },
            3: { ceiling: 200, paid: '$100 paid', perMonth: '$1,000/mo' },
            4: { ceiling: 300, paid: '$250 paid', perMonth: '$5,000/mo' },
            5: { ceiling: 500, paid: '$1,000 paid', perMonth: '$200,000/mo' }
        },
        freeTier: { supported: false, note: 'Free tier is not supported for GPT-Live sessions.' },
        realtime: {
            /* OpenAI-published, Standard, $ per 1M tokens, GPT-Realtime-2.1 */
            model: 'gpt-realtime-2.1',
            audioInRate: 32.00, audioCachedRate: 0.40, audioOutRate: 64.00,
            textInRate: 4.00, textOutRate: 24.00, imageInRate: 5.00,
            scope: 'audio rows only'
        },
        dataResidencyUplift: 0.10,
        serviceTiers: ['auto', 'default', 'flex', 'priority']
    };

    var GPT_LIVE_DEFAULTS = {
        transport: 'webrtc',
        callsPerDay: 1000,
        callMm: 4,
        callSs: 0,
        operatingHoursPerDay: 8,
        peakFactor: 1.0,
        backendModel: 'gpt-5.6-terra',
        /* inRate / cachedRate / outRate are deliberately absent: they are
           resolved from backendModel unless the caller (or the UI) supplies an
           explicit override, so switching models moves the bill by default. */
        longContext: false,
        dataResidency: false,
        cachedSharePct: 0,
        turnsPerCall: 6,
        inTokensPerTurn: 1500,
        outTokensPerTurn: 300,
        toolSharePct: 35,
        toolCostPerInvocation: 0,
        toolExtraInTokens: 0,
        idleSharePct: 30,
        realtimeAudioInPerMin: 600,
        realtimeAudioOutPerMin: 600,
        tier: 'auto',
        monthDays: 30
    };

    /* Which parameters are OpenAI-published and which are our modelling assumptions.
       The export carries this so a citation can separate sourced from assumed. */
    var GPT_LIVE_PROVENANCE = {
        'voice.ratePerMinute': 'openai-published',
        'voice.ratePerSecond': 'derived',
        'voice.initSeconds': 'openai-published',
        'voice.initScope': 'openai-published',
        'voice.rounding': 'openai-published',
        'voice.billableBasis': 'openai-published',
        'backends.*.inRate': 'openai-published',
        'backends.*.cachedRate': 'openai-published',
        'backends.*.outRate': 'openai-published',
        'backends.*.long*.Rate': 'openai-published',
        'dataResidencyUplift': 'openai-published',
        'tiers.*.ceiling': 'openai-published',
        'freeTier.supported': 'openai-published',
        'realtime.audioInRate': 'openai-published',
        'realtime.audioOutRate': 'openai-published',
        'callsPerDay': 'our-assumption',
        'callMm': 'our-assumption',
        'callSs': 'our-assumption',
        'operatingHoursPerDay': 'our-assumption',
        'peakFactor': 'our-assumption',
        'turnsPerCall': 'our-assumption',
        'inTokensPerTurn': 'our-assumption',
        'outTokensPerTurn': 'our-assumption',
        'toolSharePct': 'our-assumption',
        'toolCostPerInvocation': 'our-assumption',
        'toolExtraInTokens': 'our-assumption',
        'cachedSharePct': 'our-assumption',
        'idleSharePct': 'our-assumption',
        'realtimeAudioInPerMin': 'our-assumption',
        'realtimeAudioOutPerMin': 'our-assumption',
        'monthDays': 'our-assumption'
    };

    var GPT_LIVE_SOURCES = {
        'P1': 'https://openai.com/index/introducing-gpt-live-1-in-the-api/',
        'P2': 'https://developers.openai.com/api/docs/models/gpt-live-1',
        'P3': 'https://developers.openai.com/api/docs/pricing',
        'P4': 'https://developers.openai.com/api/docs/guides/voice-latency-cost',
        'P5': 'https://developers.openai.com/api/docs/guides/live',
        'P6': 'https://developers.openai.com/api/docs/guides/live-migration',
        'P7': 'https://developers.openai.com/api/docs/guides/live-conversations',
        'P8': 'https://developers.openai.com/api/docs/guides/live-delegation',
        'P9': 'https://developers.openai.com/api/docs/guides/voice-webrtc',
        'P10': 'https://developers.openai.com/api/docs/guides/voice-websockets',
        'P11': 'https://developers.openai.com/api/docs/guides/rate-limits'
    };

    function num(v, fallback) {
        var n = (v === null || v === undefined || v === '') ? NaN : Number(v);
        if (!isFinite(n)) { return (fallback === undefined ? 0 : fallback); }
        return n;
    }

    function nonNegative(v, fallback) {
        var n = num(v, fallback);
        return n < 0 ? 0 : n;
    }

    /* Contract signature from the verified facts sheet (section C). */
    function billedVoiceSeconds(sessionSeconds, transport, initSeconds) {
        var s = nonNegative(sessionSeconds, 0);
        var init = (initSeconds === undefined ? GPT_LIVE_MODEL.voice.initSeconds : initSeconds);
        if (transport === GPT_LIVE_MODEL.voice.initScope) {
            return Math.max(s, init);
        }
        return s;
    }

    /* Contract signature from the verified facts sheet (section C). */
    function voiceCostUsd(sessionSeconds, transport, ratePerSecond) {
        var rate = (ratePerSecond === undefined ? GPT_LIVE_MODEL.voice.ratePerSecond : ratePerSecond);
        return billedVoiceSeconds(sessionSeconds, transport) * rate;
    }

    function rateOr(override, fallback) {
        var n = (override === null || override === undefined || override === '') ? NaN : Number(override);
        return isFinite(n) ? n : fallback;
    }

    function backendRates(p) {
        var model = GPT_LIVE_MODEL.backends[p.backendModel] || GPT_LIVE_MODEL.backends['custom'];
        var inRate = rateOr(p.inRate, model.inRate);
        var cachedRate = rateOr(p.cachedRate, model.cachedRate);
        var outRate = rateOr(p.outRate, model.outRate);
        if (p.longContext && model.longInRate !== null) {
            inRate = model.longInRate;
            cachedRate = model.longCachedRate;
            outRate = model.longOutRate;
        }
        var uplift = p.dataResidency ? (1 + GPT_LIVE_MODEL.dataResidencyUplift) : 1;
        return {
            inRate: inRate * uplift,
            cachedRate: cachedRate * uplift,
            outRate: outRate * uplift,
            uplift: uplift,
            label: model.label,
            published: model.published
        };
    }

    function concurrency(p, sessionSeconds) {
        var hours = num(p.operatingHoursPerDay, 8);
        var callsPerHour = hours > 0 ? (num(p.callsPerDay, 0) / hours) : 0;
        var avg = callsPerHour * sessionSeconds / 3600;
        var peak = num(p.peakFactor, 1) < 1 ? 1 : num(p.peakFactor, 1);
        var required = avg * peak;
        return { callsPerHour: callsPerHour, average: avg, peakFactor: peak, required: required };
    }

    function autoTier(required) {
        var order = [1, 2, 3, 4, 5];
        for (var i = 0; i < order.length; i++) {
            if (required <= GPT_LIVE_MODEL.tiers[order[i]].ceiling) { return order[i]; }
        }
        return 5;
    }

    function computeModel(params) {
        var p = {};
        var key;
        for (key in GPT_LIVE_DEFAULTS) {
            if (GPT_LIVE_DEFAULTS.hasOwnProperty(key)) { p[key] = GPT_LIVE_DEFAULTS[key]; }
        }
        if (params) {
            for (key in params) {
                if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== null) {
                    p[key] = params[key];
                }
            }
        }

        var sessionSeconds = nonNegative(p.callMm, 0) * 60 + nonNegative(p.callSs, 0);
        var billed = billedVoiceSeconds(sessionSeconds, p.transport);
        var initApplied = billed > sessionSeconds;
        var voicePerCall = billed / 60 * GPT_LIVE_MODEL.voice.ratePerMinute;

        var rates = backendRates(p);
        var cachedShare = Math.min(1, Math.max(0, nonNegative(p.cachedSharePct, 0) / 100));
        var toolShare = Math.min(1, Math.max(0, nonNegative(p.toolSharePct, 0) / 100));
        var turns = nonNegative(p.turnsPerCall, 0);
        var inTokensPerTurn = nonNegative(p.inTokensPerTurn, 0);
        var outTokensPerTurn = nonNegative(p.outTokensPerTurn, 0);
        var cachedInPerTurn = inTokensPerTurn * cachedShare;
        var uncachedInPerTurn = inTokensPerTurn - cachedInPerTurn;

        var perTurnModelCost = (uncachedInPerTurn * rates.inRate + cachedInPerTurn * rates.cachedRate + outTokensPerTurn * rates.outRate) / 1e6;
        var toolTurns = turns * toolShare;
        var toolTokenCost = toolTurns * nonNegative(p.toolExtraInTokens, 0) * rates.inRate / 1e6;
        var backendModelPerCall = turns * perTurnModelCost + toolTokenCost;
        var backendToolPerCall = toolTurns * nonNegative(p.toolCostPerInvocation, 0);
        var backendPerCall = backendModelPerCall + backendToolPerCall;

        var callsPerDay = nonNegative(p.callsPerDay, 0);
        var totalPerCall = voicePerCall + backendPerCall;
        var monthDays = num(p.monthDays, GPT_LIVE_MODEL.month.primaryDays);
        var voiceDay = voicePerCall * callsPerDay;
        var backendDay = backendPerCall * callsPerDay;
        var totalDay = totalPerCall * callsPerDay;

        var idleShare = Math.min(1, Math.max(0, nonNegative(p.idleSharePct, 0) / 100));
        var idlePerCall = voicePerCall * idleShare;

        var conc = concurrency(p, sessionSeconds);
        var requiredTier = autoTier(conc.required);
        var selectedTier = String(p.tier === undefined ? 'auto' : p.tier);
        var chosenTier = (selectedTier === 'auto') ? requiredTier : parseInt(selectedTier, 10);
        var freeSelected = (selectedTier === 'free');
        var chosenCeiling = freeSelected ? 0 : GPT_LIVE_MODEL.tiers[chosenTier].ceiling;
        var fits = !freeSelected && conc.required <= chosenCeiling;
        var headroom = chosenCeiling - conc.required;
        var utilisation = chosenCeiling > 0 ? (conc.required / chosenCeiling) : null;
        var capacityLimited = !freeSelected && !fits;

        var rtIn = nonNegative(p.realtimeAudioInPerMin, 0);
        var rtOut = nonNegative(p.realtimeAudioOutPerMin, 0);
        var rt = GPT_LIVE_MODEL.realtime;
        var rtPerMin = (rtIn * rt.audioInRate + rtOut * rt.audioOutRate) / 1e6;
        var rtPerCall = rtPerMin * (sessionSeconds / 60);
        var ratio = rtIn > 0 ? (rtOut / rtIn) : 0;
        var breakevenIn = (ratio >= 0) ? (0.05 * 1e6 / (rt.audioInRate + ratio * rt.audioOutRate)) : null;
        var breakevenTotal = (breakevenIn === null) ? null : breakevenIn * (1 + ratio);

        var share = totalPerCall > 0 ? (backendPerCall / totalPerCall) : 0;
        var voiceShare = totalPerCall > 0 ? (voicePerCall / totalPerCall) : 0;

        return {
            modelId: GPT_LIVE_MODEL.id,
            asOf: GPT_LIVE_MODEL.asOf,
            params: p,
            voice: {
                sessionSeconds: sessionSeconds,
                billedSeconds: billed,
                initApplied: initApplied,
                perCall: voicePerCall,
                day: voiceDay,
                month: voiceDay * monthDays,
                monthAlt31: voiceDay * 31,
                monthAltAvg: voiceDay * (365 / 12),
                idlePerCall: idlePerCall,
                idleDay: idlePerCall * callsPerDay,
                shareOfTotal: voiceShare
            },
            backend: {
                rates: rates,
                modelPerCall: backendModelPerCall,
                toolPerCall: backendToolPerCall,
                perCall: backendPerCall,
                day: backendDay,
                month: backendDay * monthDays,
                monthAlt31: backendDay * 31,
                monthAltAvg: backendDay * (365 / 12),
                shareOfTotal: share,
                perVoiceMinute: sessionSeconds > 0 ? (backendPerCall / (sessionSeconds / 60)) : null,
                toolTurns: toolTurns
            },
            total: {
                perCall: totalPerCall,
                day: totalDay,
                month: totalDay * monthDays,
                monthAlt31: totalDay * 31,
                monthAltAvg: totalDay * (365 / 12),
                callsPerDay: callsPerDay
            },
            capacity: {
                callsPerHour: conc.callsPerHour,
                average: conc.average,
                peakFactor: conc.peakFactor,
                required: conc.required,
                requiredTier: requiredTier,
                selectedTier: selectedTier,
                tier: chosenTier,
                ceiling: chosenCeiling,
                fits: fits,
                headroom: headroom,
                utilisation: utilisation,
                capacityLimited: capacityLimited,
                freeSelected: freeSelected,
                tiers: [1, 2, 3, 4, 5].map(function (t) {
                    var ceiling = GPT_LIVE_MODEL.tiers[t].ceiling;
                    return {
                        tier: t,
                        ceiling: ceiling,
                        fits: conc.required <= ceiling,
                        headroom: ceiling - conc.required,
                        utilisation: conc.required / ceiling
                    };
                })
            },
            realtime: {
                perMinute: rtPerMin,
                perCall: rtPerCall,
                breakevenInPerMin: breakevenIn,
                breakevenTotalPerMin: breakevenTotal,
                tokenMeteringCheaper: rtPerMin < GPT_LIVE_MODEL.voice.ratePerMinute
            },
            monthDays: monthDays
        };
    }

    function exportModel(params, results) {
        var r = results || computeModel(params);
        return {
            model: r.modelId,
            as_of: r.asOf,
            generated_from: 'https://aiagencycalculator.com/gpt-live-1-cost-calculator',
            month_definition: {
                primary_days: r.monthDays,
                alternatives: { alt_31_days: 31, alt_365_over_12: 365 / 12 },
                note: 'OpenAI defines no month; each monthly figure states the day count used.'
            },
            published_constants: {
                voice_rate_per_minute_usd: GPT_LIVE_MODEL.voice.ratePerMinute,
                voice_billing_rounding: GPT_LIVE_MODEL.voice.rounding,
                voice_init_seconds: GPT_LIVE_MODEL.voice.initSeconds,
                voice_init_scope: GPT_LIVE_MODEL.voice.initScope,
                billable_time_basis: GPT_LIVE_MODEL.voice.billableBasis,
                backend_rates_per_1m_usd: GPT_LIVE_MODEL.backends,
                concurrent_session_tier_ceilings: GPT_LIVE_MODEL.tiers,
                free_tier_supported: GPT_LIVE_MODEL.freeTier.supported,
                realtime_comparison_model: GPT_LIVE_MODEL.realtime,
                data_residency_uplift: GPT_LIVE_MODEL.dataResidencyUplift,
                service_tiers: GPT_LIVE_MODEL.serviceTiers
            },
            provenance: GPT_LIVE_PROVENANCE,
            sources: GPT_LIVE_SOURCES,
            parameters: r.params,
            results: {
                voice_cost_usd_per_call: r.voice.perCall,
                voice_billed_seconds_per_call: r.voice.billedSeconds,
                backend_model_usd_per_call: r.backend.modelPerCall,
                backend_tools_usd_per_call: r.backend.toolPerCall,
                backend_usd_per_call: r.backend.perCall,
                backend_share_of_total: r.backend.shareOfTotal,
                total_usd_per_call: r.total.perCall,
                voice_usd_per_day: r.voice.day,
                backend_usd_per_day: r.backend.day,
                total_usd_per_day: r.total.day,
                voice_usd_per_month: r.voice.month,
                backend_usd_per_month: r.backend.month,
                total_usd_per_month: r.total.month,
                peak_concurrent_sessions_required: r.capacity.required,
                average_concurrent_sessions_required: r.capacity.average,
                tier_checked: r.capacity.tier,
                tier_fits: r.capacity.fits,
                capacity_limited_before_budget_limited: r.capacity.capacityLimited,
                realtime_usd_per_minute: r.realtime.perMinute,
                flat_rate_breakeven_audio_tokens_per_min: r.realtime.breakevenTotalPerMin
            },
            formulas: {
                billed_voice_seconds: 'max(session_seconds, 15) if transport == "webrtc" else session_seconds',
                voice_cost: 'billed_voice_seconds / 60 * 0.05',
                backend_cost: 'sum(turns * (uncached_in * in_rate + cached_in * cached_rate + out_tokens * out_rate) / 1e6) + tool_turns * tool_cost_per_invocation',
                total_cost: 'voice_cost + backend_cost',
                required_concurrent_sessions: 'calls_per_day / operating_hours * avg_call_seconds / 3600 * peak_factor'
            },
            assumptions_note: 'Parameters marked "our-assumption" in provenance are modelling choices, not OpenAI figures. Rates marked "openai-published" are reproduced from the sources above as of the as_of date.'
        };
    }

var GPT_LIVE_MODEL_EXPORTS = {
    GPT_LIVE_MODEL: GPT_LIVE_MODEL,
    GPT_LIVE_DEFAULTS: GPT_LIVE_DEFAULTS,
    GPT_LIVE_PROVENANCE: GPT_LIVE_PROVENANCE,
    GPT_LIVE_SOURCES: GPT_LIVE_SOURCES,
    billedVoiceSeconds: billedVoiceSeconds,
    voiceCostUsd: voiceCostUsd,
    computeModel: computeModel,
    exportModel: exportModel
};
if (typeof module !== 'undefined' && module.exports) { module.exports = GPT_LIVE_MODEL_EXPORTS; }
if (typeof window !== 'undefined') { window.GPT_LIVE_MODEL_JS = GPT_LIVE_MODEL_EXPORTS; }
