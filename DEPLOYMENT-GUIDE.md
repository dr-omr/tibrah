# 🚀 دليل رفع الموقع (Deployment Guide)

## ✅ المشكلة التي تم حلها

تم **إزالة جميع API Keys المكشوفة** من ملف `index.html` لأن معظم منصات الاستضافة ترفض رفع ملفات تحتوي على API Keys لأسباب أمنية.

### API Keys التي تم إزالتها:
- ✅ Google Gemini API Key
- ✅ Firebase API Key  
- ✅ OpenAI API Key

---

## 📋 خيارات رفع الموقع

### الخيار 1: رفع بدون ميزات AI (موصى به للبداية)

**المميزات:**
- ✅ رفع فوري بدون مشاكل
- ✅ جميع الميزات تعمل ما عدا AI
- ✅ آمن تماماً

**الخطوات:**
1. ارفع ملف `index.html` مباشرة إلى:
   - **Netlify Drop**: https://app.netlify.com/drop
   - **Vercel**: https://vercel.com/new
   - **GitHub Pages**: ارفع إلى repository
   - **استضافة عادية**: ارفع عبر FTP/cPanel

2. الموقع سيعمل بكامل ميزاته ما عدا:
   - ❌ AI Chat Bot
   - ❌ أداة التحليل الصحي بـ AI
   - ❌ توليد الخطط الغذائية بـ AI

3. جميع الميزات الأخرى تعمل:
   - ✅ الترددات الشفائية
   - ✅ مكتبة الموسيقى
   - ✅ عجلة العافية
   - ✅ خريطة الجسد
   - ✅ المدونة والدورات
   - ✅ جميع الصفحات والنافذة

---

### الخيار 2: رفع مع ميزات AI (متقدم)

#### الطريقة أ: استخدام Environment Variables

**للـ Netlify:**
1. ارفع الموقع أولاً
2. اذهب إلى: Site settings → Build & deploy → Environment variables
3. أضف المتغيرات:
   ```
   GEMINI_API_KEY = "مفتاحك_هنا"
   FIREBASE_API_KEY = "مفتاحك_هنا"
   OPENAI_API_KEY = "مفتاحك_هنا"
   ```
4. أضف هذا الكود في `<head>` من `index.html`:
   ```html
   <script>
       window.GEMINI_API_KEY = "{{ GEMINI_API_KEY }}";
       window.FIREBASE_API_KEY = "{{ FIREBASE_API_KEY }}";
       window.OPENAI_API_KEY = "{{ OPENAI_API_KEY }}";
   </script>
   ```

**للـ Vercel:**
نفس الخطوات، لكن من Settings → Environment Variables

---

#### الطريقة ب: إنشاء Backend API (الأفضل)

بدلاً من وضع API Keys في Frontend، أنشئ backend بسيط:

**باستخدام Netlify Functions:**

1. أنشئ مجلد `netlify/functions`
2. أنشئ ملف `ai-request.js`:

```javascript
exports.handler = async (event, context) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    // استقبل الطلب من Frontend
    const { prompt } = JSON.parse(event.body);
    
    // استدعِ Gemini API
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            })
        }
    );
    
    const data = await response.json();
    return {
        statusCode: 200,
        body: JSON.stringify(data)
    };
};
```

3. في `index.html`، غيّر استدعاء API من:
```javascript
fetch(`https://generativelanguage.googleapis.com/...?key=${GEMINI_API_KEY}`)
```
إلى:
```javascript
fetch('/.netlify/functions/ai-request', {
    method: 'POST',
    body: JSON.stringify({ prompt: yourPrompt })
})
```

---

## 🔐 أمان API Keys

### كيف تحصل على المفاتيح؟

**Google Gemini (مجاني):**
1. اذهب إلى: https://aistudio.google.com/apikey
2. اضغط "Create API Key"
3. انسخ المفتاح

**Firebase (مجاني):**
1. اذهب إلى: https://console.firebase.google.com/
2. اختر مشروعك أو أنشئ جديد
3. اذهب إلى Project Settings → General
4. انسخ Web API Key

**OpenAI (مدفوع):**
1. اذهب إلى: https://platform.openai.com/api-keys
2. اضغط "Create new secret key"
3. انسخ المفتاح (لن تراه مرة أخرى!)

### ⚠️ تحذيرات مهمة:

1. **لا تشارك** API Keys مع أحد
2. **لا تنشرها** على GitHub
3. **راقب الاستخدام** لتجنب تجاوز الحدود
4. **احذفها فوراً** إذا تم تسريبها

---

## 📝 خطوات الرفع السريع

### Netlify (أسهل طريقة):

1. اذهب إلى: https://app.netlify.com/drop
2. اسحب ملف `index.html` إلى المربع
3. انتظر ثواني، الموقع جاهز! 🎉

### GitHub Pages:

1. أنشئ repository جديد
2. ارفع `index.html`
3. اذهب إلى Settings → Pages
4. اختر branch: main
5. الموقع جاهز على: `username.github.io/repo-name`

### استضافة تقليدية:

1. افتح cPanel أو FTP
2. ارفع `index.html` إلى `public_html`
3. افتح موقعك في المتصفح

---

## 🐛 استكشاف الأخطاء

### المشكلة: "API Key غير صحيح"
**الحل:** تأكد من نسخ المفتاح كاملاً بدون مسافات

### المشكلة: "ميزات AI لا تعمل"
**الحل:** هذا طبيعي إذا لم تضع API Keys. اتبع الخيار 2 أعلاه.

### المشكلة: "الموقع بطيء"
**الحل:** استخدم CDN مثل Cloudflare (مجاني)

### المشكلة: "الصور لا تظهر"
**الحل:** تأكد من رفع مجلد `assets` كاملاً (إن وُجد)

---

## 📞 الدعم

إذا واجهت أي مشاكل:
- 📧 واتساب: +967771447111
- 📖 اقرأ `README-API-KEYS.md` للتفاصيل

---

## ✨ نصيحة نهائية

**ابدأ بالخيار 1** (رفع بدون AI) للتأكد أن الموقع يعمل، ثم أضف ميزات AI لاحقاً عند الحاجة.

الموقع سيعمل 100% بكامل ميزاته الأساسية بدون AI Keys! 🚀
