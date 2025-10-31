# دليل إعداد API Keys

## 🔐 الأمان أولاً

تم إزالة جميع API Keys من ملف `index.html` لحماية حسابك من الاختراق والاستخدام غير المصرح به.

## 📝 خطوات الإعداد

### الطريقة 1: استخدام ملف config.js (للتطوير المحلي فقط)

1. افتح ملف `config.js`
2. استبدل القيم التالية بمفاتيحك الحقيقية:

```javascript
window.GEMINI_API_KEY = "ضع_مفتاحك_هنا";
window.FIREBASE_API_KEY = "ضع_مفتاحك_هنا";
window.OPENAI_API_KEY = "ضع_مفتاحك_هنا";
```

3. أضف السطر التالي في `<head>` قبل `index.html`:

```html
<script src="config.js"></script>
```

### الطريقة 2: استخدام متغيرات البيئة (موصى بها للإنتاج)

إذا كنت تستضيف على **Netlify، Vercel، أو GitHub Pages**:

#### Netlify:
1. اذهب إلى Site settings → Build & deploy → Environment
2. أضف المتغيرات:
   - `GEMINI_API_KEY`
   - `FIREBASE_API_KEY`
   - `OPENAI_API_KEY`

#### Vercel:
1. اذهب إلى Settings → Environment Variables
2. أضف المتغيرات نفسها

#### GitHub Pages + Actions:
1. اذهب إلى Repository → Settings → Secrets
2. أضف الـ secrets

### الطريقة 3: استخدام Backend API (الأكثر أماناً)

بدلاً من وضع المفاتيح في Frontend، أنشئ Backend بسيط:

```javascript
// server.js (Node.js مثال)
const express = require('express');
const app = express();

app.post('/api/gemini', async (req, res) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    // استدعاء API هنا
});
```

## 🔗 احصل على API Keys

### Google Gemini
- الرابط: https://aistudio.google.com/apikey
- مجاني مع حدود استخدام يومية

### Firebase
- الرابط: https://console.firebase.google.com/
- مجاني للاستخدام الأساسي

### OpenAI
- الرابط: https://platform.openai.com/api-keys
- مدفوع (يتطلب بطاقة ائتمانية)

## ⚠️ تحذيرات مهمة

1. **لا تشارك** مفاتيح API مع أي شخص
2. **لا ترفع** ملف `config.js` إلى GitHub
3. **استخدم** `.gitignore` لحماية الملفات الحساسة
4. **راقب** استخدامك للتأكد من عدم تجاوز الحدود المجانية
5. **أعد توليد** المفاتيح إذا تم تسريبها

## 🆘 إذا تم تسريب مفاتيحك

1. **احذفها فوراً** من Google Cloud Console / Firebase / OpenAI
2. **أنشئ مفاتيح جديدة**
3. **راجع سجل الاستخدام** لمعرفة إذا تم استخدامها
4. **غيّر كلمة المرور** للحساب

## 📧 الدعم

إذا واجهت مشاكل في الإعداد، تواصل عبر WhatsApp: +967771447111
