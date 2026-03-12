/**
 * React Hooks Guide — دليل خطافات React
 * Comprehensive interactive guide covering essential and advanced React Hooks
 * with live code examples, bilingual content, and FLL design system.
 */
import { useState } from "react";

/* ── Hook data ── */
interface HookInfo {
  name: string;
  category: "basic" | "advanced" | "custom";
  titleAr: string;
  descAr: string;
  descEn: string;
  when: string[];
  rules?: string[];
  code: string;
}

const HOOKS: HookInfo[] = [
  {
    name: "useState",
    category: "basic",
    titleAr: "حالة الاستخدام",
    descAr: "يضيف حالة إلى المكونات الوظيفية. يُرجع قيمة الحالة ودالة لتحديثها.",
    descEn: "Adds state to functional components. Returns the state value and an updater function.",
    when: [
      "إدارة بيانات النموذج (form inputs)",
      "تبديل عرض/إخفاء العناصر",
      "عدادات وقوائم ديناميكية",
    ],
    code: `const [count, setCount] = useState(0);

return (
  <button onClick={() => setCount(count + 1)}>
    Count: {count}
  </button>
);`,
  },
  {
    name: "useEffect",
    category: "basic",
    titleAr: "تأثير الاستخدام",
    descAr: "يتعامل مع الآثار الجانبية مثل جلب البيانات والاشتراكات وتحديثات DOM.",
    descEn: "Handles side effects like data fetching, subscriptions, and DOM updates.",
    when: [
      "جلب البيانات من API",
      "إعداد مؤقتات أو اشتراكات",
      "تحديث عنوان الصفحة",
    ],
    rules: [
      "أضف جميع المتغيرات المستخدمة داخل التأثير إلى مصفوفة التبعيات",
      "أعد دالة التنظيف (cleanup) عند الاشتراك في أحداث خارجية",
      "مصفوفة فارغة [] تعني التشغيل مرة واحدة فقط عند التركيب",
    ],
    code: `useEffect(() => {
  document.title = \`You clicked \${count} times\`;

  // Cleanup function (optional)
  return () => {
    document.title = 'React App';
  };
}, [count]); // Dependency array`,
  },
  {
    name: "useContext",
    category: "basic",
    titleAr: "سياق الاستخدام",
    descAr: "يوفر وصولاً مباشراً لقيم السياق (Context) بدون تمرير الخصائص يدوياً عبر الشجرة.",
    descEn: "Provides direct access to Context values without prop drilling.",
    when: [
      "مشاركة الثيم أو اللغة عبر المكونات",
      "إدارة حالة المصادقة",
      "تجنب تمرير الخصائص عبر مستويات متعددة",
    ],
    code: `const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Styled</button>;
}`,
  },
  {
    name: "useReducer",
    category: "advanced",
    titleAr: "مُخفِّض الاستخدام",
    descAr: "بديل لـ useState للحالات المعقدة. يستخدم نمط الإجراء/المُخفِّض مثل Redux.",
    descEn: "Alternative to useState for complex state logic. Uses action/reducer pattern like Redux.",
    when: [
      "حالة معقدة بخصائص متعددة",
      "انتقالات حالة تعتمد على الحالة السابقة",
      "منطق تحديث مشترك بين عدة مكونات",
    ],
    code: `function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    default:
      throw new Error();
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0 });

return (
  <>
    Count: {state.count}
    <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    <button onClick={() => dispatch({ type: 'increment' })}>+</button>
  </>
);`,
  },
  {
    name: "useCallback",
    category: "advanced",
    titleAr: "رد الاستدعاء المحفوظ",
    descAr: "يحفظ دالة رد الاستدعاء لمنع إعادة إنشائها في كل عملية إعادة رسم.",
    descEn: "Memoizes a callback function to prevent re-creation on every render.",
    when: [
      "تمرير callbacks إلى مكونات فرعية محسّنة بـ React.memo",
      "استخدامها كتبعية في useEffect",
      "معالجات أحداث مكلفة الإنشاء",
    ],
    code: `const handleClick = useCallback(() => {
  console.log('Clicked item:', id);
  doExpensiveOperation(id);
}, [id]);

return <MemoizedChild onClick={handleClick} />;`,
  },
  {
    name: "useMemo",
    category: "advanced",
    titleAr: "القيمة المحسوبة المحفوظة",
    descAr: "يحفظ نتيجة عملية حسابية مكلفة ويُعيد حسابها فقط عند تغيّر التبعيات.",
    descEn: "Memoizes an expensive computation result, recomputing only when dependencies change.",
    when: [
      "فلترة أو ترتيب قوائم كبيرة",
      "حسابات رياضية معقدة",
      "تحويل بيانات مكلف",
    ],
    code: `const expensiveResult = useMemo(() => {
  return items
    .filter(item => item.active)
    .sort((a, b) => a.priority - b.priority)
    .map(item => transformItem(item));
}, [items]);

return <List data={expensiveResult} />;`,
  },
  {
    name: "useRef",
    category: "advanced",
    titleAr: "المرجع المتغيّر",
    descAr: "ينشئ مرجعاً قابلاً للتغيير لا يُسبب إعادة رسم. مفيد للوصول لعناصر DOM.",
    descEn: "Creates a mutable ref that doesn't trigger re-renders. Useful for DOM access.",
    when: [
      "الوصول المباشر لعنصر DOM (focus, scroll)",
      "تخزين قيمة سابقة",
      "الاحتفاظ بمرجع لمؤقت أو اشتراك",
    ],
    code: `const inputRef = useRef(null);

function focusInput() {
  inputRef.current.focus();
}

return (
  <>
    <input ref={inputRef} type="text" />
    <button onClick={focusInput}>Focus</button>
  </>
);`,
  },
  {
    name: "Custom Hook",
    category: "custom",
    titleAr: "خطاف مخصص",
    descAr: "استخرج منطقاً ذا حالة قابلاً لإعادة الاستخدام في دالة تبدأ بـ use.",
    descEn: "Extract reusable stateful logic into a function prefixed with 'use'.",
    when: [
      "منطق مشترك بين عدة مكونات",
      "تبسيط مكونات معقدة",
      "إنشاء واجهات API قابلة للاختبار",
    ],
    code: `function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// Usage
const { width, height } = useWindowSize();`,
  },
];

const HOOK_RULES = [
  {
    rule: "استدعاء الخطافات في المستوى الأعلى فقط",
    ruleEn: "Only call Hooks at the top level",
    detail: "لا تستدعِ الخطافات داخل حلقات أو شروط أو دوال متداخلة.",
    icon: "⬆️",
  },
  {
    rule: "استدعاء الخطافات من دوال React فقط",
    ruleEn: "Only call Hooks from React functions",
    detail: "استدعِها من مكونات الدوال أو من خطافات مخصصة فقط، وليس من دوال JavaScript العادية.",
    icon: "⚛️",
  },
  {
    rule: "ابدأ اسم الخطاف المخصص بـ use",
    ruleEn: "Prefix custom Hooks with 'use'",
    detail: "هذا يسمح لـ React بالتحقق تلقائياً من اتباع قواعد الخطافات.",
    icon: "🏷️",
  },
];

const CATEGORIES = [
  { key: "all" as const, label: "الكل", labelEn: "All" },
  { key: "basic" as const, label: "أساسية", labelEn: "Basic" },
  { key: "advanced" as const, label: "متقدمة", labelEn: "Advanced" },
  { key: "custom" as const, label: "مخصصة", labelEn: "Custom" },
];

export default function ReactHooksGuide() {
  const [activeCategory, setActiveCategory] = useState<"all" | "basic" | "advanced" | "custom">("all");
  const [expandedHook, setExpandedHook] = useState<string | null>("useState");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredHooks =
    activeCategory === "all"
      ? HOOKS
      : HOOKS.filter((h) => h.category === activeCategory);

  function copyCode(code: string, name: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(name);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0B1220 0%, #101D30 50%, #0B1220 100%)",
        fontFamily: "'IBM Plex Sans Arabic', 'Plus Jakarta Sans', sans-serif",
        color: "#F3F6FB",
      }}
    >
      {/* ── HERO ── */}
      <section
        style={{
          padding: "6rem 2rem 4rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid effect */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: 20,
              padding: "6px 16px",
              fontSize: 13,
              color: "#3B82F6",
              marginBottom: 24,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span>⚛️</span> React Hooks Guide
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: 16,
              background: "linear-gradient(135deg, #F3F6FB 0%, #3B82F6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            دليل خطافات React
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "#B6C2D2",
              maxWidth: 600,
              margin: "0 auto 12px",
              lineHeight: 1.8,
            }}
          >
            تعرّف على الخطافات الأساسية والمتقدمة في React مع أمثلة عملية وشرح
            تفاعلي. من <code style={{ color: "#3B82F6", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.9em" }}>useState</code> إلى الخطافات المخصصة.
          </p>
          <p
            style={{
              fontSize: 14,
              color: "#7E8CA2",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {HOOKS.length} hooks covered &bull; Interactive examples &bull; Bilingual
          </p>
        </div>
      </section>

      {/* ── RULES OF HOOKS ── */}
      <section style={{ maxWidth: 900, margin: "0 auto 3rem", padding: "0 2rem" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(220,38,38,0.12)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            📏
          </span>
          قواعد الخطافات
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {HOOK_RULES.map((r) => (
            <div
              key={r.rule}
              style={{
                background: "rgba(17,26,43,0.8)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                padding: "20px",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(59,130,246,0.35)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")
              }
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>{r.icon}</div>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  marginBottom: 4,
                  color: "#F3F6FB",
                }}
              >
                {r.rule}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#3B82F6",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 8,
                }}
              >
                {r.ruleEn}
              </p>
              <p style={{ fontSize: 13, color: "#B6C2D2", lineHeight: 1.7 }}>
                {r.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORY FILTER ── */}
      <section style={{ maxWidth: 900, margin: "0 auto 2rem", padding: "0 2rem" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 20,
                  border: isActive
                    ? "1px solid rgba(59,130,246,0.5)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: isActive ? "rgba(59,130,246,0.15)" : "rgba(17,26,43,0.6)",
                  color: isActive ? "#3B82F6" : "#B6C2D2",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                }}
              >
                {cat.label}
                <span
                  style={{
                    marginRight: 6,
                    fontSize: 12,
                    color: "#7E8CA2",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {cat.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── HOOKS LIST ── */}
      <section style={{ maxWidth: 900, margin: "0 auto 4rem", padding: "0 2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredHooks.map((hook) => {
            const isExpanded = expandedHook === hook.name;
            const catColor =
              hook.category === "basic"
                ? "#16A34A"
                : hook.category === "advanced"
                  ? "#D97706"
                  : "#0EA5E9";

            return (
              <div
                key={hook.name}
                style={{
                  background: "rgba(17,26,43,0.8)",
                  border: isExpanded
                    ? "1px solid rgba(59,130,246,0.35)"
                    : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedHook(isExpanded ? null : hook.name)}
                  style={{
                    width: "100%",
                    padding: "18px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#F3F6FB",
                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    textAlign: "right",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <code
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#3B82F6",
                      }}
                    >
                      {hook.name}
                    </code>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 10,
                        background: `${catColor}20`,
                        color: catColor,
                        fontWeight: 500,
                      }}
                    >
                      {hook.category === "basic"
                        ? "أساسي"
                        : hook.category === "advanced"
                          ? "متقدم"
                          : "مخصص"}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 18,
                      color: "#7E8CA2",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      display: "inline-block",
                    }}
                  >
                    ▼
                  </span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ padding: "0 22px 22px" }}>
                    {/* Description */}
                    <p
                      style={{
                        fontSize: 15,
                        color: "#B6C2D2",
                        lineHeight: 1.8,
                        marginBottom: 6,
                      }}
                    >
                      {hook.descAr}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#7E8CA2",
                        fontStyle: "italic",
                        marginBottom: 18,
                      }}
                    >
                      {hook.descEn}
                    </p>

                    {/* When to use */}
                    <div style={{ marginBottom: 18 }}>
                      <h4
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#16A34A",
                          marginBottom: 8,
                        }}
                      >
                        ✅ متى تستخدمه؟
                      </h4>
                      <ul style={{ margin: 0, paddingRight: 18, listStyle: "none" }}>
                        {hook.when.map((w) => (
                          <li
                            key={w}
                            style={{
                              fontSize: 13,
                              color: "#B6C2D2",
                              lineHeight: 2,
                              position: "relative",
                              paddingRight: 16,
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                right: 0,
                                color: "#16A34A",
                              }}
                            >
                              ›
                            </span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Rules (if any) */}
                    {hook.rules && (
                      <div style={{ marginBottom: 18 }}>
                        <h4
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#D97706",
                            marginBottom: 8,
                          }}
                        >
                          ⚠️ نصائح مهمة
                        </h4>
                        <ul style={{ margin: 0, paddingRight: 18, listStyle: "none" }}>
                          {hook.rules.map((r) => (
                            <li
                              key={r}
                              style={{
                                fontSize: 13,
                                color: "#B6C2D2",
                                lineHeight: 2,
                                position: "relative",
                                paddingRight: 16,
                              }}
                            >
                              <span
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  color: "#D97706",
                                }}
                              >
                                ›
                              </span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Code block */}
                    <div
                      style={{
                        background: "#0B1220",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.07)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 14px",
                          borderBottom: "1px solid rgba(255,255,255,0.07)",
                          background: "rgba(17,26,43,0.5)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "#7E8CA2",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          JSX
                        </span>
                        <button
                          onClick={() => copyCode(hook.code, hook.name)}
                          style={{
                            background: "none",
                            border: "none",
                            color:
                              copiedCode === hook.name ? "#16A34A" : "#7E8CA2",
                            fontSize: 12,
                            cursor: "pointer",
                            fontFamily: "'JetBrains Mono', monospace",
                            transition: "color 0.2s",
                          }}
                        >
                          {copiedCode === hook.name ? "✓ copied" : "copy"}
                        </button>
                      </div>
                      <pre
                        dir="ltr"
                        style={{
                          margin: 0,
                          padding: "16px",
                          fontSize: 13,
                          lineHeight: 1.7,
                          overflowX: "auto",
                          color: "#B6C2D2",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        <code>{hook.code}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ maxWidth: 900, margin: "0 auto 4rem", padding: "0 2rem" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(59,130,246,0.12)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            ⚖️
          </span>
          مقارنة سريعة
        </h2>
        <div
          style={{
            background: "rgba(17,26,43,0.8)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "auto",
          }}
        >
          <table
            dir="ltr"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "12px 16px", color: "#7E8CA2", fontWeight: 500 }}>Hook</th>
                <th style={{ padding: "12px 16px", color: "#7E8CA2", fontWeight: 500 }}>Purpose</th>
                <th style={{ padding: "12px 16px", color: "#7E8CA2", fontWeight: 500 }}>Re-renders?</th>
              </tr>
            </thead>
            <tbody>
              {[
                { hook: "useState", purpose: "Local state", rerenders: "Yes" },
                { hook: "useEffect", purpose: "Side effects", rerenders: "No (runs after)" },
                { hook: "useContext", purpose: "Shared state", rerenders: "Yes (on change)" },
                { hook: "useReducer", purpose: "Complex state", rerenders: "Yes" },
                { hook: "useCallback", purpose: "Memoize functions", rerenders: "No" },
                { hook: "useMemo", purpose: "Memoize values", rerenders: "No" },
                { hook: "useRef", purpose: "Mutable ref / DOM", rerenders: "No" },
              ].map((row, i) => (
                <tr
                  key={row.hook}
                  style={{
                    borderBottom:
                      i < 6 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <td
                    style={{
                      padding: "10px 16px",
                      color: "#3B82F6",
                      fontWeight: 500,
                    }}
                  >
                    {row.hook}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#B6C2D2" }}>
                    {row.purpose}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#B6C2D2" }}>
                    {row.rerenders}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section
        style={{
          textAlign: "center",
          padding: "3rem 2rem 5rem",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: 16,
            padding: "2rem",
          }}
        >
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}>
            هل أنت مستعد للبناء؟
          </h3>
          <p style={{ fontSize: 14, color: "#B6C2D2", lineHeight: 1.8, marginBottom: 16 }}>
            ابدأ بـ <code style={{ color: "#3B82F6", fontFamily: "'JetBrains Mono', monospace" }}>useState</code> و{" "}
            <code style={{ color: "#3B82F6", fontFamily: "'JetBrains Mono', monospace" }}>useEffect</code>، ثم أضف الخطافات المتقدمة حسب الحاجة.
            لا تُفرط في التحسين المبكر!
          </p>
          <p
            style={{
              fontSize: 12,
              color: "#7E8CA2",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            React 18+ &bull; Functional Components &bull; 2024+
          </p>
        </div>
      </section>
    </div>
  );
}
