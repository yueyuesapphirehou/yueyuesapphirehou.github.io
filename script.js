(() => {
      const root = document.getElementById("lfp-story");
      if (!root) return;

      const $ = (selector) => root.querySelector(selector);
      const $$ = (selector) => Array.from(root.querySelectorAll(selector));
      const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      function css(name) {
        return getComputedStyle(root).getPropertyValue(name).trim();
      }

      function palette() {
        return {
          background: css("--background") || "Canvas",
          foreground: css("--foreground") || "CanvasText",
          muted: css("--muted") || "Canvas",
          mutedForeground: css("--muted-foreground") || "GrayText",
          border: css("--border") || "GrayText",
          fast: css("--lfp-fast") || "Highlight",
          mid: css("--lfp-mid") || "LinkText",
          slow: css("--lfp-slow") || "ButtonText",
          choiceA: css("--lfp-choice-a") || "MarkText",
          choiceB: css("--lfp-choice-b") || "Highlight"
        };
      }

      function roundedRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
      }

      function fitCanvas(canvas, height) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(280, canvas.clientWidth || 600);
        const h = height || canvas.clientHeight || 260;
        if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(h * dpr)) {
          canvas.width = Math.round(width * dpr);
          canvas.height = Math.round(h * dpr);
        }
        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
        return { ctx, width, height: h, dpr };
      }

      function setPressed(buttons, active, primary) {
        buttons.forEach((button) => {
          const on = button === active;
          button.setAttribute("aria-pressed", on ? "true" : "false");
          button.classList.toggle("btn-primary", on && primary !== false);
        });
      }

      $$("[data-audience-button]").forEach((button) => {
        button.addEventListener("click", () => {
          root.dataset.audience = button.dataset.audienceButton;
          setPressed($$("[data-audience-button]"), button);
        });
      });

      const dotsCanvas = $("#lfp-dots-canvas");
      const coherenceInput = $("#lfp-coherence");
      let dotDirection = -1;
      let dots = [];
      let dotLast = performance.now();

      function resetDots(width, height) {
        const count = Math.max(85, Math.round(width * height / 2600));
        dots = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - .5) * 1.3,
          vy: (Math.random() - .5) * 1.3,
          coherent: Math.random() < Number(coherenceInput.value) / 100,
          age: Math.random() * 100
        }));
      }

      function drawDots(now) {
        const { ctx, width, height } = fitCanvas(dotsCanvas, 360);
        const colors = palette();
        if (!dots.length || dots.length < Math.max(50, Math.round(width * height / 4000))) resetDots(width, height);
        const dt = Math.min(2.2, (now - dotLast) / 16.7 || 1);
        dotLast = now;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, width, height);
        const coherence = Number(coherenceInput.value) / 100;
        const speed = 1.45 + coherence * 1.2;
        ctx.fillStyle = colors.foreground;
        dots.forEach((dot) => {
          dot.age += dt;
          if (dot.age > 52) {
            dot.age = 0;
            dot.x = Math.random() * width;
            dot.y = Math.random() * height;
            dot.coherent = Math.random() < coherence;
            dot.vx = (Math.random() - .5) * 1.3;
            dot.vy = (Math.random() - .5) * 1.3;
          }
          if (dot.coherent) {
            dot.x += dotDirection * speed * dt;
          } else {
            dot.x += dot.vx * dt;
            dot.y += dot.vy * dt;
          }
          if (dot.x < 0) dot.x += width;
          if (dot.x > width) dot.x -= width;
          if (dot.y < 0) dot.y += height;
          if (dot.y > height) dot.y -= height;
          ctx.globalAlpha = .42 + .42 * Math.sin((dot.age / 52) * Math.PI);
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        if (!reducedMotion) requestAnimationFrame(drawDots);
      }

      coherenceInput.addEventListener("input", () => {
        const value = Number(coherenceInput.value);
        $("#lfp-coherence-value").textContent = value + "%";
        $("#lfp-difficulty-label").textContent = value < 25 ? "Difficult" : value < 60 ? "Moderate" : "Easy";
        dots.forEach((dot) => { dot.coherent = Math.random() < value / 100; });
        if (reducedMotion) drawDots(performance.now());
      });

      $$("[data-direction]").forEach((button) => {
        button.addEventListener("click", () => {
          dotDirection = button.dataset.direction === "left" ? -1 : 1;
          setPressed($$("[data-direction]"), button);
          dots.forEach((dot) => { dot.coherent = Math.random() < Number(coherenceInput.value) / 100; });
        });
      });

      $$("[data-choice]").forEach((button) => {
        button.addEventListener("click", () => {
          const choice = button.dataset.choice;
          const trueDirection = dotDirection < 0 ? "left" : "right";
          const clarity = Number(coherenceInput.value);
          const correct = choice === trueDirection;
          const response = clarity < 25
            ? "At low clarity, uncertainty lets identical evidence end in different choices. Those trial-to-trial differences power the CP analysis."
            : correct
              ? "With clearer evidence, your choice follows the stimulus more reliably. Researchers still compare choices within matched evidence levels."
              : "Even clear evidence can occasionally produce another choice—but stimulus matching remains essential before attributing the difference to choice."
          $("#lfp-choice-response").textContent = response;
          setPressed($$("[data-choice]"), button, false);
        });
      });

      const bands = {
        slow: {
          name: "Alpha–beta · 5–30 Hz",
          range: [5, 30],
          color: "slow",
          curious: "Slower activity varied across individuals and often carried a trace of the previous trial's outcome.",
          researcher: "Alpha–beta CP was heterogeneous; baseline CP differed by previous reward outcome in three of four monkeys."
        },
        mid: {
          name: "Low gamma · 30–70 Hz",
          range: [30, 70],
          color: "mid",
          curious: "Mid-speed fluctuations carried a stimulus-epoch choice signal that survived local silencing.",
          researcher: "Low-gamma CP persisted after spiking was abolished and was weighted toward the stimulus-orthogonal null dimension."
        },
        fast: {
          name: "High gamma · 70–150 Hz",
          range: [70, 150],
          color: "fast",
          curious: "Fast fluctuations often track local population spiking more closely.",
          researcher: "The published intervention tests whether high-gamma CP depends on intact local spiking output."
        }
      };
      let selectedBand = "fast";

      function traceValue(t, band) {
        const slow = .58 * Math.sin(2 * Math.PI * 9 * t + .2) + .3 * Math.sin(2 * Math.PI * 17 * t + 1.1);
        const mid = .32 * Math.sin(2 * Math.PI * 37 * t + .6) + .18 * Math.sin(2 * Math.PI * 46 * t + 2.2);
        const fast = .18 * Math.sin(2 * Math.PI * 82 * t + .4) + .12 * Math.sin(2 * Math.PI * 119 * t + 1.7);
        if (band === "slow") return slow;
        if (band === "mid") return mid;
        if (band === "fast") return fast;
        return slow + mid + fast + .04 * Math.sin(2 * Math.PI * 61 * t);
      }

      function drawSignal() {
        const canvas = $("#lfp-signal-canvas");
        const { ctx, width, height } = fitCanvas(canvas, 280);
        const colors = palette();
        const margin = { l: 42, r: 18, t: 20, b: 34 };
        const plotW = width - margin.l - margin.r;
        const topY = 74;
        const bottomY = 194;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = colors.background;
        roundedRect(ctx, 0, 0, width, height, 14);
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;
        [topY, bottomY].forEach((y) => {
          ctx.beginPath();
          ctx.moveTo(margin.l, y);
          ctx.lineTo(width - margin.r, y);
          ctx.stroke();
        });
        ctx.fillStyle = colors.mutedForeground;
        ctx.textAlign = "left";
        ctx.fillText("raw", 10, topY + 4);
        ctx.fillText("band", 10, bottomY + 4);
        ctx.textAlign = "center";
        [0, .5, 1].forEach((t) => {
          const x = margin.l + t * plotW;
          ctx.fillText(t.toFixed(1) + " s", x, height - 10);
        });
        function line(y, scale, band, color, alpha) {
          ctx.beginPath();
          for (let i = 0; i <= Math.round(plotW); i += 1) {
            const t = i / plotW;
            const v = traceValue(t, band);
            const x = margin.l + i;
            const yy = y - v * scale;
            if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
          }
          ctx.strokeStyle = color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = band ? 2.1 : 1.4;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        line(topY, 31, null, colors.foreground, .58);
        line(bottomY, selectedBand === "fast" ? 95 : selectedBand === "mid" ? 66 : 40, selectedBand, colors[bands[selectedBand].color], 1);
      }

      function drawSpectrum() {
        const canvas = $("#lfp-spectrum-canvas");
        const { ctx, width, height } = fitCanvas(canvas, 230);
        const colors = palette();
        const margin = { l: 44, r: 18, t: 14, b: 34 };
        const plotW = width - margin.l - margin.r;
        const plotH = height - margin.t - margin.b;
        const [f0, f1] = bands[selectedBand].range;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = colors.background;
        roundedRect(ctx, 0, 0, width, height, 14);
        ctx.fill();
        const x = (f) => margin.l + (f - 1) / 149 * plotW;
        const y = (p) => margin.t + (1 - p) * plotH;
        ctx.fillStyle = colors[bands[selectedBand].color];
        ctx.globalAlpha = .13;
        ctx.fillRect(x(f0), margin.t, x(f1) - x(f0), plotH);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin.l, margin.t);
        ctx.lineTo(margin.l, height - margin.b);
        ctx.lineTo(width - margin.r, height - margin.b);
        ctx.stroke();
        ctx.fillStyle = colors.mutedForeground;
        ctx.textAlign = "center";
        [1, 25, 50, 100, 150].forEach((f) => ctx.fillText(String(f), x(f), height - 11));
        ctx.save();
        ctx.translate(12, margin.t + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("power", 0, 0);
        ctx.restore();
        ctx.beginPath();
        for (let f = 1; f <= 150; f += 1) {
          const base = .88 / Math.pow(f, .39);
          const bump1 = .12 * Math.exp(-Math.pow((f - 10) / 6, 2));
          const bump2 = .08 * Math.exp(-Math.pow((f - 48) / 14, 2));
          const p = Math.min(.98, base + bump1 + bump2 + .04);
          if (f === 1) ctx.moveTo(x(f), y(p)); else ctx.lineTo(x(f), y(p));
        }
        ctx.strokeStyle = colors.foreground;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = colors[bands[selectedBand].color];
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let f = f0; f <= f1; f += 1) {
          const base = .88 / Math.pow(f, .39);
          const bump1 = .12 * Math.exp(-Math.pow((f - 10) / 6, 2));
          const bump2 = .08 * Math.exp(-Math.pow((f - 48) / 14, 2));
          const p = Math.min(.98, base + bump1 + bump2 + .04);
          if (f === f0) ctx.moveTo(x(f), y(p)); else ctx.lineTo(x(f), y(p));
        }
        ctx.stroke();
        ctx.fillStyle = colors.mutedForeground;
        ctx.textAlign = "right";
        ctx.fillText("frequency (Hz)", width - margin.r, height - 11);
      }

      function selectBand(button) {
        selectedBand = button.dataset.band;
        setPressed($$("[data-band]"), button);
        const band = bands[selectedBand];
        $("#lfp-band-name").textContent = band.name;
        $("#lfp-band-copy-curious").textContent = band.curious;
        $("#lfp-band-copy-researcher").textContent = band.researcher;
        drawSignal();
        drawSpectrum();
      }
      $$("[data-band]").forEach((button) => button.addEventListener("click", () => selectBand(button)));

      function erf(x) {
        const sign = x < 0 ? -1 : 1;
        const a = Math.abs(x);
        const t = 1 / (1 + .3275911 * a);
        const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-a * a);
        return sign * y;
      }

      function normalCdf(x, mean, sd) {
        return .5 * (1 + erf((x - mean) / (sd * Math.sqrt(2))));
      }

      function normalPdf(x, mean, sd) {
        const z = (x - mean) / sd;
        return Math.exp(-.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
      }

      const separationInput = $("#lfp-separation");
      const thresholdInput = $("#lfp-threshold");
      let cpStep = 1;

      function cpParams() {
        const sep = Number(separationInput.value) / 10;
        const threshold = Number(thresholdInput.value) / 10;
        const meanA = -sep / 2;
        const meanB = sep / 2;
        const auc = normalCdf(sep / Math.sqrt(2), 0, 1);
        const tpr = 1 - normalCdf(threshold, meanB, 1);
        const fpr = 1 - normalCdf(threshold, meanA, 1);
        return { sep, threshold, meanA, meanB, auc, tpr, fpr };
      }

      function drawDistributions() {
        const canvas = $("#lfp-distribution-canvas");
        const { ctx, width, height } = fitCanvas(canvas, 270);
        const colors = palette();
        const p = cpParams();
        const margin = { l: 42, r: 18, t: 20, b: 38 };
        const plotW = width - margin.l - margin.r;
        const plotH = height - margin.t - margin.b;
        const minX = -4.2;
        const maxX = 4.2;
        const px = (x) => margin.l + (x - minX) / (maxX - minX) * plotW;
        const py = (v) => margin.t + (1 - v / .43) * plotH;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = colors.background;
        roundedRect(ctx, 0, 0, width, height, 14);
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin.l, margin.t);
        ctx.lineTo(margin.l, height - margin.b);
        ctx.lineTo(width - margin.r, height - margin.b);
        ctx.stroke();
        const curves = [
          { mean: p.meanA, color: colors.choiceA, label: "left choice" },
          { mean: p.meanB, color: colors.choiceB, label: "right choice" }
        ];
        curves.forEach((curve) => {
          ctx.beginPath();
          ctx.moveTo(px(minX), py(0));
          for (let i = 0; i <= 180; i += 1) {
            const x = minX + (maxX - minX) * i / 180;
            ctx.lineTo(px(x), py(normalPdf(x, curve.mean, 1)));
          }
          ctx.lineTo(px(maxX), py(0));
          ctx.closePath();
          ctx.fillStyle = curve.color;
          ctx.globalAlpha = .13;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = curve.color;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        });
        if (cpStep >= 2) {
          const tx = px(p.threshold);
          ctx.setLineDash([6, 5]);
          ctx.strokeStyle = colors.foreground;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tx, margin.t);
          ctx.lineTo(tx, height - margin.b);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = colors.foreground;
          ctx.textAlign = tx > width - 90 ? "right" : "left";
          ctx.fillText("threshold", tx + (tx > width - 90 ? -6 : 6), margin.t + 14);
        }
        ctx.fillStyle = colors.choiceA;
        ctx.textAlign = "left";
        ctx.fillText("left choice", margin.l + 8, margin.t + 15);
        ctx.fillStyle = colors.choiceB;
        ctx.textAlign = "right";
        ctx.fillText("right choice", width - margin.r - 8, margin.t + 15);
        ctx.fillStyle = colors.mutedForeground;
        ctx.textAlign = "right";
        ctx.fillText("band-limited power →", width - margin.r, height - 11);
      }

      function drawRoc() {
        const canvas = $("#lfp-roc-canvas");
        const { ctx, width, height } = fitCanvas(canvas, 270);
        const colors = palette();
        const p = cpParams();
        const margin = { l: 44, r: 18, t: 18, b: 40 };
        const size = Math.min(width - margin.l - margin.r, height - margin.t - margin.b);
        const left = margin.l + Math.max(0, (width - margin.l - margin.r - size) / 2);
        const top = margin.t;
        const x = (v) => left + v * size;
        const y = (v) => top + (1 - v) * size;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = colors.background;
        roundedRect(ctx, 0, 0, width, height, 14);
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x(0), y(1));
        ctx.lineTo(x(0), y(0));
        ctx.lineTo(x(1), y(0));
        ctx.stroke();
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x(0), y(0));
        ctx.lineTo(x(1), y(1));
        ctx.strokeStyle = colors.mutedForeground;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        for (let i = 0; i <= 120; i += 1) {
          const threshold = 5 - 10 * i / 120;
          const fpr = 1 - normalCdf(threshold, p.meanA, 1);
          const tpr = 1 - normalCdf(threshold, p.meanB, 1);
          if (i === 0) ctx.moveTo(x(fpr), y(tpr)); else ctx.lineTo(x(fpr), y(tpr));
        }
        ctx.strokeStyle = colors.fast;
        ctx.lineWidth = 3;
        ctx.stroke();
        if (cpStep >= 2) {
          ctx.beginPath();
          ctx.arc(x(p.fpr), y(p.tpr), 6, 0, Math.PI * 2);
          ctx.fillStyle = colors.foreground;
          ctx.fill();
          ctx.strokeStyle = colors.background;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        if (cpStep >= 3) {
          ctx.globalAlpha = .08;
          ctx.fillStyle = colors.fast;
          ctx.beginPath();
          ctx.moveTo(x(0), y(0));
          for (let i = 0; i <= 120; i += 1) {
            const threshold = 5 - 10 * i / 120;
            const fpr = 1 - normalCdf(threshold, p.meanA, 1);
            const tpr = 1 - normalCdf(threshold, p.meanB, 1);
            ctx.lineTo(x(fpr), y(tpr));
          }
          ctx.lineTo(x(1), y(0));
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = colors.mutedForeground;
        ctx.textAlign = "center";
        ctx.fillText("false-alarm rate", left + size / 2, height - 11);
        ctx.save();
        ctx.translate(13, top + size / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("hit rate", 0, 0);
        ctx.restore();
        ctx.textAlign = "left";
        ctx.fillText("0", x(0), y(0) + 17);
        ctx.textAlign = "right";
        ctx.fillText("1", x(1), y(0) + 17);
      }

      function updateCp() {
        const p = cpParams();
        $("#lfp-threshold-value").textContent = p.threshold.toFixed(1);
        $("#lfp-auc-value").textContent = p.auc.toFixed(2);
        $("#lfp-tpr").textContent = p.tpr.toFixed(2);
        $("#lfp-fpr").textContent = p.fpr.toFixed(2);
        $("#lfp-separation-value").textContent = p.sep < .2 ? "None" : p.sep < .6 ? "Small" : p.sep < 1.2 ? "Moderate" : "Large";
        $("#lfp-auc-meaning").textContent = p.auc < .56 ? "chance-like" : p.auc < .7 ? "modest" : p.auc < .84 ? "strong" : "very strong";
        drawDistributions();
        drawRoc();
      }

      separationInput.addEventListener("input", updateCp);
      thresholdInput.addEventListener("input", updateCp);

      const cpText = {
        1: "<strong>Step 1:</strong> Compare trials with matched motion evidence, separating them only by the choice made.",
        2: "<strong>Step 2:</strong> Sweep a threshold across band-limited power. Every position yields one hit rate and one false-alarm rate.",
        3: "<strong>Step 3:</strong> The area under the ROC curve compresses all thresholds into one value—the choice probability."
      };
      $$("[data-cp-step]").forEach((button) => {
        button.addEventListener("click", () => {
          cpStep = Number(button.dataset.cpStep);
          setPressed($$("[data-cp-step]"), button);
          $("#lfp-threshold-field").style.opacity = cpStep === 1 ? ".45" : "1";
          $("#lfp-cp-chart-title").textContent = cpStep === 1 ? "Power distributions by choice" : cpStep === 2 ? "One threshold, one ROC point" : "All thresholds form the ROC curve";
          $("#lfp-cp-explanation").innerHTML = cpText[cpStep];
          updateCp();
        });
      });

      const conditionData = {
        pre: {
          title: "Local spiking is active",
          copy: "Choice-related signals appear across several frequency ranges.",
          spike: "spikes + LFP",
          widths: { slow: "46%", mid: "72%", fast: "58%" },
          statuses: { slow: "heterogeneous", mid: "CP 0.526", fast: "CP 0.521" }
        },
        post: {
          title: "Local spiking output is silenced",
          copy: "High-gamma CP falls to chance, while low-gamma CP persists.",
          spike: "spikes silenced · LFP remains",
          widths: { slow: "44%", mid: "58%", fast: "3%" },
          statuses: { slow: "heterogeneous", mid: "CP 0.521", fast: "CP 0.501" }
        }
      };

      function selectCondition(button) {
        const condition = button.dataset.conditionButton;
        root.dataset.condition = condition;
        setPressed($$("[data-condition-button]"), button);
        const data = conditionData[condition];
        $("#lfp-condition-title").textContent = data.title;
        $("#lfp-condition-copy").textContent = data.copy;
        $("#lfp-spike-label").textContent = data.spike;
        ["slow", "mid", "fast"].forEach((band) => {
          $("#lfp-result-" + band).style.setProperty("--w", data.widths[band]);
          $("#lfp-status-" + band).textContent = data.statuses[band];
        });
      }
      $$("[data-condition-button]").forEach((button) => button.addEventListener("click", () => selectCondition(button)));
      root.dataset.condition = "pre";

      const epochText = {
        baseline: "<strong>Baseline:</strong> alpha–beta CP varies across individuals and often differs according to the previous trial's reward outcome.",
        stimulus: "<strong>Stimulus:</strong> both gamma bands carry choice-related activity. High-gamma CP disappears after local spiking is silenced; low-gamma CP persists.",
        delay: "<strong>Delay:</strong> low- and high-gamma CP are at chance in the aggregate data. Alpha–beta effects remain heterogeneous."
      };

      $$("[data-epoch]").forEach((button) => {
        button.addEventListener("click", () => {
          const epoch = button.dataset.epoch;
          setPressed($$("[data-epoch]"), button);
          $$("[data-epoch-cell], [data-epoch-head]").forEach((cell) => {
            const isActive = (cell.dataset.epochCell || cell.dataset.epochHead) === epoch;
            cell.style.opacity = isActive ? "1" : ".42";
          });
          $("#lfp-epoch-copy").innerHTML = epochText[epoch];
        });
      });

      const claimFeedback = {
        "all-local": {
          state: "careful",
          title: "Too broad.",
          body: "Lower-frequency CP persisted when local MT spiking was abolished. The data therefore reject a single local-spike origin for every band."
        },
        distinct: {
          state: "correct",
          title: "Best supported.",
          body: "High-gamma CP depended on intact local spiking, whereas lower-frequency CP did not. That contrast supports distinct dependencies across bands."
        },
        "named-source": {
          state: "careful",
          title: "The source remains underdetermined.",
          body: "Persistence rules out dependence on local spiking output, but it does not identify which remote area, input pathway, or network process generated the signal."
        }
      };

      $$("[data-claim]").forEach((button) => {
        button.addEventListener("click", () => {
          setPressed($$("[data-claim]"), button, false);
          const feedback = claimFeedback[button.dataset.claim];
          const box = $("#lfp-feedback");
          box.dataset.state = feedback.state;
          box.innerHTML = "<strong>" + feedback.title + "</strong><p>" + feedback.body + "</p>";
        });
      });

      let resizeTimer;
      function redrawAll() {
        if (reducedMotion) drawDots(performance.now());
        drawSignal();
        drawSpectrum();
        updateCp();
      }
      window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(redrawAll, 120);
      });

      const themeObserver = new MutationObserver(() => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(redrawAll, 80);
      });
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });

      drawSignal();
      drawSpectrum();
      updateCp();
      if (reducedMotion) drawDots(performance.now()); else requestAnimationFrame(drawDots);
    })();
