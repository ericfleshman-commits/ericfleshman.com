(function () {
  "use strict";

  var STEPS = [
    { title: "A keystroke enters the UI event loop", body: "The terminal interface listens for keyboard input. Your Enter press is just another event until the focused agent view decides what it means.", nodes: [0] },
    { title: "Enter becomes a SendPrompt action", body: "The prompt handler checks an action registry. Enter does not call the model itself; it produces a high-level SendPrompt action carrying the text you typed.", nodes: [0,1] },
    { title: "Dispatch enqueues the prompt", body: "The send dispatcher validates the active session and places your message on a pending queue. If the agent is idle, the queue drains immediately. If a turn is running, the prompt waits.", nodes: [1,2] },
    { title: "An effect becomes an ACP prompt request", body: "Draining the queue yields a SendPrompt effect. The effect runner builds a protocol request with a session id, content blocks, and prompt metadata, then sends it across the agent channel.", nodes: [2,3] },
    { title: "The agent receives the prompt", body: "The main agent object accepts the request, resolves the session handle, applies session-level checks, and hands the work to the session actor rather than running the full turn inline.", nodes: [3,4] },
    { title: "The session actor queues input", body: "The prompt arrives as a session command. The session actor records it with prompt history and starts a running task when nothing else is active.", nodes: [4,5] },
    { title: "The turn begins", body: "Commands and skills can rewrite or short-circuit the input. Otherwise the text becomes a user message in chat state, the durable conversation memory for that session.", nodes: [5,6] },
    { title: "The full request is built", body: "Before any network call, chat state assembles system instructions, prior history, the new message, and the tool definitions the model may use. The sampler sends that package, not just the last line you typed.", nodes: [6,7] },
    { title: "The sampler calls the model", body: "The sampler owns retries, metrics, and the streamed HTTP call to the model. The session can wait for a completed outcome while partial results flow separately.", nodes: [7,8] },
    { title: "Updates stream home", body: "As tokens and tool intents arrive, the agent pushes updates back across ACP. If the model requests tools, the session runs them, appends results, rebuilds the request, and samples again until the turn ends.", nodes: [8,9,3,0] }
  ];
  var NODE_LABELS = ["UI keys","Actions","UI queue","ACP","Agent","Session","Chat state","Build req","Sampler","Model HTTP"];
  var stepIndex = 0;
  var playTimer = null;

  function renderPipeline(activeSet) {
    var el = document.getElementById("pipeline");
    el.innerHTML = "";
    NODE_LABELS.forEach(function (label,i) {
      if (i > 0) {
        var link = document.createElement("div");
        link.className = "pipe-link" + (activeSet[i] || activeSet[i-1] ? " on" : "");
        el.appendChild(link);
      }
      var node = document.createElement("div");
      var on = !!activeSet[i];
      node.className = "pipe-node" + (on ? " on" : " dim");
      node.textContent = label;
      el.appendChild(node);
    });
  }
  function setStep(i) {
    stepIndex = (i + STEPS.length) % STEPS.length;
    var step = STEPS[stepIndex];
    document.getElementById("stepTitle").textContent = (stepIndex + 1) + ". " + step.title;
    document.getElementById("stepBody").textContent = step.body;
    var list = document.getElementById("stepList");
    Array.prototype.forEach.call(list.querySelectorAll(".step-btn"),function (btn,idx) { btn.classList.toggle("active",idx === stepIndex); });
    var active = {};
    step.nodes.forEach(function (n) { active[n] = true; });
    renderPipeline(active);
  }
  function stopPlay() {
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
      document.getElementById("playSteps").textContent = "Play";
    }
  }
  STEPS.forEach(function (step,i) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "step-btn";
    btn.innerHTML = '<span class="n">' + String(i+1).padStart(2,"0") + '</span><span class="t">' + step.title + "</span>";
    btn.addEventListener("click",function () { stopPlay(); setStep(i); });
    document.getElementById("stepList").appendChild(btn);
  });
  document.getElementById("prevStep").addEventListener("click",function () { stopPlay(); setStep(stepIndex-1); });
  document.getElementById("nextStep").addEventListener("click",function () { stopPlay(); setStep(stepIndex+1); });
  document.getElementById("playSteps").addEventListener("click",function () {
    if (playTimer) { stopPlay(); return; }
    document.getElementById("playSteps").textContent = "Pause";
    playTimer = setInterval(function () { setStep(stepIndex+1); },2800);
  });
  setStep(0);

  var ROWS = [
    { dest: "Model inference", purpose: "Stream chat and tool-calling turns through xAI or a custom model URL", auth: "Session token or API key", riskWhat: "Prompts, history, tool results, file content the model has read, and secrets in that context", controls: "Use a known gateway, pin models, configure retention, and treat custom model URLs as full data-plane destinations", risk: "High" },
    { dest: "Authentication and refresh", purpose: "Browser OAuth, device code, external authentication provider, and silent token refresh", auth: "OIDC with PKCE, refresh token, or external authentication binary", riskWhat: "Access and refresh tokens plus identity claims", controls: "Protect local credentials, prefer short-lived tokens, and log out to clear", risk: "High" },
    { dest: "Trace storage", purpose: "Upload session and turn artifacts for debugging and product pipelines", auth: "User token through proxy, or optional cloud credentials for direct modes", riskWhat: "Session structure, turn metadata, and enabled artifacts", controls: "Disable trace upload, use zero data retention settings, and avoid long-lived cloud keys", risk: "High" },
    { dest: "Product telemetry and Mixpanel", purpose: "Product usage events and optional analytics", auth: "Events API key or project token when configured", riskWhat: "Event names, properties, versions, feature use, and user or team ids", controls: "Telemetry switch, Mixpanel switch, custom events URL, and secret scrubbing", risk: "Medium" },
    { dest: "External OpenTelemetry", purpose: "Optionally ship curated metrics and events to an operator-controlled collector", auth: "Collector headers, not xAI credentials", riskWhat: "Counters and content-free events by default; optional gates can add more detail", controls: "Double opt-in master switch and content gates that default off", risk: "Low" },
    { dest: "HTTP MCP servers", purpose: "Remote MCP tools over HTTP or server-sent events", auth: "Configured headers and optional per-server OAuth", riskWhat: "Tool arguments, results, tokens, and anything the remote server can do", controls: "Treat each URL as a trust decision, use timeouts and output caps, and add permission rules", risk: "High" },
    { dest: "Web search", purpose: "Hosted search through the configured model path", auth: "Same credential class as other xAI-backed tools", riskWhat: "Search queries and snippets that enter model context", controls: "Feature flags, domain filters, and permission policy on later actions", risk: "Medium" },
    { dest: "Web fetch", purpose: "Fetch public pages and convert them for the model", auth: "Unauthenticated public fetch by design", riskWhat: "Server-side request forgery if unchecked, plus fetched content entering context", controls: "Domain allowlists, private-range blocking, redirect checks, size caps, and timeouts", risk: "Medium" },
    { dest: "Image and video generation", purpose: "Generate or edit image and video media", auth: "Session token or API key", riskWhat: "Prompts, reference images, generated media, and billing signals", controls: "Feature gating, tier gating, and session-local output paths", risk: "Medium" },
    { dest: "Auto-update", purpose: "Check release channels and install command-line builds", auth: "Public channel pointers", riskWhat: "Supply chain: a malicious artifact could replace the binary", controls: "Disable automatic updates for locked fleets and allowlist trusted hosts", risk: "High" },
    { dest: "Share and relay", purpose: "Optional live session sync and off-host transcript sharing", auth: "User authentication for relay and share", riskWhat: "Live session events and exported messages", controls: "Default-off relay, user-initiated share, and zero-retention restrictions", risk: "High" },
    { dest: "Plugin marketplace git clone", purpose: "Clone marketplace sources and plugins into managed storage", auth: "Git credentials from the environment", riskWhat: "A code-execution path through hooks, MCP servers, and skills after trust", controls: "Explicit trust, source review, and organization-controlled remotes", risk: "High" }
  ];
  var sortCol = 5;
  var sortAsc = false;
  function riskRank(r) { return r === "High" ? 3 : r === "Medium" ? 2 : 1; }
  function filteredRows() {
    var q = (document.getElementById("tableFilter").value || "").toLowerCase();
    var risk = document.getElementById("riskFilter").value;
    return ROWS.filter(function (row) {
      if (risk !== "all" && row.risk !== risk) return false;
      if (!q) return true;
      return [row.dest,row.purpose,row.auth,row.riskWhat,row.controls,row.risk].join(" ").toLowerCase().indexOf(q) !== -1;
    });
  }
  function sortedRows() {
    var rows = filteredRows().slice();
    var keys = ["dest","purpose","auth","riskWhat","controls","risk"];
    var key = keys[sortCol];
    rows.sort(function (a,b) {
      var cmp = key === "risk" ? riskRank(a[key]) - riskRank(b[key]) : String(a[key]).localeCompare(String(b[key]));
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }
  function renderTable() {
    var body = document.getElementById("secBody");
    body.innerHTML = "";
    sortedRows().forEach(function (row) {
      var tr = document.createElement("tr");
      tr.innerHTML = '<td class="dest"></td><td></td><td></td><td></td><td></td><td><span class="risk ' + row.risk.toLowerCase() + '"></span></td>';
      var cells = tr.querySelectorAll("td");
      cells[0].textContent = row.dest;
      cells[1].textContent = row.purpose;
      cells[2].textContent = row.auth;
      cells[3].textContent = row.riskWhat;
      cells[4].textContent = row.controls;
      cells[5].querySelector(".risk").textContent = row.risk;
      body.appendChild(tr);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll("#secTable th"),function (th) {
    th.addEventListener("click",function () {
      var col = parseInt(th.getAttribute("data-col"),10);
      if (sortCol === col) sortAsc = !sortAsc;
      else { sortCol = col; sortAsc = true; }
      renderTable();
    });
  });
  document.getElementById("tableFilter").addEventListener("input",renderTable);
  document.getElementById("riskFilter").addEventListener("change",renderTable);
  renderTable();

  var sectionIds = ["lifecycle","acp","laziness","subagents","security","checklist"];
  var tocLinks = document.querySelectorAll("nav.toc a");
  function updateToc() {
    var y = window.scrollY + 140;
    var current = sectionIds[0];
    sectionIds.forEach(function (id) { var el = document.getElementById(id); if (el && el.offsetTop <= y) current = id; });
    Array.prototype.forEach.call(tocLinks,function (a) { a.classList.toggle("active",a.getAttribute("href") === "#" + current); });
  }
  window.addEventListener("scroll",updateToc,{ passive: true });
  updateToc();
})();
