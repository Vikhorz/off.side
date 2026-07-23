"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "ar" | "ckb";

const RTL_LANGS: Lang[] = ["ar", "ckb"];

// Only static UI chrome is translated — team names, usernames, and news
// headlines come from external/user data and stay as-is.
const dictionaries: Record<Lang, Record<string, string>> = {
  en: {
    "nav.predict": "Predict", "nav.leaderboard": "Leaderboard", "nav.stats": "My stats", "nav.news": "News",
    "nav.board": "Board", "nav.signout": "Sign out",
    "landing.tagline": "Football · Prediction League",
    "landing.feature1": "Score predictions", "landing.feature2": "One boost per round", "landing.feature3": "Tamper-proof scoring",
    "landing.join": "Join the league", "landing.haveAccount": "Already have an account? Sign in",
    "landing.next": "Next",
    "auth.username": "Username", "auth.password": "Password", "auth.email": "Email (optional)",
    "auth.signin": "Sign in", "auth.signingin": "Signing in…",
    "auth.createAccount": "Create account", "auth.creating": "Creating account…",
    "auth.noAccount": "No account yet?", "auth.register": "Register",
    "auth.haveAccount": "Already have an account?",
    "auth.emailWarning": "No recovery possible without an email — you'll be locked out if you forget your password.",
    "auth.emailPlaceholder": "For password recovery",
    "auth.invalidLogin": "Invalid username or password",
    "auth.createSubtitle": "Create your account",
    "dashboard.title": "Upcoming matches", "dashboard.openCount": "predictions open",
    "dashboard.noMatches": "No matches scheduled yet.", "dashboard.loading": "Loading matches…",
    "dashboard.showMore": "Tap to show more",
    "match.live": "Live", "match.final": "Final", "match.saved": "Saved",
    "match.opens": "Opens for predictions", "match.finalResult": "Final result",
    "match.useBoost": "Use boost (2× points)", "match.boostActive": "Boost active (2× points)",
    "match.boostUsedElsewhere": "Boost used on another match",
    "match.save": "Save prediction", "match.saving": "Saving…", "match.edit": "Edit",
    "match.enterBoth": "Enter both scores", "match.saved.toast": "Prediction saved",
    "match.baghdad": "Baghdad",
    "leaderboard.title": "Leaderboard", "leaderboard.noPlayers": "No players yet.",
    "leaderboard.scored": "scored",
    "stats.title": "My stats", "stats.totalPoints": "Total points", "stats.accuracy": "Prediction accuracy",
    "stats.vsAverage": "You vs group average", "stats.you": "You", "stats.groupAvg": "Group avg",
    "stats.history": "Prediction history", "stats.noPredictions": "No predictions yet.",
    "stats.predicted": "Predicted", "stats.result": "Result", "stats.upcoming": "Upcoming", "stats.boosted": "Boosted",
    "badges.perfect": "Perfect Predictor", "badges.perfectDesc": "Nail an exact scoreline",
    "badges.boost": "Boost Specialist", "badges.boostDesc": "Land a correct boosted call",
    "badges.streak": "On a Streak", "badges.streakDesc": "Get 2+ correct predictions in a row",
    "badges.fullhouse": "Full House", "badges.fullhouseDesc": "Every single prediction scored so far is correct",
    "news.title": "Football news", "news.subtitle": "Latest from BBC Sport", "news.empty": "No news available right now.",
    "activity.title": "Group activity", "activity.empty": "No predictions yet — be the first.",
    "activity.predicted": "predicted", "activity.boosted": "boosted",
  },
  ar: {
    "nav.predict": "التوقعات", "nav.leaderboard": "الترتيب", "nav.stats": "إحصائياتي", "nav.news": "الأخبار",
    "nav.board": "الترتيب", "nav.signout": "تسجيل الخروج",
    "landing.tagline": "كرة القدم · دوري التوقعات",
    "landing.feature1": "توقع النتائج", "landing.feature2": "دفعة واحدة لكل جولة", "landing.feature3": "نتائج غير قابلة للتلاعب",
    "landing.join": "انضم إلى الدوري", "landing.haveAccount": "لديك حساب بالفعل؟ سجّل الدخول",
    "landing.next": "القادمة",
    "auth.username": "اسم المستخدم", "auth.password": "كلمة المرور", "auth.email": "البريد الإلكتروني (اختياري)",
    "auth.signin": "تسجيل الدخول", "auth.signingin": "جارٍ تسجيل الدخول…",
    "auth.createAccount": "إنشاء حساب", "auth.creating": "جارٍ إنشاء الحساب…",
    "auth.noAccount": "ليس لديك حساب؟", "auth.register": "سجّل الآن",
    "auth.haveAccount": "لديك حساب بالفعل؟",
    "auth.emailWarning": "لا يمكن استرجاع الحساب بدون بريد إلكتروني — ستفقد الوصول إذا نسيت كلمة المرور.",
    "auth.emailPlaceholder": "لاسترجاع كلمة المرور",
    "auth.invalidLogin": "اسم المستخدم أو كلمة المرور غير صحيحة",
    "auth.createSubtitle": "أنشئ حسابك",
    "dashboard.title": "المباريات القادمة", "dashboard.openCount": "توقعات متاحة",
    "dashboard.noMatches": "لا توجد مباريات مجدولة بعد.", "dashboard.loading": "جارٍ تحميل المباريات…",
    "dashboard.showMore": "اضغط لعرض المزيد",
    "match.live": "مباشر", "match.final": "انتهت", "match.saved": "تم الحفظ",
    "match.opens": "متاح للتوقع", "match.finalResult": "النتيجة النهائية",
    "match.useBoost": "استخدم الدفعة (نقاط ×2)", "match.boostActive": "الدفعة مفعّلة (نقاط ×2)",
    "match.boostUsedElsewhere": "الدفعة مستخدمة في مباراة أخرى",
    "match.save": "احفظ التوقع", "match.saving": "جارٍ الحفظ…", "match.edit": "تعديل",
    "match.enterBoth": "أدخل النتيجتين", "match.saved.toast": "تم حفظ التوقع",
    "match.baghdad": "بغداد",
    "leaderboard.title": "الترتيب", "leaderboard.noPlayers": "لا يوجد لاعبون بعد.",
    "leaderboard.scored": "محتسبة",
    "stats.title": "إحصائياتي", "stats.totalPoints": "مجموع النقاط", "stats.accuracy": "دقة التوقعات",
    "stats.vsAverage": "أنت مقابل متوسط المجموعة", "stats.you": "أنت", "stats.groupAvg": "متوسط المجموعة",
    "stats.history": "سجل التوقعات", "stats.noPredictions": "لا توجد توقعات بعد.",
    "stats.predicted": "التوقع", "stats.result": "النتيجة", "stats.upcoming": "قادمة", "stats.boosted": "مُعزّزة",
    "badges.perfect": "توقع مثالي", "badges.perfectDesc": "أصب النتيجة بالضبط",
    "badges.boost": "خبير الدفعات", "badges.boostDesc": "أصب توقعًا مُعزّزًا",
    "badges.streak": "سلسلة انتصارات", "badges.streakDesc": "أصب توقعين متتاليين أو أكثر",
    "badges.fullhouse": "سجل كامل", "badges.fullhouseDesc": "جميع توقعاتك المحتسبة حتى الآن صحيحة",
    "news.title": "أخبار كرة القدم", "news.subtitle": "آخر أخبار BBC Sport", "news.empty": "لا توجد أخبار متاحة حاليًا.",
    "activity.title": "نشاط المجموعة", "activity.empty": "لا توجد توقعات بعد — كن أول من يتوقع.",
    "activity.predicted": "توقع", "activity.boosted": "مُعزّز",
  },
  ckb: {
    "nav.predict": "پێشبینی", "nav.leaderboard": "پلەبەندی", "nav.stats": "ئامارەکانم", "nav.news": "هەواڵ",
    "nav.board": "پلەبەندی", "nav.signout": "چوونەدەرەوە",
    "landing.tagline": "تۆپی پێ · یاری پێشبینیکردن",
    "landing.feature1": "پێشبینی ئەنجام", "landing.feature2": "یەک بووست بۆ هەر خولێک", "landing.feature3": "ئەنجامی سەلامەت",
    "landing.join": "بەشداربە لە یاریدا", "landing.haveAccount": "هەژمارت هەیە؟ بچۆ ژوورەوە",
    "landing.next": "داهاتوو",
    "auth.username": "ناوی بەکارهێنەر", "auth.password": "وشەی نهێنی", "auth.email": "ئیمەیل (ئارەزوومەندانە)",
    "auth.signin": "چوونەژوورەوە", "auth.signingin": "چوونەژوورەوە...",
    "auth.createAccount": "دروستکردنی هەژمار", "auth.creating": "دروستکردن...",
    "auth.noAccount": "هەژمارت نییە؟", "auth.register": "خۆتۆمارکردن",
    "auth.haveAccount": "هەژمارت هەیە؟",
    "auth.emailWarning": "بێ ئیمەیل ناتوانرێت هەژمار بگەڕێندرێتەوە — ئەگەر وشەی نهێنیت لەبیرچوو لە هەژمارەکەت دەربدرێیت.",
    "auth.emailPlaceholder": "بۆ گەڕاندنەوەی وشەی نهێنی",
    "auth.invalidLogin": "ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە",
    "auth.createSubtitle": "هەژمارەکەت دروست بکە",
    "dashboard.title": "یارییە داهاتووەکان", "dashboard.openCount": "پێشبینی کراوە",
    "dashboard.noMatches": "هێشتا هیچ یارییەک دانەنراوە.", "dashboard.loading": "بارکردنی یارییەکان...",
    "dashboard.showMore": "کرتە بکە بۆ بینینی زیاتر",
    "match.live": "ڕاستەوخۆ", "match.final": "کۆتایی", "match.saved": "پاشەکەوتکرا",
    "match.opens": "بۆ پێشبینی کراوەیە", "match.finalResult": "ئەنجامی کۆتایی",
    "match.useBoost": "بووست بەکاربێنە (خاڵ ×٢)", "match.boostActive": "بووست چالاکە (خاڵ ×٢)",
    "match.boostUsedElsewhere": "بووست لە یارییەکی تر بەکارهاتووە",
    "match.save": "پاشەکەوتی پێشبینی", "match.saving": "پاشەکەوتکردن...", "match.edit": "دەستکاری",
    "match.enterBoth": "هەردوو ئەنجام بنووسە", "match.saved.toast": "پێشبینی پاشەکەوتکرا",
    "match.baghdad": "بەغدا",
    "leaderboard.title": "پلەبەندی", "leaderboard.noPlayers": "هێشتا یاریزانێک نییە.",
    "leaderboard.scored": "خاڵدراوە",
    "stats.title": "ئامارەکانم", "stats.totalPoints": "کۆی خاڵەکان", "stats.accuracy": "ڕێژەی ڕاستی",
    "stats.vsAverage": "تۆ بەرامبەر تێکڕای گروپ", "stats.you": "تۆ", "stats.groupAvg": "تێکڕای گروپ",
    "stats.history": "مێژووی پێشبینییەکان", "stats.noPredictions": "هێشتا پێشبینیت نەکردووە.",
    "stats.predicted": "پێشبینیکراو", "stats.result": "ئەنجام", "stats.upcoming": "داهاتوو", "stats.boosted": "بووستکراو",
    "badges.perfect": "پێشبینکەری تەواو", "badges.perfectDesc": "ئەنجامێک بە تەواوی ڕاست بکەرەوە",
    "badges.boost": "شارەزای بووست", "badges.boostDesc": "پێشبینییەکی بووستکراو ڕاست بکەرەوە",
    "badges.streak": "زنجیرەی سەرکەوتن", "badges.streakDesc": "دوو پێشبینی یان زیاترت بەدوای یەکدا ڕاست بووە",
    "badges.fullhouse": "تەواو تەواو", "badges.fullhouseDesc": "هەموو پێشبینییە خاڵدراوەکانت تا ئێستا ڕاستن",
    "news.title": "هەواڵی تۆپی پێ", "news.subtitle": "دوایین هەواڵی BBC Sport", "news.empty": "ئێستا هیچ هەواڵێک بەردەست نییە.",
    "activity.title": "چالاکی گروپ", "activity.empty": "هێشتا پێشبینی نەکراوە — یەکەم کەس بە.",
    "activity.predicted": "پێشبینی کرد", "activity.boosted": "بووستکرا",
  },
};

type LangCtx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string; dir: "ltr" | "rtl" };
const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("offside-lang") as Lang | null;
    if (stored && dictionaries[stored]) applyLang(stored, false);
  }, []);

  function applyLang(l: Lang, persist = true) {
    setLangState(l);
    const dir = RTL_LANGS.includes(l) ? "rtl" : "ltr";
    document.documentElement.lang = l;
    document.documentElement.dir = dir;
    if (persist) localStorage.setItem("offside-lang", l);
  }

  const dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
  const t = (key: string) => dictionaries[lang][key] ?? dictionaries.en[key] ?? key;

  return <Ctx.Provider value={{ lang, setLang: applyLang, t, dir }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
