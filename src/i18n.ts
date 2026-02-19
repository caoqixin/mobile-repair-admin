import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import detector, { DetectorOptions } from "i18next-browser-languagedetector";

// 语言持久化配置
const languageDetectorOptions: DetectorOptions = {
  // 检测顺序: localStorage > cookie > navigator
  order: ["localStorage", "cookie", "navigator"],

  // localStorage 的键名
  lookupLocalStorage: "i18nextLng",

  // cookie 的键名
  lookupCookie: "i18next",

  // 缓存用户选择的语言
  caches: ["localStorage", "cookie"],

  // cookie 过期时间 (365天)
  cookieMinutes: 525600,

  // cookie 配置
  cookieOptions: { path: "/", sameSite: "strict" },
};

const languagedetector = new detector(null, languageDetectorOptions);

i18n
  .use(Backend)
  .use(languagedetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ["zh", "it"],
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json", // locale files path
    },
    ns: ["common"],
    defaultNS: "common",
    fallbackLng: ["zh", "it"],
  });

export default i18n;
