# ميزة: كتب archive.org عبر البوت

## التدفق للمستخدم

1. المستخدم يكتب: «اريد رواية الخوف» أو «كتاب المقدمة».
2. البوت يبحث في archive.org ويرد بقائمة أول 5 نتائج على شكل أزرار (Generic Template).
3. المستخدم يضغط زر كتاب → البوت يرسل أول 10 صفحات كصور + زر «الصفحات التالية».
4. المستخدم يضغط «التالي» → 10 صفحات جديدة، وهكذا حتى نهاية الكتاب.

## قاعدة البيانات (هجرة واحدة)

- `book_sessions`: جلسة قراءة نشطة لكل مستخدم.
  - `id`, `facebook_user_id` (unique)، `identifier` (معرّف archive.org)، `title`، `total_pages`، `current_page` (افتراضياً 0)، `updated_at`.
- `book_search_cache`: نتائج آخر بحث لكل مستخدم لربطها بضغطات الأزرار.
  - `facebook_user_id` (unique)، `results` (jsonb: `[{identifier,title,creator,pages}]`)، `created_at`.
- GRANT + RLS: قراءة/كتابة لـ `service_role` فقط (الـ edge function).

## اكتشاف النية (داخل `messenger`)

قبل استدعاء الـ LLM، نمرّر النص على تعبير بسيط:

```text
/^\s*(?:اريد|أريد|ابغى|هات|ابعت|ابعث|ممكن)?\s*(كتاب|رواية|مؤلف|قصة)\s+(.{2,})/iu
```

عند التطابق → استدعاء الحاجز الجديد `handleBookRequest(query)` بدل الـ LLM.

## Edge function جديدة: `book-fetcher`

مسارات داخلية (لا HTTP خارجي — تُستدعى من `messenger`):

- `search(query)`: يستدعي `https://archive.org/advancedsearch.php?q=title:(Q) AND mediatype:texts AND language:(Arabic OR ara)&fl[]=identifier,title,creator,imagecount&rows=5&output=json`، يحفظ النتائج في `book_search_cache`، ويرجع القائمة.
- `startReading(fbUserId, identifier)`: يجلب `metadata` من `https://archive.org/metadata/{id}` لمعرفة `imagecount`، ينشئ/يحدّث `book_sessions`، ويرجع أول دفعة.
- `nextBatch(fbUserId)`: يقرأ الجلسة، يرجع الصور من `current_page` إلى `+10`، ويحدّث `current_page`.

روابط الصور (مباشرة من archive.org، لا نستضيفها):

```text
https://archive.org/download/{identifier}/page/n{N}_w800.jpg
```

`N` = 0-indexed حتى `imagecount - 1`. Messenger يجلب الصورة من الرابط مباشرة.

## تعديل `messenger`

1. **معالجة الرسائل النصية**: بعد الفحوصات الحالية، إذا تطابق نمط طلب كتاب → `book-fetcher.search()` → إرسال Generic Template بـ 5 عناصر (كل واحد: عنوان + مؤلف + زر «اقرأ» يحمل `postback: BOOK_READ:{identifier}`).
2. **معالجة الـ postbacks** (توسيع الـ handler الموجود):
   - `BOOK_READ:{id}` → `startReading()` → إرسال أول 10 صور + Quick Reply/Button «الصفحات التالية» → postback `BOOK_NEXT`.
   - `BOOK_NEXT` → `nextBatch()` → إرسال 10 صور جديدة + زر متابعة. عند انتهاء الكتاب: رسالة «انتهى الكتاب 📖» وحذف الجلسة.
3. إرسال الصور: كل صفحة كـ `attachment: {type: image, payload: {url, is_reusable: false}}`. لتجنب rate limit نضع `await new Promise(r => setTimeout(r, 300))` بين كل صورتين.

## واجهة إدارية (اختيارية — بسيطة)

صفحة `/books` تعرض `book_sessions` النشطة (من يقرأ ماذا وعند أي صفحة). صفحة قصيرة للمراقبة فقط.

## قيود ينبغي إبلاغ المستخدم بها

- سياسة Meta 24 ساعة: إرسال الصور المتتالية يعتمد على أن آخر تفاعل للمستخدم خلال 24 ساعة (وهو الحال هنا لأنه يضغط الأزرار).
- بعض الكتب على archive.org محمية ولا توفّر صور صفحات — سنعالج ذلك بالتحقق من `imagecount > 0` وتخطي مثل هذه النتائج.
- الأداء: 10 صور × 300ms + وقت جلب Messenger لكل صورة ≈ 5-10 ثوانٍ للدفعة.

## الملفات

**جديدة:**
- `supabase/migrations/<ts>_book_sessions.sql`
- `supabase/functions/book-fetcher/index.ts`
- `src/routes/_authenticated/books.tsx` (اختياري)
- رابط «Books» في `admin.tsx`

**معدّلة:**
- `supabase/functions/messenger/index.ts` — إضافة كشف النية + معالجة postbacks الجديدة.

## ماذا لا يتم في هذه المرحلة

- لا تحليل/تلخيص للكتاب (بناءً على اختيارك).
- لا OCR ولا إعادة استضافة للصور.
- لا بحث متقدم (سنة، مؤلف محدد) — فقط بحث بالعنوان.

هل أبدأ التنفيذ؟
