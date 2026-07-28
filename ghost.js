// Ghost run: replays one real agent run in the homepage slot above the live
// box. Pure DOM, no network, no video file. The run text is real output,
// captured from production and embedded verbatim in #ghost-note.
(function () {
  var box = document.getElementById("ghost-box");
  var dataEl = document.getElementById("ghost-note");
  if (!box || !dataEl) return;

  var data;
  try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var input = document.getElementById("ghost-input");
  var btn = document.getElementById("ghost-btn");
  var status = document.getElementById("ghost-status");
  var output = document.getElementById("ghost-output");

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function finalState() {
    input.textContent = data.company;
    status.textContent = "researched by Perplexity. written under my rules.";
    output.hidden = false;
    output.textContent = data.note;
  }

  if (reduced) { finalState(); return; }

  var played = false;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function play() {
    if (played) return; played = true;

    // 1. type the company name
    for (var i = 0; i <= data.company.length; i++) {
      input.textContent = data.company.slice(0, i);
      input.appendChild(caret());
      await sleep(95);
    }
    await sleep(350);

    // 2. press the button
    btn.classList.add("ghost-pressed");
    await sleep(250);

    // 3. the same statuses the live box uses
    status.textContent = "Perplexity: researching the public web...";
    await sleep(1600);
    status.textContent = "writing the systems hypothesis...";
    await sleep(1200);

    // 4. stream the real note, word by word
    output.hidden = false;
    var words = data.note.split(" ");
    var shown = [];
    for (var w = 0; w < words.length; w++) {
      shown.push(words[w]);
      output.textContent = shown.join(" ");
      await sleep(26);
    }

    // 5. close it out
    status.textContent = "researched by Perplexity. written under my rules.";
    btn.classList.remove("ghost-pressed");
  }

  function caret() {
    var c = document.createElement("span");
    c.className = "ghost-caret";
    return c;
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { io.disconnect(); play(); }
      });
    }, { threshold: 0.45 });
    io.observe(box);
  } else {
    finalState();
  }
})();
