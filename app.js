/* =========================================================
   Seminari 2 · Càlcul
   Interfície, pràctica i repte
   ========================================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "seminari2-calcul-progress-v1";
  const VALID_VIEWS = ["inici", "teoria", "practica", "repte"];
  const CHALLENGE_SECONDS = 15 * 60;

  const UNIT_INFO = {
    1: {
      title: "Domini",
      chip: "Bloc 01",
      summary: "Radicals, logaritmes i denominadors: trobar tots els valors possibles de x.",
      tip: "Comença determinant què no pot ser zero i què ha de ser positiu.",
      theory: "teoria-1"
    },
    2: {
      title: "Composició",
      chip: "Bloc 02",
      summary: "Substituir una funció dins d'una altra i no confondre la composició amb un producte.",
      tip: "La funció que està més a prop de la x actua primer. Vigila els parèntesis.",
      theory: "teoria-2"
    },
    3: {
      title: "Equacions",
      chip: "Bloc 03",
      summary: "Canvis de variable, propietats dels logaritmes i comprovació de solucions.",
      tip: "Abans de resoldre, apunta les condicions de domini. Després comprova cada candidat.",
      theory: "teoria-3"
    },
    4: {
      title: "Bolzano",
      chip: "Bloc 04",
      summary: "Continuïtat i canvi de signe per assegurar l'existència d'una arrel.",
      tip: "Escriu sempre les dues hipòtesis: continuïtat a [a,b] i f(a)·f(b) < 0.",
      theory: "teoria-4"
    },
    5: {
      title: "Grau 3",
      chip: "Bloc 05",
      summary: "Límits a l'infinit i Bolzano per demostrar que tot cúbic té una arrel real.",
      tip: "El terme ax³ domina. Mira el signe de a i calcula els límits a ±∞.",
      theory: "teoria-5"
    }
  };

  const state = {
    currentView: "inici",
    currentUnit: 1,
    question: null,
    answered: false,
    selected: null,
    pendingScroll: null,
    progress: loadProgress(),
    session: {
      correct: 0,
      total: 0,
      streak: 0
    },
    challenge: {
      status: "idle",
      questions: [],
      answers: [],
      index: 0,
      remaining: CHALLENGE_SECONDS,
      timerId: null,
      confirmOpen: false,
      timedOut: false
    }
  };

  let toastTimer = null;

  const els = {
    views: Array.from(document.querySelectorAll(".view")),
    navLinks: Array.from(document.querySelectorAll(".nav-link")),
    topicTabs: document.getElementById("topic-tabs"),
    practiceLayout: document.getElementById("practice-layout"),
    questionCard: document.getElementById("question-card"),
    sessionCorrect: document.getElementById("session-correct"),
    sessionTotal: document.getElementById("session-total"),
    sessionStreak: document.getElementById("session-streak"),
    sessionAccuracyFill: document.getElementById("session-accuracy-fill"),
    sessionAccuracyLabel: document.getElementById("session-accuracy-label"),
    sideUnitTitle: document.getElementById("side-unit-title"),
    sideUnitChip: document.getElementById("side-unit-chip"),
    sideUnitSummary: document.getElementById("side-unit-summary"),
    sideUnitTip: document.getElementById("side-unit-tip"),
    sideUnitProgress: document.getElementById("side-unit-progress"),
    sideUnitFill: document.getElementById("side-unit-fill"),
    sideTheoryLink: document.getElementById("side-theory-link"),
    challengeRoot: document.getElementById("challenge-root"),
    viewRepte: document.getElementById("view-repte"),
    homeProgressBar: document.getElementById("home-progress-bar"),
    homeProgressCount: document.getElementById("home-progress-count"),
    homeProgressTitle: document.getElementById("home-progress-title"),
    toast: document.getElementById("toast")
  };

  /* =========================================================
     Persistència
     ========================================================= */

  function defaultProgress() {
    const units = {};
    for (let i = 1; i <= 5; i++) {
      units[i] = { attempted: 0, correct: 0 };
    }
    return {
      units,
      challenge: { best: 0 }
    };
  }

  function loadProgress() {
    const base = defaultProgress();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return base;

      for (let i = 1; i <= 5; i++) {
        const source = parsed.units && parsed.units[i];
        if (source && typeof source === "object") {
          base.units[i].attempted = Math.max(0, Number(source.attempted) || 0);
          base.units[i].correct = Math.max(0, Number(source.correct) || 0);
        }
      }
      if (parsed.challenge && Number.isFinite(Number(parsed.challenge.best))) {
        base.challenge.best = Math.max(0, Math.min(10, Number(parsed.challenge.best)));
      }
    } catch (error) {
      // Si el navegador bloqueja localStorage, la web continua funcionant.
    }
    return base;
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    } catch (error) {
      // Sense persistència: no interrompem l'experiència.
    }
  }

  /* =========================================================
     Navegació
     ========================================================= */

  function parseHash() {
    const raw = window.location.hash.replace(/^#/, "");
    if (raw.startsWith("teoria-")) {
      return { view: "teoria", target: raw };
    }
    return {
      view: VALID_VIEWS.includes(raw) ? raw : "inici",
      target: null
    };
  }

  function navigate(view, target) {
    const safeView = VALID_VIEWS.includes(view) ? view : "inici";
    state.pendingScroll = target || null;

    if (window.location.hash === `#${safeView}`) {
      showView(safeView);
      return;
    }

    window.location.hash = safeView;
  }

  function showView(view) {
    const safeView = VALID_VIEWS.includes(view) ? view : "inici";
    state.currentView = safeView;

    els.views.forEach((section) => {
      section.hidden = section.id !== `view-${safeView}`;
    });

    els.navLinks.forEach((link) => {
      const active = link.dataset.nav === safeView;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    if (safeView === "practica") {
      if (!state.question) {
        loadQuestion(state.currentUnit);
      } else {
        renderSideUnit();
      }
    }

    if (safeView === "repte") {
      renderChallenge();
      if (state.challenge.status === "active" && !state.challenge.timerId) {
        startChallengeTimer();
      }
    }

    if (state.pendingScroll) {
      const target = state.pendingScroll;
      state.pendingScroll = null;
      window.requestAnimationFrame(() => {
        scrollToTarget(target);
      });
    } else {
      window.requestAnimationFrame(() => {
        window.scrollTo(0, 0);
      });
    }
  }

  function scrollToTarget(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start"
    });
  }

  function routeFromHash(initial) {
    const route = parseHash();
    if (route.target) {
      state.pendingScroll = route.target;
    }
    showView(route.view);
    if (initial && !route.target) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  /* =========================================================
     Pràctica
     ========================================================= */

  function startPractice(unit) {
    const nextUnit = Number(unit) || 1;
    if (nextUnit !== state.currentUnit || !state.question) {
      loadQuestion(nextUnit);
    } else {
      updateTopicTabs();
      renderSideUnit();
    }
    navigate("practica");
  }

  function loadQuestion(unit) {
    state.currentUnit = Number(unit) || 1;
    state.question = window.Seminari2.generate(state.currentUnit);
    state.answered = false;
    state.selected = null;
    updateTopicTabs();
    renderQuestion();
    renderSideUnit();
  }

  function updateTopicTabs() {
    if (!els.topicTabs) return;
    Array.from(els.topicTabs.querySelectorAll(".topic-tab")).forEach((tab) => {
      const active = Number(tab.dataset.topic) === state.currentUnit;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (els.practiceLayout) {
      els.practiceLayout.dataset.unit = String(state.currentUnit);
    }
  }

  function renderQuestion() {
    const q = state.question;
    if (!q || !els.questionCard) return;

    const letters = ["A", "B", "C", "D"];
    const info = UNIT_INFO[q.unit];

    els.questionCard.innerHTML = `
      <div class="q-top">
        <div class="q-tags">
          <span class="tag tag-unit">Bloc 0${q.unit} · ${info.title}</span>
          <span class="tag">${q.kind}</span>
        </div>
        <span class="q-counter">Exercici generat</span>
      </div>
      <p class="q-prompt">${q.prompt}</p>
      <div class="q-display">${q.display}</div>
      <details class="hint">
        <summary>Necessites una pista?</summary>
        <p>${q.hint}</p>
      </details>
      <div class="options" role="group" aria-label="Tria una resposta">
        ${q.options.map((option, index) => `
          <button class="option" type="button" data-index="${index}" aria-label="Opció ${letters[index]}">
            <span class="option-key" aria-hidden="true">${letters[index]}</span>
            <span class="option-text">${option.html}</span>
            <span class="option-mark" aria-hidden="true"></span>
          </button>
        `).join("")}
      </div>
      <div class="feedback" id="practice-feedback" aria-live="polite" hidden></div>
      <div class="q-actions">
        <button class="btn btn-outline btn-small" type="button" id="skip-question">Canvia exercici</button>
        <button class="btn btn-primary btn-small" type="button" id="next-question" hidden>Següent exercici <span aria-hidden="true">→</span></button>
      </div>
      <p class="shortcut-hint">Consell: pots prémer <kbd>A</kbd> <kbd>B</kbd> <kbd>C</kbd> <kbd>D</kbd> per respondre i <kbd>N</kbd> per passar al següent.</p>
    `;

    els.questionCard.classList.remove("is-refreshing");
    // Reinicia l'animació de l'exercici.
    void els.questionCard.offsetWidth;
    els.questionCard.classList.add("is-refreshing");

    els.questionCard.querySelectorAll(".option").forEach((button) => {
      button.addEventListener("click", () => answerPractice(Number(button.dataset.index)));
    });
    const next = document.getElementById("next-question");
    const skip = document.getElementById("skip-question");
    if (next) next.addEventListener("click", () => loadQuestion(state.currentUnit));
    if (skip) skip.addEventListener("click", () => loadQuestion(state.currentUnit));

    updateSessionStats();
  }

  function answerPractice(index) {
    if (state.answered || !state.question) return;
    const q = state.question;
    const chosen = q.options[index];
    if (!chosen) return;

    state.answered = true;
    state.selected = index;

    state.session.total += 1;
    const unitProgress = state.progress.units[q.unit];
    unitProgress.attempted += 1;

    if (chosen.correct) {
      state.session.correct += 1;
      state.session.streak += 1;
      unitProgress.correct += 1;
    } else {
      state.session.streak = 0;
    }

    saveProgress();

    const buttons = Array.from(els.questionCard.querySelectorAll(".option"));
    buttons.forEach((button, btnIndex) => {
      const option = q.options[btnIndex];
      const mark = button.querySelector(".option-mark");
      button.disabled = true;

      if (option.correct) {
        button.classList.add("is-correct");
        if (mark) mark.textContent = "✓";
      } else if (btnIndex === index) {
        button.classList.add("is-wrong");
        if (mark) mark.textContent = "✕";
      } else {
        button.classList.add("is-dimmed");
      }
    });

    const feedback = document.getElementById("practice-feedback");
    const next = document.getElementById("next-question");
    if (feedback) {
      const good = chosen.correct;
      const streakText = state.session.streak >= 3
        ? `Ratxa de ${state.session.streak}! Ho tens molt clar.`
        : "Correcte! Bon raonament.";
      feedback.className = `feedback ${good ? "is-good" : "is-bad"}`;
      feedback.innerHTML = `
        <div class="feedback-head">
          <span class="feedback-icon" aria-hidden="true">${good ? "✓" : "✕"}</span>
          <div>
            <strong>${good ? streakText : "No és aquesta. Revisa el pas clau."}</strong>
            <p>${good ? "La solució completa queda aquí sota per consolidar la idea." : "La resposta correcta està marcada en verd."}</p>
            ${good ? "" : `<div class="feedback-answer">Resposta correcta: <span class="math-inline">${q.answer}</span></div>`}
          </div>
        </div>
        <div class="solution">
          <h5>Solució pas a pas</h5>
          <ol class="solution-steps">
            ${q.steps.map((step) => `<li>${step}</li>`).join("")}
          </ol>
        </div>
      `;
      feedback.hidden = false;
      window.requestAnimationFrame(() => {
        feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }

    if (next) {
      next.hidden = false;
      next.focus({ preventScroll: true });
    }

    updateSessionStats();
    updateProgressUI();
  }

  function updateSessionStats() {
    const session = state.session;
    if (els.sessionCorrect) els.sessionCorrect.textContent = String(session.correct);
    if (els.sessionTotal) els.sessionTotal.textContent = String(session.total);
    if (els.sessionStreak) els.sessionStreak.textContent = String(session.streak);

    if (els.sessionAccuracyFill && els.sessionAccuracyLabel) {
      if (session.total === 0) {
        els.sessionAccuracyFill.style.width = "0%";
        els.sessionAccuracyLabel.textContent = "Encara sense dades";
      } else {
        const accuracy = Math.round((session.correct / session.total) * 100);
        els.sessionAccuracyFill.style.width = `${accuracy}%`;
        els.sessionAccuracyLabel.textContent = `${accuracy}% d'encerts en aquesta sessió`;
      }
    }
  }

  function renderSideUnit() {
    const info = UNIT_INFO[state.currentUnit];
    const progress = state.progress.units[state.currentUnit];
    if (!info) return;

    if (els.sideUnitTitle) els.sideUnitTitle.textContent = info.title;
    if (els.sideUnitChip) els.sideUnitChip.textContent = info.chip;
    if (els.sideUnitSummary) els.sideUnitSummary.textContent = info.summary;
    if (els.sideUnitTip) els.sideUnitTip.textContent = info.tip;

    const capped = Math.min(progress.correct, 5);
    if (els.sideUnitProgress) {
      els.sideUnitProgress.textContent = progress.correct >= 5 ? "Dominat ✓" : `${capped} / 5`;
    }
    if (els.sideUnitFill) {
      els.sideUnitFill.style.width = `${(capped / 5) * 100}%`;
    }
    if (els.sideTheoryLink) {
      els.sideTheoryLink.dataset.scroll = info.theory;
    }
  }

  /* =========================================================
     Progrés
     ========================================================= */

  function updateProgressUI() {
    let total = 0;

    for (let unit = 1; unit <= 5; unit++) {
      const correct = state.progress.units[unit].correct;
      const capped = Math.min(correct, 5);
      total += capped;

      document.querySelectorAll(`[data-progress-fill="${unit}"]`).forEach((bar) => {
        bar.style.width = `${(capped / 5) * 100}%`;
      });
      document.querySelectorAll(`[data-progress-label="${unit}"]`).forEach((label) => {
        label.textContent = correct >= 5 ? "Dominat ✓" : `${capped} / 5`;
      });
      document.querySelectorAll(`[data-progress-card="${unit}"]`).forEach((card) => {
        card.classList.toggle("is-mastered", correct >= 5);
      });
    }

    if (els.homeProgressBar) {
      els.homeProgressBar.style.width = `${(total / 25) * 100}%`;
    }
    if (els.homeProgressCount) {
      els.homeProgressCount.textContent = `${total} / 25 encerts`;
    }
    if (els.homeProgressTitle) {
      if (total === 0) {
        els.homeProgressTitle.textContent = "Encara no has començat. Tria un bloc i fes el primer exercici.";
      } else if (total >= 25) {
        els.homeProgressTitle.textContent = "Has dominat els cinc blocs. Ara toca demostrar-ho al repte final.";
      } else {
        const nextUnit = [1, 2, 3, 4, 5].find((unit) => state.progress.units[unit].correct < 5);
        const nextInfo = UNIT_INFO[nextUnit];
        els.homeProgressTitle.textContent = `${total} de 25 encerts. El següent pas: ${nextInfo.title.toLowerCase()}.`;
      }
    }

    renderSideUnit();
  }

  /* =========================================================
     Repte
     ========================================================= */

  function clearChallengeTimer() {
    if (state.challenge.timerId) {
      window.clearInterval(state.challenge.timerId);
      state.challenge.timerId = null;
    }
  }

  function startChallenge() {
    clearChallengeTimer();
    state.challenge.status = "active";
    state.challenge.questions = window.Seminari2.generateChallenge(2);
    state.challenge.answers = Array(state.challenge.questions.length).fill(null);
    state.challenge.index = 0;
    state.challenge.remaining = CHALLENGE_SECONDS;
    state.challenge.confirmOpen = false;
    state.challenge.timedOut = false;
    renderChallenge();
    window.scrollTo({ top: 0, behavior: "smooth" });
    startChallengeTimer();
  }

  function startChallengeTimer() {
    clearChallengeTimer();
    if (document.hidden) return;
    state.challenge.timerId = window.setInterval(() => {
      const challenge = state.challenge;
      if (challenge.status !== "active") return;
      if (state.currentView !== "repte") return;

      challenge.remaining -= 1;
      updateChallengeTimer();

      if (challenge.remaining <= 0) {
        challenge.remaining = 0;
        finishChallenge(true);
      }
    }, 1000);
  }

  function updateChallengeTimer() {
    const timer = document.getElementById("challenge-timer");
    if (!timer) return;
    timer.textContent = formatTime(state.challenge.remaining);
    timer.classList.toggle("is-danger", state.challenge.remaining <= 60);
  }

  function formatTime(seconds) {
    const safe = Math.max(0, seconds);
    const minutes = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  }

  function renderChallenge() {
    if (!els.challengeRoot) return;
    const challenge = state.challenge;

    if (els.viewRepte) {
      els.viewRepte.classList.toggle("is-session", challenge.status !== "idle");
    }

    if (challenge.status === "active") {
      renderChallengeActive();
    } else if (challenge.status === "finished") {
      renderChallengeResults();
    } else {
      renderChallengeIntro();
    }
  }

  function renderChallengeIntro() {
    const best = state.progress.challenge.best;
    els.challengeRoot.innerHTML = `
      <div class="challenge-intro">
        <div class="challenge-intro-copy">
          <span class="challenge-badge">Simulacre · 15 minuts</span>
          <h3>Demostra que ho tens <em>tot connectat.</em></h3>
          <p>
            Deu preguntes dels cinc blocs, sense pistes i amb el rellotge corrent.
            Quan lliuris, veuràs la puntuació, el detall per bloc i la solució de cada exercici.
          </p>
          <ul class="challenge-features">
            <li>2 preguntes de cada bloc</li>
            <li>Pots navegar endavant i endarrere abans de lliurar</li>
            <li>El temps es pausa si surts de la pestanya</li>
            <li>Correcció completa i sense límits d'intents</li>
          </ul>
          <div class="challenge-actions">
            <button class="btn btn-primary" type="button" id="start-challenge">
              Comença el repte <span aria-hidden="true">→</span>
            </button>
            ${best > 0 ? `<span class="challenge-best">El teu rècord: <strong>${best} / 10</strong></span>` : ""}
          </div>
        </div>
        <div class="challenge-intro-side">
          <div class="challenge-scorecard">
            <span class="challenge-scorecard-label">Format del repte</span>
            <div class="challenge-score-main">
              <strong>10</strong>
              <span>preguntes</span>
            </div>
            <div class="challenge-meta-list">
              <div class="challenge-meta-item"><strong>15′</strong><span>temps límit</span></div>
              <div class="challenge-meta-item"><strong>2</strong><span>per bloc</span></div>
              <div class="challenge-meta-item"><strong>0</strong><span>pistes</span></div>
              <div class="challenge-meta-item"><strong>∞</strong><span>intents</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const start = document.getElementById("start-challenge");
    if (start) start.addEventListener("click", startChallenge);
  }

  function renderChallengeActive() {
    const challenge = state.challenge;
    const q = challenge.questions[challenge.index];
    const letters = ["A", "B", "C", "D"];
    const answeredCount = challenge.answers.filter((answer) => answer !== null).length;
    const unanswered = challenge.answers.length - answeredCount;
    const selected = challenge.answers[challenge.index];
    const last = challenge.index === challenge.questions.length - 1;

    updateChallengeTimer();

    els.challengeRoot.innerHTML = `
      <div class="challenge-shell">
        <div class="challenge-topbar">
          <span class="challenge-timer" id="challenge-timer">${formatTime(challenge.remaining)}</span>
          <span class="challenge-topbar-mid">Pregunta ${challenge.index + 1} de ${challenge.questions.length} · ${answeredCount} ${answeredCount === 1 ? "resposta" : "respostes"}</span>
          <span class="tag">En curs</span>
        </div>

        <div class="challenge-body">
          <div class="challenge-card">
            <div class="q-top">
              <div class="q-tags">
                <span class="tag tag-unit">Bloc 0${q.unit} · ${UNIT_INFO[q.unit].title}</span>
                <span class="tag">${q.kind}</span>
              </div>
              <span class="q-counter">Sense correcció fins al final</span>
            </div>
            <p class="q-prompt">${q.prompt}</p>
            <div class="q-display">${q.display}</div>
            <div class="options" role="group" aria-label="Tria una resposta">
              ${q.options.map((option, index) => `
                <button class="option challenge-option ${selected === index ? "is-selected" : ""}" type="button" data-challenge-option="${index}" aria-label="Opció ${letters[index]}" aria-pressed="${selected === index ? "true" : "false"}">
                  <span class="option-key" aria-hidden="true">${letters[index]}</span>
                  <span class="option-text">${option.html}</span>
                </button>
              `).join("")}
            </div>
          </div>

          <aside class="challenge-nav" aria-label="Navegació del repte">
            <div class="palette-card">
              <h3>Preguntes</h3>
              <div class="palette">
                ${challenge.questions.map((item, index) => `
                  <button type="button" data-go-question="${index}" aria-label="Pregunta ${index + 1}" class="${index === challenge.index ? "is-current" : ""} ${challenge.answers[index] !== null ? "is-answered" : ""}">${index + 1}</button>
                `).join("")}
              </div>
              <div class="palette-legend">
                <span><span class="legend-dot is-answered"></span>Resposta</span>
                <span><span class="legend-dot"></span>Pendent</span>
              </div>
            </div>

            <div class="challenge-nav-actions">
              <button class="btn btn-outline btn-small" type="button" id="prev-challenge" ${challenge.index === 0 ? "disabled" : ""}>← Anterior</button>
              <button class="btn btn-outline btn-small" type="button" id="next-challenge" ${last ? "disabled" : ""}>Següent →</button>
            </div>

            <div class="challenge-submit">
              <p>Respostes: ${answeredCount} / ${challenge.questions.length} · ${unanswered} ${unanswered === 1 ? "pendent" : "pendents"}</p>
              <button class="btn btn-primary btn-small" type="button" id="finish-challenge">Lliura el repte</button>
              ${challenge.confirmOpen ? `
                <div class="confirm-box">
                  <p>${unanswered > 0 ? (unanswered === 1 ? "Et queda 1 pregunta sense respondre." : `Et queden ${unanswered} preguntes sense respondre.`) : "Has respost totes les preguntes."} Vols lliurar i veure la correcció?</p>
                  <div class="confirm-actions">
                    <button class="btn btn-primary btn-small" type="button" id="confirm-finish">Sí, lliura</button>
                    <button class="btn btn-outline btn-small" type="button" id="cancel-finish">Continua</button>
                  </div>
                </div>
              ` : ""}
            </div>

            <p class="pause-note">El rellotge es pausa mentre surts d'aquesta pestanya. En tornar, continua on era.</p>
          </aside>
        </div>
      </div>
    `;

    els.challengeRoot.querySelectorAll("[data-challenge-option]").forEach((button) => {
      button.addEventListener("click", () => {
        selectChallengeOption(Number(button.dataset.challengeOption));
      });
    });

    els.challengeRoot.querySelectorAll("[data-go-question]").forEach((button) => {
      button.addEventListener("click", () => {
        goToChallengeQuestion(Number(button.dataset.goQuestion));
      });
    });

    const prev = document.getElementById("prev-challenge");
    const next = document.getElementById("next-challenge");
    const finish = document.getElementById("finish-challenge");
    const confirm = document.getElementById("confirm-finish");
    const cancel = document.getElementById("cancel-finish");

    if (prev) prev.addEventListener("click", () => goToChallengeQuestion(challenge.index - 1));
    if (next) next.addEventListener("click", () => goToChallengeQuestion(challenge.index + 1));
    if (finish) {
      finish.addEventListener("click", () => {
        challenge.confirmOpen = true;
        renderChallengeActive();
      });
    }
    if (confirm) confirm.addEventListener("click", () => finishChallenge(false));
    if (cancel) {
      cancel.addEventListener("click", () => {
        challenge.confirmOpen = false;
        renderChallengeActive();
      });
    }
  }

  function selectChallengeOption(index) {
    const challenge = state.challenge;
    if (challenge.status !== "active") return;
    const q = challenge.questions[challenge.index];
    if (!q || !q.options[index]) return;
    challenge.answers[challenge.index] = index;
    challenge.confirmOpen = false;
    renderChallengeActive();
  }

  function goToChallengeQuestion(index) {
    const challenge = state.challenge;
    if (challenge.status !== "active") return;
    if (index < 0 || index >= challenge.questions.length) return;
    challenge.index = index;
    challenge.confirmOpen = false;
    renderChallengeActive();
  }

  function finishChallenge(timedOut) {
    const challenge = state.challenge;
    if (challenge.status !== "active") return;

    clearChallengeTimer();
    challenge.status = "finished";
    challenge.confirmOpen = false;
    challenge.timedOut = Boolean(timedOut);

    let score = 0;
    challenge.questions.forEach((q, index) => {
      const answer = challenge.answers[index];
      if (answer !== null && q.options[answer] && q.options[answer].correct) {
        score += 1;
      }
    });
    challenge.score = score;

    if (score > state.progress.challenge.best) {
      state.progress.challenge.best = score;
      saveProgress();
    }

    renderChallengeResults();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderChallengeResults() {
    const challenge = state.challenge;
    const score = challenge.score || 0;
    const total = challenge.questions.length;
    const percent = total ? Math.round((score / total) * 100) : 0;
    const letters = ["A", "B", "C", "D"];

    let headline;
    if (score >= 9) headline = "Excel·lent. El seminari no et farà por.";
    else if (score >= 7) headline = "Molt bé. Tens la base i només cal polir.";
    else if (score >= 5) headline = "Bon pas. Revisa els errors i repeteix.";
    else headline = "Toca repassar. Mira les solucions i torna-hi.";

    const introText = challenge.timedOut
      ? "S'ha acabat el temps. Aquesta és la teva correcció: aprofita-la per detectar què cal repassar."
      : "Repte lliurat. A sota tens el detall per bloc i la solució de cada pregunta.";

    const perUnit = {};
    challenge.questions.forEach((q, index) => {
      if (!perUnit[q.unit]) perUnit[q.unit] = { correct: 0, total: 0 };
      perUnit[q.unit].total += 1;
      const answer = challenge.answers[index];
      if (answer !== null && q.options[answer] && q.options[answer].correct) {
        perUnit[q.unit].correct += 1;
      }
    });

    const weakest = [1, 2, 3, 4, 5].reduce((worst, unit) => {
      const current = perUnit[unit] || { correct: 0, total: 0 };
      const best = perUnit[worst] || { correct: 0, total: 0 };
      return current.correct / Math.max(1, current.total) < best.correct / Math.max(1, best.total)
        ? unit
        : worst;
    }, 1);

    els.challengeRoot.innerHTML = `
      <div class="result-hero">
        <div class="score-ring" style="--pct: ${percent}">
          <strong>${score}</strong>
          <span>de ${total}</span>
        </div>
        <div class="result-copy">
          <p class="eyebrow">Repte completat · ${percent}%</p>
          <h3>${headline}</h3>
          <p>${introText}</p>
          <div class="result-actions">
            <button class="btn btn-primary" type="button" id="retry-challenge">Torna-ho a provar <span aria-hidden="true">↻</span></button>
            <button class="btn btn-outline" type="button" data-practice="${weakest}">Repassa el bloc 0${weakest}</button>
            <button class="btn btn-outline" type="button" data-nav="teoria" data-scroll="teoria-${weakest}">Obre la teoria</button>
          </div>
        </div>
      </div>

      <div class="result-breakdown" aria-label="Resultat per bloc">
        ${[1, 2, 3, 4, 5].map((unit) => {
          const data = perUnit[unit] || { correct: 0, total: 0 };
          return `
            <div class="breakdown-item">
              <span>${UNIT_INFO[unit].title}</span>
              <strong>${data.correct}<small>/ ${data.total}</small></strong>
            </div>
          `;
        }).join("")}
      </div>

      <section class="review-section" aria-labelledby="review-title">
        <div class="review-heading">
          <h3 id="review-title">Revisa les preguntes</h3>
          <p>Verd = correcta · Vermell = la teva resposta incorrecta</p>
        </div>
        <div class="review-list">
          ${challenge.questions.map((q, index) => {
            const answer = challenge.answers[index];
            const isCorrect = answer !== null && q.options[answer] && q.options[answer].correct;
            const statusSymbol = isCorrect ? "✓" : answer === null ? "–" : "✕";
            const statusText = isCorrect ? "Correcta" : answer === null ? "Sense resposta" : "Incorrecta";

            return `
              <details class="review-item">
                <summary>
                  <span class="review-status ${isCorrect ? "" : "is-wrong"}">${statusSymbol}</span>
                  <span class="review-summary-text">
                    <strong>${index + 1}. ${q.prompt}</strong>
                    <span>${UNIT_INFO[q.unit].title} · ${q.kind} · ${statusText}</span>
                  </span>
                </summary>
                <div class="review-content">
                  <p class="review-prompt">${q.prompt}</p>
                  <div class="review-display">${q.display}</div>
                  <div class="review-options">
                    ${q.options.map((option, optionIndex) => {
                      const selected = answer === optionIndex;
                      const correct = option.correct;
                      let cls = "";
                      let note = "";
                      if (correct) {
                        cls = "is-correct";
                        note = "Correcta";
                      } else if (selected) {
                        cls = "is-selected-wrong";
                        note = "La teva resposta";
                      }
                      return `
                        <div class="review-option ${cls}">
                          <span class="review-option-key">${letters[optionIndex]}</span>
                          <span>${option.html}</span>
                          ${note ? `<span class="review-option-note">${note}</span>` : ""}
                        </div>
                      `;
                    }).join("")}
                  </div>
                  <div class="review-solution">
                    <h4>Solució pas a pas</h4>
                    <ol class="solution-steps">
                      ${q.steps.map((step) => `<li>${step}</li>`).join("")}
                    </ol>
                  </div>
                </div>
              </details>
            `;
          }).join("")}
        </div>
      </section>
    `;

    const retry = document.getElementById("retry-challenge");
    if (retry) retry.addEventListener("click", startChallenge);
  }

  /* =========================================================
     Esdeveniments
     ========================================================= */

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const practiceButton = event.target.closest("[data-practice]");
      if (practiceButton) {
        event.preventDefault();
        startPractice(practiceButton.dataset.practice);
        return;
      }

      const navButton = event.target.closest("[data-nav]");
      if (navButton) {
        event.preventDefault();
        navigate(navButton.dataset.nav, navButton.dataset.scroll || null);
        return;
      }

      const scrollButton = event.target.closest("[data-scroll]");
      if (scrollButton) {
        event.preventDefault();
        const target = scrollButton.dataset.scroll;
        if (state.currentView !== "teoria") {
          navigate("teoria", target);
        } else {
          scrollToTarget(target);
        }
      }
    });

    if (els.topicTabs) {
      els.topicTabs.addEventListener("click", (event) => {
        const tab = event.target.closest(".topic-tab");
        if (!tab) return;
        const unit = Number(tab.dataset.topic);
        if (unit === state.currentUnit) return;
        loadQuestion(unit);
      });
    }

    const reset = document.getElementById("reset-progress");
    if (reset) {
      reset.addEventListener("click", () => {
        const confirmed = window.confirm(
          "Vols esborrar tot el progrés i els rècords? Aquesta acció no es pot desfer."
        );
        if (!confirmed) return;

        clearChallengeTimer();
        state.progress = defaultProgress();
        state.session = { correct: 0, total: 0, streak: 0 };
        state.challenge.status = "idle";
        state.challenge.questions = [];
        state.challenge.answers = [];
        state.challenge.index = 0;
        state.challenge.remaining = CHALLENGE_SECONDS;
        state.challenge.confirmOpen = false;
        state.currentUnit = 1;

        saveProgress();
        loadQuestion(1);
        updateSessionStats();
        updateProgressUI();
        renderChallenge();
        showToast("Progrés esborrat. Comencem de nou.");
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = document.activeElement ? document.activeElement.tagName : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = event.key.toLowerCase();

      if (state.currentView === "practica") {
        if (!state.answered && (/^[abcd]$/.test(key) || /^[1-4]$/.test(key))) {
          const map = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
          answerPractice(map[key]);
          event.preventDefault();
          return;
        }
        if (state.answered && key === "n") {
          loadQuestion(state.currentUnit);
          event.preventDefault();
        }
        return;
      }

      if (state.currentView === "repte" && state.challenge.status === "active") {
        if (/^[abcd]$/.test(key) || /^[1-4]$/.test(key)) {
          const map = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
          const q = state.challenge.questions[state.challenge.index];
          if (q && q.options[map[key]]) {
            selectChallengeOption(map[key]);
            event.preventDefault();
          }
        } else if (event.key === "ArrowRight") {
          goToChallengeQuestion(state.challenge.index + 1);
          event.preventDefault();
        } else if (event.key === "ArrowLeft") {
          goToChallengeQuestion(state.challenge.index - 1);
          event.preventDefault();
        }
      }
    });

    window.addEventListener("hashchange", () => {
      const route = parseHash();
      if (route.target) state.pendingScroll = route.target;
      showView(route.view);
    });

    document.addEventListener("visibilitychange", () => {
      if (state.challenge.status !== "active" || state.currentView !== "repte") return;
      if (document.hidden) {
        clearChallengeTimer();
      } else {
        startChallengeTimer();
      }
    });
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("is-visible");
    }, 2800);
  }

  /* =========================================================
     Inici
     ========================================================= */

  function init() {
    bindEvents();
    updateSessionStats();
    updateProgressUI();
    loadQuestion(state.currentUnit);
    renderChallenge();
    routeFromHash(true);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
