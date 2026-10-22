/* =========================================================
   Seminari 2 · Càlcul
   Generadors d'exercicis
   ========================================================= */

(function () {
  "use strict";

  const MINUS = "−";
  const INF = "∞";

  /* ---------- Utilitats ---------- */

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(values) {
    return values[Math.floor(Math.random() * values.length)];
  }

  function shuffle(values) {
    const copy = values.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function num(n) {
    return n < 0 ? MINUS + Math.abs(n) : String(n);
  }

  function signed(n, first) {
    if (n === 0) return "";
    if (first) return (n < 0 ? MINUS : "") + Math.abs(n);
    return ` ${n < 0 ? MINUS : "+"} ${Math.abs(n)}`;
  }

  function term(coef, variable, first) {
    if (coef === 0) return "";
    const abs = Math.abs(coef);
    const body = variable === ""
      ? String(abs)
      : `${abs === 1 ? "" : abs}${variable}`;
    if (first) return (coef < 0 ? MINUS : "") + body;
    return ` ${coef < 0 ? MINUS : "+"} ${body}`;
  }

  function poly2(a, b, c) {
    let out = "";
    out += term(a, "x²", true);
    out += term(b, "x", out === "");
    out += term(c, "", out === "");
    return out || "0";
  }

  function poly3(a, b, c, d) {
    let out = "";
    out += term(a, "x³", true);
    out += term(b, "x²", out === "");
    out += term(c, "x", out === "");
    out += term(d, "", out === "");
    return out || "0";
  }

  function linear(a, b) {
    let out = "";
    out += term(a, "x", true);
    out += term(b, "", out === "");
    return out || "0";
  }

  function factorRoot(root) {
    return root < 0
      ? `(x + ${Math.abs(root)})`
      : `(x ${MINUS} ${root})`;
  }

  function sqrtHTML(inner) {
    return `<span class="sqrt"><span class="rad">${inner}</span></span>`;
  }

  function fracHTML(top, bottom) {
    return `<span class="frac"><span class="frac-top">${top}</span><span class="frac-bottom">${bottom}</span></span>`;
  }

  /* ---------- Construcció de preguntes ---------- */

  function buildOptions(correct, wrongs) {
    const seen = new Set([correct]);
    const options = [{ html: correct, correct: true }];

    wrongs.forEach((wrong) => {
      if (options.length < 4 && !seen.has(wrong)) {
        seen.add(wrong);
        options.push({ html: wrong, correct: false });
      }
    });

    const fallbacks = [
      "Cap de les anteriors",
      "No existeix cap solució",
      "Tots els nombres reals",
      "No es pot determinar amb aquestes dades"
    ];
    let i = 0;
    while (options.length < 4 && i < fallbacks.length) {
      const candidate = fallbacks[i++];
      if (!seen.has(candidate)) {
        seen.add(candidate);
        options.push({ html: candidate, correct: false });
      }
    }

    return shuffle(options);
  }

  function makeQuestion(data) {
    return {
      unit: data.unit,
      kind: data.kind,
      prompt: data.prompt,
      display: data.display,
      hint: data.hint,
      options: buildOptions(data.correct, data.wrongs),
      steps: data.steps,
      answer: data.correct
    };
  }

  /* =========================================================
     BLOC 1 · DOMINI
     ========================================================= */

  function domainRadicalFraction() {
    const r1 = randInt(-7, -1);
    const r2 = randInt(2, 7);
    const denominator = poly2(1, -(r1 + r2), r1 * r2);
    const correct = `(${MINUS}${INF}, ${num(r1)}) ∪ (${num(r2)}, ${INF})`;

    return makeQuestion({
      unit: 1,
      kind: "Radical i quocient",
      prompt: "Troba el domini de la funció.",
      display: `f(x) = ${sqrtHTML(fracHTML("1", denominator))}`,
      hint: "El numerador és positiu. Per tant, el signe del radicand depèn només del denominador. Factoritza'l i mira on és positiu.",
      correct,
      wrongs: [
        `(${num(r1)}, ${num(r2)})`,
        `[${num(r1)}, ${num(r2)}]`,
        `ℝ \\\\ {${num(r1)}, ${num(r2)}}`
      ],
      steps: [
        `La funció és una arrel quadrada d'una fracció. Cal que el radicand sigui positiu o zero: ${fracHTML("1", denominator)} ≥ 0.`,
        `Com que el numerador és 1 &gt; 0, la fracció és positiva exactament quan ${denominator} &gt; 0.`,
        `Factoritzem el denominador: ${denominator} = ${factorRoot(r1)}${factorRoot(r2)}. Les arrels són ${num(r1)} i ${num(r2)}.`,
        `La paràbola s'obre cap amunt, així que és positiva fora de les arrels. Els punts ${num(r1)} i ${num(r2)} no entren al domini perquè anul·len el denominador.`,
        `Per tant, D = ${correct}.`
      ]
    });
  }

  function domainRadicalDenominator() {
    const a = randInt(-3, 3);
    const b = a + randInt(2, 5);
    const numerator = sqrtHTML(linear(1, -a));
    const denominator = linear(1, -b);
    const correct = `[${num(a)}, ${num(b)}) ∪ (${num(b)}, ${INF})`;

    return makeQuestion({
      unit: 1,
      kind: "Radical i denominador",
      prompt: "Troba el domini de la funció.",
      display: `f(x) = ${fracHTML(numerator, denominator)}`,
      hint: "Hi ha dues restriccions: una per l'arrel i una pel denominador. Resol-les per separat i després interseca els resultats.",
      correct,
      wrongs: [
        `[${num(a)}, ${INF})`,
        `(${num(a)}, ${num(b)}) ∪ (${num(b)}, ${INF})`,
        `[${num(a)}, ${num(b)}]`
      ],
      steps: [
        `L'arrel quadrada exigeix ${linear(1, -a)} ≥ 0, és a dir, x ≥ ${num(a)}.`,
        `El denominador no es pot anul·lar: ${denominator} ≠ 0, així que x ≠ ${num(b)}.`,
        `Com que ${num(b)} &gt; ${num(a)}, el punt ${num(b)} és dins del tram permès per l'arrel. L'hem d'eliminar.`,
        `Així, el domini és [${num(a)}, ${num(b)}) ∪ (${num(b)}, ${INF}).`
      ]
    });
  }

  function domainLogarithm() {
    const c = randInt(2, 6);
    const outside = Math.random() < 0.5;
    const inside = outside
      ? poly2(1, 0, -(c * c))
      : poly2(-1, 0, c * c);
    const correct = outside
      ? `(${MINUS}${INF}, ${num(-c)}) ∪ (${num(c)}, ${INF})`
      : `(${num(-c)}, ${num(c)})`;

    return makeQuestion({
      unit: 1,
      kind: "Logaritme",
      prompt: "Troba el domini de la funció logarítmica.",
      display: `g(x) = ln(${inside})`,
      hint: "L'argument del logaritme ha de ser estrictament positiu. Factoritza la diferència de quadrats i estudia'n el signe.",
      correct,
      wrongs: outside
        ? [
            `[${num(-c)}, ${num(c)}]`,
            `(${num(-c)}, ${num(c)})`,
            `ℝ \\\\ {${num(-c)}, ${num(c)}}`
          ]
        : [
            `(${MINUS}${INF}, ${num(-c)}) ∪ (${num(c)}, ${INF})`,
            `[${num(-c)}, ${num(c)}]`,
            `ℝ \\\\ {${num(-c)}, ${num(c)}}`
          ],
      steps: outside
        ? [
            `Cal que l'argument sigui positiu: ${inside} &gt; 0.`,
            `Factoritzem: ${inside} = ${factorRoot(-c)}${factorRoot(c)}. Les arrels són ${num(-c)} i ${num(c)}.`,
            `Amb el coeficient principal positiu, la paràbola és positiva fora de les arrels.`,
            `Per tant, D = ${correct}.`
          ]
        : [
            `Cal que l'argument sigui positiu: ${inside} &gt; 0.`,
            `Reescrit: ${poly2(1, 0, -(c * c))} &lt; 0. La paràbola és negativa entre les arrels ${num(-c)} i ${num(c)}.`,
            `Per tant, D = ${correct}.`
          ]
    });
  }

  function domainLogCubic() {
    const k = randInt(1, 5);
    const inside = poly3(1, 0, k, 0);
    const correct = `(0, ${INF})`;

    return makeQuestion({
      unit: 1,
      kind: "Logaritme cúbic",
      prompt: "Troba el domini de la funció.",
      display: `f(x) = ln(${inside})`,
      hint: "Factoritza el polinomi extreient x. El factor quadrat que queda és sempre positiu.",
      correct,
      wrongs: [
        `ℝ`,
        `(${MINUS}${INF}, 0)`,
        `ℝ \\\\ {0}`
      ],
      steps: [
        `Cal que ${inside} &gt; 0.`,
        `Factoritzem: ${inside} = x(x² + ${k}).`,
        `El factor x² + ${k} és sempre positiu perquè és una suma de quadrats. Així, el signe del producte és el signe de x.`,
        `Cal x &gt; 0. Per tant, D = (0, ${INF}).`
      ]
    });
  }

  function domainMixed() {
    const b = randInt(1, 6);
    const a = b + randInt(1, 5);
    const denominator = linear(1, -a);
    const logArgument = linear(1, -b);
    const correct = `(${num(b)}, ${num(a)}) ∪ (${num(a)}, ${INF})`;

    return makeQuestion({
      unit: 1,
      kind: "Fracció i logaritme",
      prompt: "Troba el domini de la funció.",
      display: `f(x) = ${fracHTML("1", denominator)} + ln(${logArgument})`,
      hint: "La fracció imposa una condició i el logaritme una altra. El domini és la intersecció, però compte: el punt que anul·la el denominador també pot ser dins del domini del logaritme.",
      correct,
      wrongs: [
        `(${num(b)}, ${INF})`,
        `(${num(a)}, ${INF})`,
        `ℝ \\\\ {${num(a)}}`
      ],
      steps: [
        `El denominador no s'anul·la: ${denominator} ≠ 0, així que x ≠ ${num(a)}.`,
        `L'argument del logaritme ha de ser positiu: ${logArgument} &gt; 0, així que x &gt; ${num(b)}.`,
        `Com que ${num(a)} &gt; ${num(b)}, el punt ${num(a)} és dins del tram x &gt; ${num(b)} i l'hem d'eliminar.`,
        `Per tant, D = ${correct}.`
      ]
    });
  }

  /* =========================================================
     BLOC 2 · COMPOSICIÓ
     ========================================================= */

  function makeComposition(fHtml, gHtml, comps, kind) {
    const chosen = pick(comps);
    const wrongs = comps
      .filter((comp) => comp !== chosen)
      .map((comp) => comp.html);

    return makeQuestion({
      unit: 2,
      kind: kind || "Composició",
      prompt: `Quina és l'expressió de ${chosen.label} per a les funcions següents?`,
      display: `<div class="fn-pair"><span>f(x) = ${fHtml}</span><span>g(x) = ${gHtml}</span></div><div class="q-ask">Calcula ${chosen.label}</div>`,
      hint: "La composició és una substitució, no una multiplicació: posa la funció interior allà on hi ha la x de la funció exterior.",
      correct: chosen.html,
      wrongs,
      steps: [
        `La composició es llegeix de dins cap enfora: ${chosen.label} = ${chosen.def}.`,
        chosen.explain,
        `Així, ${chosen.label} = ${chosen.html}.`,
        `Recorda que, en general, f ∘ g ≠ g ∘ f i que f ∘ g no és el producte f · g.`
      ]
    });
  }

  function compositionSin() {
    const b = pick([-7, -5, -4, -3, -2, 2, 3, 4, 5, 7]);
    const c = pick([-6, -4, -2, 2, 3, 5]);
    const g = poly2(1, b, c);
    const patch = (value, variable) => {
      if (value === 0) return "";
      return ` ${value < 0 ? MINUS : "+"} ${Math.abs(value) === 1 ? "" : Math.abs(value)} ${variable}`;
    };
    const gf = `sin²x${patch(b, "sin x")}${c < 0 ? ` ${MINUS} ${Math.abs(c)}` : c > 0 ? ` + ${c}` : ""}`;
    const gg = `(${g})²${patch(b, `(${g})`)}${c < 0 ? ` ${MINUS} ${Math.abs(c)}` : c > 0 ? ` + ${c}` : ""}`;

    const comps = [
      {
        label: "(f∘g)(x)",
        html: `sin(${g})`,
        def: "f(g(x))",
        explain: `Dins de f, la x de sin x es substitueix per tota l'expressió g(x) = ${g}. Per això el parèntesi és imprescindible: sin(${g}).`
      },
      {
        label: "(g∘f)(x)",
        html: gf,
        def: "g(f(x))",
        explain: `Dins de g, cada x es substitueix per f(x) = sin x. Llavors (sin x)² + ${b} sin x ${c < 0 ? MINUS : "+"} ${Math.abs(c)}.`
      },
      {
        label: "(f∘f)(x)",
        html: "sin(sin x)",
        def: "f(f(x))",
        explain: "La funció exterior i la interior són la mateixa: dins de sin x hi posem sin x."
      },
      {
        label: "(g∘g)(x)",
        html: gg,
        def: "g(g(x))",
        explain: `Dins de g, cada x es substitueix per g(x) = ${g}. Això dona (${g})² ${b < 0 ? MINUS : "+"} ${Math.abs(b)}(${g}) ${c < 0 ? MINUS : "+"} ${Math.abs(c)}.`
      }
    ];

    return makeComposition("sin x", g, comps, "Sinus");
  }

  function compositionLog() {
    const a = randInt(1, 8);
    const g = poly2(1, 0, a);
    const comps = [
      {
        label: "(f∘g)(x)",
        html: `ln(${g})`,
        def: "f(g(x))",
        explain: `Dins de f(x) = ln x hi posem g(x): ln(${g}). Com que ${g} &gt; 0 per a tot x, aquesta composició té domini ℝ.`
      },
      {
        label: "(g∘f)(x)",
        html: `(ln x)² + ${a}`,
        def: "g(f(x))",
        explain: `Dins de g(x) = ${g}, cada x es substitueix per ln x: (ln x)² + ${a}. Cal x &gt; 0 perquè ln x existeixi.`
      },
      {
        label: "(f∘f)(x)",
        html: "ln(ln x)",
        def: "f(f(x))",
        explain: "Dins del logaritme hi posem un altre logaritme: ln(ln x). Cal x &gt; 1 perquè ln x sigui positiu."
      },
      {
        label: "(g∘g)(x)",
        html: `(${g})² + ${a}`,
        def: "g(g(x))",
        explain: `Dins de g hi posem g(x): (${g})² + ${a}.`
      }
    ];

    return makeComposition("ln x", g, comps, "Logaritme");
  }

  function compositionExp() {
    const a = randInt(1, 5);
    const g = poly2(1, 0, -a);
    const comps = [
      {
        label: "(f∘g)(x)",
        html: `e<sup>${g}</sup>`,
        def: "f(g(x))",
        explain: `Dins de f(x) = e<sup>x</sup>, l'exponent és g(x): e<sup>${g}</sup>.`
      },
      {
        label: "(g∘f)(x)",
        html: `e<sup>2x</sup> ${MINUS} ${a}`,
        def: "g(f(x))",
        explain: `Dins de g, x es substitueix per e<sup>x</sup>: (e<sup>x</sup>)² ${MINUS} ${a} = e<sup>2x</sup> ${MINUS} ${a}.`
      },
      {
        label: "(f∘f)(x)",
        html: "e<sup>eˣ</sup>",
        def: "f(f(x))",
        explain: "Dins de l'exponent hi posem e<sup>x</sup>: e<sup>eˣ</sup>."
      },
      {
        label: "(g∘g)(x)",
        html: `(${g})² ${MINUS} ${a}`,
        def: "g(g(x))",
        explain: `Dins de g hi posem g(x): (${g})² ${MINUS} ${a}.`
      }
    ];

    return makeComposition("e<sup>x</sup>", g, comps, "Exponencial");
  }

  function compositionSqrt() {
    const a = randInt(1, 6);
    const g = poly2(1, 0, a);
    const comps = [
      {
        label: "(f∘g)(x)",
        html: sqrtHTML(g),
        def: "f(g(x))",
        explain: `Dins de f(x) = √x hi posem g(x): ${sqrtHTML(g)}. Com que ${g} &gt; 0, el domini és ℝ.`
      },
      {
        label: "(g∘f)(x)",
        html: `x + ${a} &nbsp;(x ≥ 0)`,
        def: "g(f(x))",
        explain: `Dins de g, x es substitueix per √x: (√x)² + ${a} = x + ${a}, amb x ≥ 0 perquè √x existeixi.`
      },
      {
        label: "(f∘f)(x)",
        html: sqrtHTML(sqrtHTML("x")) + " &nbsp;(x ≥ 0)",
        def: "f(f(x))",
        explain: "Dins de l'arrel hi posem una altra arrel: √(√x). Cal x ≥ 0."
      },
      {
        label: "(g∘g)(x)",
        html: `(${g})² + ${a}`,
        def: "g(g(x))",
        explain: `Dins de g hi posem g(x): (${g})² + ${a}.`
      }
    ];

    return makeComposition("√x", g, comps, "Arrel");
  }

  /* =========================================================
     BLOC 3 · EQUACIONS
     ========================================================= */

  function equationExpNegative() {
    const r = randInt(2, 5);
    const q = randInt(6, 10);
    const b = 2 * (q - r);
    const c = 2 * r * q;
    const correct = `x = ln ${r}`;

    return makeQuestion({
      unit: 3,
      kind: "Exponencial",
      prompt: "Resol l'equació exponencial.",
      display: `2e<sup>x</sup> + ${b} ${MINUS} ${c}e<sup>${MINUS}x</sup> = 0`,
      hint: `Multiplica tots els termes per e<sup>x</sup> &gt; 0. Després fes el canvi t = e<sup>x</sup>, tenint present que t &gt; 0.`,
      correct,
      wrongs: [
        `x = ln ${r} i x = ln ${q}`,
        `x = ln ${q}`,
        `x = ${r}`
      ],
      steps: [
        `Multipliquem per e<sup>x</sup> &gt; 0: 2e<sup>2x</sup> + ${b}e<sup>x</sup> ${MINUS} ${c} = 0.`,
        `Dividim per 2: e<sup>2x</sup> + ${q - r}e<sup>x</sup> ${MINUS} ${r * q} = 0.`,
        `Fem t = e<sup>x</sup>, amb t &gt; 0: t² + ${q - r}t ${MINUS} ${r * q} = 0.`,
        `Factoritzem: (t ${MINUS} ${r})(t + ${q}) = 0. Per tant, t = ${r} o t = ${MINUS}${q}.`,
        `Com que t = e<sup>x</sup> &gt; 0, descartem t = ${MINUS}${q}. Queda e<sup>x</sup> = ${r}, és a dir, x = ln ${r}.`
      ]
    });
  }

  function equationLogarithmic() {
    let d = randInt(3, 12);
    let v = randInt(1, 9);
    const k = randInt(2, 5);
    while (v === d || v === k) {
      v = randInt(1, 9);
    }
    const b = k + d - v;
    const c = d * (k - v);
    const quad = poly2(1, b, c);
    const lin = linear(1, d);
    const correct = `x = ${v}`;

    return makeQuestion({
      unit: 3,
      kind: "Logarítmica",
      prompt: "Resol l'equació logarítmica i indica les solucions vàlides.",
      display: `ln(${quad}) = ln(${lin}) + ln ${k}`,
      hint: "Primer apunta les condicions de domini. Després usa ln A + ln B = ln(AB) i iguala els arguments. Comprova cada candidat!",
      correct,
      wrongs: [
        `x = ${v} i x = ${MINUS}${d}`,
        `x = ${MINUS}${d}`,
        `x = ${v} i x = ${d}`
      ],
      steps: [
        `Condicions: ${lin} &gt; 0 (és a dir, x &gt; ${MINUS}${d}) i ${quad} &gt; 0.`,
        `Ajuntem els logaritmes de la dreta: ln(${lin}) + ln ${k} = ln(${k}(${lin})).`,
        `Com que ln és injectiu, igualem els arguments: ${quad} = ${k}(${lin}).`,
        `Desenvolupem: ${quad} = ${k}x + ${k * d}. Passant-ho tot a un costat obtenim ${poly2(1, b - k, c - k * d)} = 0, que factoritza com ${factorRoot(v)}${factorRoot(-d)} = 0.`,
        `Els candidats són x = ${v} i x = ${MINUS}${d}. Però x = ${MINUS}${d} fa que ${lin} = 0 i ln 0 no existeix. Només és vàlida x = ${v}.`
      ]
    });
  }

  function equationExpQuadratic() {
    const r = randInt(2, 7);
    let q = randInt(2, 7);
    while (q === r) q = randInt(2, 7);
    const s = r + q;
    const p = r * q;
    const correct = `x = ln ${r} i x = ln ${q}`;

    return makeQuestion({
      unit: 3,
      kind: "Exponencial",
      prompt: "Resol l'equació exponencial.",
      display: `e<sup>2x</sup> ${MINUS} ${s}e<sup>x</sup> + ${p} = 0`,
      hint: "Fes el canvi t = e<sup>x</sup>. Obtindràs una equació de segon grau; recorda que t ha de ser positiu.",
      correct,
      wrongs: [
        `x = ln ${r}`,
        `x = ${r} i x = ${q}`,
        `No té solució`
      ],
      steps: [
        `Fem t = e<sup>x</sup>, amb t &gt; 0. L'equació queda t² ${MINUS} ${s}t + ${p} = 0.`,
        `Factoritzem: (t ${MINUS} ${r})(t ${MINUS} ${q}) = 0. Així, t = ${r} o t = ${q}.`,
        `Tots dos valors són positius, així que cap no es descarta.`,
        `Tornem a la variable original: e<sup>x</sup> = ${r} → x = ln ${r}; e<sup>x</sup> = ${q} → x = ln ${q}.`
      ]
    });
  }

  /* =========================================================
     BLOC 4 · BOLZANO
     ========================================================= */

  function bolzanoExercise() {
    const n = randInt(40, 120);
    const m = randInt(3, 9);
    const a = randInt(3, 6);
    const f = `x<sup>${n}</sup> + ${a}x<sup>${m}</sup> ${MINUS} 2x ${MINUS} 1`;
    const f1 = a - 2;
    const correct = `Almenys una arrel a (0, 1): f(0) = ${MINUS}1 &lt; 0 i f(1) = ${f1} &gt; 0.`;

    return makeQuestion({
      unit: 4,
      kind: "Bolzano",
      prompt: "La funció és contínua a [0, 1]. Què podem concloure aplicant el teorema de Bolzano?",
      display: `f(x) = ${f}`,
      hint: "Calcula f(0) i f(1). Bolzano només necessita continuïtat i signes oposats; no necessita que la funció sigui derivable.",
      correct,
      wrongs: [
        "No té cap arrel a (0, 1), perquè f(0) ≠ f(1).",
        "Té exactament una arrel a (0, 1), perquè la funció canvia de signe.",
        "No es pot aplicar Bolzano, perquè f no és derivable a (0, 1)."
      ],
      steps: [
        `f és un polinomi, i tots els polinomis són continus a ℝ. En particular, ho és a [0, 1].`,
        `f(0) = ${MINUS}1 &lt; 0.`,
        `f(1) = 1 + ${a} ${MINUS} 2 ${MINUS} 1 = ${f1} &gt; 0.`,
        `Els signes són oposats, així que Bolzano assegura l'existència d'almenys un c ∈ (0, 1) amb f(c) = 0.`,
        `No podem afirmar que l'arrel sigui única: Bolzano només garanteix existència.`
      ]
    });
  }

  function bolzanoInterval() {
    const t = randInt(0, 3);
    const gap = 3 * t * t + 3 * t + 2;
    const g = randInt(1, gap - 1);
    const c = t * t * t + t + g;
    const f = `x³ + x ${MINUS} ${c}`;
    const correct = `[${t}, ${t + 1}]`;

    return makeQuestion({
      unit: 4,
      kind: "Bolzano",
      prompt: "Per a quin interval el teorema de Bolzano assegura que la funció té una arrel?",
      display: `f(x) = ${f}`,
      hint: "Avalua la funció als extrems de cada interval. Busca un canvi de signe i recorda que f és contínua per ser un polinomi.",
      correct,
      wrongs: [
        `[${t - 1}, ${t}]`,
        `[${t + 1}, ${t + 2}]`,
        `[${t + 2}, ${t + 3}]`
      ],
      steps: [
        `f és contínua a ℝ perquè és un polinomi.`,
        `Avaluem als extrems de l'interval correcte: f(${t}) = ${t * t * t} + ${t} ${MINUS} ${c} = ${MINUS}${g} &lt; 0.`,
        `f(${t + 1}) = ${(t + 1) * (t + 1) * (t + 1)} + ${t + 1} ${MINUS} ${c} = ${gap - g} &gt; 0.`,
        `Com que f(${t}) i f(${t + 1}) tenen signes oposats, Bolzano assegura una arrel a (${t}, ${t + 1}).`,
        `A més, f′(x) = 3x² + 1 &gt; 0, així que f és estrictament creixent i no hi ha canvis de signe addicionals.`
      ]
    });
  }

  function bolzanoHypotheses() {
    return makeQuestion({
      unit: 4,
      kind: "Bolzano",
      prompt: "Quines condicions calen per aplicar el teorema de Bolzano a una funció f a l'interval [a, b]?",
      display: "Teorema de Bolzano",
      hint: "Bolzano necessita continuïtat i un canvi de signe. No necessita derivabilitat.",
      correct: "f contínua a [a, b] i f(a) · f(b) &lt; 0.",
      wrongs: [
        "f derivable a (a, b) i f(a) = f(b).",
        "f contínua a [a, b] i f(a) = f(b).",
        "f creixent a (a, b) i f(a) &gt; 0, f(b) &gt; 0."
      ],
      steps: [
        "Les hipòtesis són: f contínua a l'interval tancat [a, b], i els valors f(a) i f(b) amb signes oposats.",
        "Signes oposats equival a f(a) · f(b) &lt; 0.",
        "La derivabilitat no és necessària. f(a) = f(b) correspon al teorema de Rolle, no al de Bolzano.",
        "La conclusió és que existeix almenys un c ∈ (a, b) amb f(c) = 0."
      ]
    });
  }

  function bolzanoConclusion() {
    return makeQuestion({
      unit: 4,
      kind: "Bolzano",
      prompt: "Si f és contínua a [a, b] i f(a) · f(b) &lt; 0, què garanteix el teorema de Bolzano?",
      display: "f contínua a [a, b] &nbsp; i &nbsp; f(a) · f(b) &lt; 0",
      hint: "Bolzano és un teorema d'existència. No afirma res sobre la unicitat de l'arrel.",
      correct: "Existeix almenys un c ∈ (a, b) amb f(c) = 0.",
      wrongs: [
        "Existeix exactament un c ∈ (a, b) amb f(c) = 0.",
        "f no s'anul·la en cap punt de (a, b).",
        "f és derivable a (a, b)."
      ],
      steps: [
        "El teorema de Bolzano afirma l'existència d'almenys un zero dins de l'interval obert.",
        "No assegura que el zero sigui únic: una funció pot canviar de signe diverses vegades.",
        "Tampoc no conclou que f sigui derivable; la continuïtat és l'única hipòtesi de regularitat."
      ]
    });
  }

  /* =========================================================
     BLOC 5 · GRAU 3
     ========================================================= */

  function cubicLimits() {
    const a = pick([-3, -2, -1, 1, 2, 3]);
    const b = randInt(-5, 5);
    const c = randInt(-6, 6);
    const d = randInt(-6, 6);
    const p = poly3(a, b, c, d);
    const correct = a > 0
      ? "lim<sub>x→−∞</sub> p(x) = −∞ i lim<sub>x→+∞</sub> p(x) = +∞"
      : "lim<sub>x→−∞</sub> p(x) = +∞ i lim<sub>x→+∞</sub> p(x) = −∞";

    return makeQuestion({
      unit: 5,
      kind: "Límits",
      prompt: "Quins són els límits del polinomi a −∞ i a +∞?",
      display: `p(x) = ${p}`,
      hint: "El terme de grau més alt és el que domina quan x és molt gran en valor absolut. Mira el signe de ax³.",
      correct,
      wrongs: [
        "lim<sub>x→−∞</sub> p(x) = −∞ i lim<sub>x→+∞</sub> p(x) = −∞",
        "lim<sub>x→−∞</sub> p(x) = +∞ i lim<sub>x→+∞</sub> p(x) = +∞",
        "lim<sub>x→−∞</sub> p(x) = 0 i lim<sub>x→+∞</sub> p(x) = 0"
      ],
      steps: [
        `El terme dominant és ${a}x³, perquè el grau 3 és més gran que els altres.`,
        `Si a = ${a} ${a > 0 ? "&gt; 0" : "&lt; 0"}: quan x → −∞, ${a}x³ ${a > 0 ? "→ −∞" : "→ +∞"}; quan x → +∞, ${a}x³ ${a > 0 ? "→ +∞" : "→ −∞"}.`,
        `Així, ${correct}.`,
        "Com que els límits tenen signes oposats i p és continu, Bolzano permet concloure que p té almenys una arrel real."
      ]
    });
  }

  function cubicProofConcept() {
    return makeQuestion({
      unit: 5,
      kind: "Demostració",
      prompt: "Per què tot polinomi de grau 3 té almenys una arrel real?",
      display: "p(x) = ax³ + bx² + cx + d, &nbsp; a ≠ 0",
      hint: "Combina dues idees: el comportament a l'infinit i el teorema de Bolzano.",
      correct: "Perquè els límits a ±∞ tenen signes oposats i, com que és continu, Bolzano assegura una arrel.",
      wrongs: [
        "Perquè tota funció contínua s'anul·la en algun punt.",
        "Perquè la derivada és de grau 2 i sempre té dues arrels reals.",
        "Perquè tots els polinomis de grau senar són estrictament creixents."
      ],
      steps: [
        "El terme dominant és ax³. Si a > 0, p(x) → −∞ quan x → −∞ i p(x) → +∞ quan x → +∞; si a < 0, al revés.",
        "Per tant, existeixen u < v amb p(u) < 0 i p(v) > 0 (o amb els signes intercanviats).",
        "p és un polinomi, així que és continu a [u, v].",
        "Bolzano garanteix un c ∈ (u, v) amb p(c) = 0. No cal que el polinomi sigui creixent ni que la derivada tingui arrels reals."
      ]
    });
  }

  function cubicDegreeFour() {
    return makeQuestion({
      unit: 5,
      kind: "Grau 4",
      prompt: "Per què l'argument dels límits no demostra que tot polinomi de grau 4 tingui una arrel real?",
      display: "p(x) = ax⁴ + bx³ + cx² + dx + e, &nbsp; a ≠ 0",
      hint: "Pensa en el signe del terme ax⁴ quan x → −∞ i quan x → +∞. Després busca un exemple sense arrels.",
      correct: "Perquè els límits a −∞ i +∞ tenen el mateix signe; per exemple, x⁴ + 1 no s'anul·la mai.",
      wrongs: [
        "Perquè els polinomis de grau 4 no són continus.",
        "Perquè Bolzano només funciona amb funcions derivables.",
        "Perquè tot polinomi de grau 4 té exactament quatre arrels reals."
      ],
      steps: [
        "En un polinomi de grau 4 amb a > 0, ax⁴ → +∞ tant a −∞ com a +∞. Amb a < 0, tendeix a −∞ pels dos costats.",
        "Així, els límits no tenen signes oposats i no podem aplicar directament Bolzano com en el grau 3.",
        "De fet, hi ha polinomis de grau 4 sense arrels reals: x⁴ + 1 > 0 per a tot x.",
        "El grau senar és el que força el canvi de signe a l'infinit."
      ]
    });
  }

  function cubicUniqueness() {
    return makeQuestion({
      unit: 5,
      kind: "Existència",
      prompt: "En la demostració que tot polinomi de grau 3 té una arrel real, què és el que Bolzano NO ens diu?",
      display: "p(x) = ax³ + bx² + cx + d, &nbsp; a ≠ 0",
      hint: "Distingeix entre «almenys una» i «exactament una».",
      correct: "No assegura que l'arrel sigui única; només que n'hi ha com a mínim una.",
      wrongs: [
        "No assegura que la funció sigui contínua.",
        "No assegura que existeixin valors on el polinomi canviï de signe.",
        "No assegura que els límits a ±∞ existeixin."
      ],
      steps: [
        "Bolzano és un teorema d'existència: garanteix almenys un zero dins de l'interval.",
        "Un polinomi cúbic pot tenir una, dues o tres arrels reals comptant multiplicitats; el teorema no decideix quantes.",
        "Per demostrar unicitat caldria informació addicional, com ara que la funció sigui estrictament creixent o decreixent."
      ]
    });
  }

  /* =========================================================
     Exportació
     ========================================================= */

  const generators = {
    1: [
      domainRadicalFraction,
      domainRadicalDenominator,
      domainLogarithm,
      domainLogCubic,
      domainMixed
    ],
    2: [
      compositionSin,
      compositionLog,
      compositionExp,
      compositionSqrt
    ],
    3: [
      equationExpNegative,
      equationLogarithmic,
      equationExpQuadratic
    ],
    4: [
      bolzanoExercise,
      bolzanoInterval,
      bolzanoHypotheses,
      bolzanoConclusion
    ],
    5: [
      cubicLimits,
      cubicProofConcept,
      cubicDegreeFour,
      cubicUniqueness
    ]
  };

  function generate(unit) {
    const list = generators[unit];
    if (!list) throw new Error(`Bloc desconegut: ${unit}`);
    return pick(list)();
  }

  function generateChallenge(perUnit) {
    const count = perUnit || 2;
    const questions = [];

    for (let unit = 1; unit <= 5; unit++) {
      const selected = shuffle(generators[unit]).slice(0, count);
      selected.forEach((generator) => questions.push(generator()));
    }

    return shuffle(questions);
  }

  window.Seminari2 = {
    generate,
    generateChallenge,
    units: 5
  };
})();
