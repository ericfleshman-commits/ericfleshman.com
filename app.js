(function () {
  var input = document.getElementById("company-input");
  var btn = document.getElementById("run-loop");
  var status = document.getElementById("agent-status");
  var output = document.getElementById("agent-output");
  var box = document.querySelector(".agent-box");
  var running = false;

  var steps = [
    "Perplexity: researching the public web...",
    "Claude: writing the systems hypothesis...",
    "closing the loop...",
  ];

  function setStatus(text) { status.textContent = text; }

  async function runLoop() {
    if (running) return;
    var company = (input.value || "").trim();
    if (company.length < 2) {
      setStatus("give me a company name first.");
      input.focus();
      return;
    }
    running = true;
    btn.disabled = true;
    if (box) box.classList.add("running");
    output.hidden = true;
    output.textContent = "";

    var stepIndex = 0;
    setStatus(steps[0]);
    var ticker = setInterval(function () {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      setStatus(steps[stepIndex]);
    }, 1200);

    try {
      var res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: company }),
      });
      var data = await res.json().catch(function () { return {}; });
      clearInterval(ticker);

      if (res.ok && data.note) {
        setStatus("researched by Perplexity. written by Claude.");
        output.textContent = "";
        var q = document.createElement("div");
        q.className = "agent-q";
        q.textContent = "What GTM system would I build for " + company + "?";
        var a = document.createElement("div");
        a.className = "agent-a";
        a.textContent = data.note;
        output.appendChild(q);
        output.appendChild(a);
        output.hidden = false;
      } else {
        setStatus("");
        output.textContent =
          (data && data.message) ||
          "The loop hit a snag. The reliable fallback: eric.fleshman@gmail.com";
        output.hidden = false;
      }
    } catch (e) {
      clearInterval(ticker);
      setStatus("");
      output.textContent =
        "The loop hit a snag. The reliable fallback: eric.fleshman@gmail.com";
      output.hidden = false;
    } finally {
      running = false;
      btn.disabled = false;
      if (box) box.classList.remove("running");
    }
  }

  btn.addEventListener("click", runLoop);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") runLoop();
  });
})();


/* Count-up on the big numbers, once, when they scroll into view. */
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;
  var nums = document.querySelectorAll(".stat-num");
  function animate(el) {
    var raw = el.textContent;
    var m = raw.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)([\s\S]*)$/);
    if (!m) return;
    var prefix = m[1];
    var target = parseFloat(m[2]);
    var suffix = m[3];
    var decimals = (m[2].split(".")[1] || "").length;
    var start = null;
    var dur = 900;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (p < 1) { requestAnimationFrame(frame); } else { el.textContent = raw; }
    }
    requestAnimationFrame(frame);
  }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        obs.unobserve(entry.target);
        animate(entry.target);
      }
    });
  }, { threshold: 0.4 });
  nums.forEach(function (el) { obs.observe(el); });
})();
