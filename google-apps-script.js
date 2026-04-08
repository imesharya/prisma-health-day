/*
================================================================================
تطبيق Google Apps Script — خادم لعبة العجلة الدوارة + الداشبورد
Prisma Spin-the-Wheel Server v2.0
================================================================================

خطوات الإعداد:
═══════════════

١. إنشاء جدول بيانات Google Sheet
   ─────────────────────────────────
   - افتح https://sheets.google.com
   - أنشئ جدول جديد وسمّه "Prisma Wheel Data"

٢. فتح محرر Apps Script
   ────────────────────────
   - من الجدول: Extensions → Apps Script
   - احذف الكود الافتراضي
   - الصق هذا الكود بالكامل
   - احفظ (Ctrl+S)

٣. النشر كتطبيق ويب
   ──────────────────
   - اضغط Deploy → New deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - اضغط Deploy
   - انسخ الرابط اللي يطلع لك

⚠️ مهم: كل مرة تعدّل الكود، لازم تنشر نسخة جديدة:
   Deploy → Manage deployments → Edit → Version: New version → Deploy

٤. لصق الرابط
   ────────────
   - في ملف wheel.html → ابحث عن GOOGLE_SHEET_URL والصق الرابط
   - في ملف dashboard.html → ابحث عن HARDCODED_URL والصق الرابط

================================================================================
ترتيب الأعمدة في الشيت:
   A: الاسم | B: رقم الجوال | C: الجائزة | D: الوقت والتاريخ
================================================================================
*/

/**
 * معالج طلبات GET — الداشبورد تستخدمه لقراءة البيانات
 * يدعم صيغتين:
 *   - GET بدون بارامتر → يرجع مصفوفة JSON مباشرة (للتوافق مع الداشبورد)
 *   - GET ?action=list → يرجع {status, data, count}
 */
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var values = sheet.getDataRange().getValues();

    // لو الورقة فاضية أو فيها الهيدر بس
    if (values.length <= 1) {
      var emptyResult = [];
      if (e && e.parameter && e.parameter.action === 'list') {
        return createJsonResponse({ status: 'success', data: [], count: 0 });
      }
      return createJsonResponse(emptyResult);
    }

    // تحويل الصفوف إلى JSON (نتخطى الهيدر)
    var data = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      // تخطي الصفوف الفاضية
      if (!row[0] && !row[1]) continue;

      data.push({
        name: row[0] ? row[0].toString() : '',
        phone: row[1] ? row[1].toString().replace(/^'/, '') : '',
        prize: row[2] ? row[2].toString() : '',
        timestamp: row[3] ? row[3].toString() : ''
      });
    }

    // دعم كلا الصيغتين
    if (e && e.parameter && e.parameter.action === 'list') {
      return createJsonResponse({ status: 'success', data: data, count: data.length });
    }

    return createJsonResponse(data);

  } catch (error) {
    return createJsonResponse({ error: error.toString() });
  }
}

/**
 * معالج طلبات POST — العجلة ترسل بيانات الفائز هنا
 * يقبل Content-Type: text/plain أو application/json
 */
function doPost(e) {
  try {
    var payload;

    // محاولة قراءة البيانات من أي صيغة
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      payload = e.parameter;
    } else {
      throw new Error('No data received');
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // إضافة الهيدرز لو الورقة فاضية
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['الاسم', 'رقم الجوال', 'الجائزة', 'الوقت والتاريخ']);
    }

    // التحقق من عدم التكرار (نفس الاسم + الرقم + نفس الدقيقة)
    var name = payload.name || '';
    var phone = String(payload.phone || '');
    var prize = payload.prize || '';
    var timestamp = payload.timestamp || new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });

    // إضافة البيانات
    sheet.appendRow([name, phone, prize, timestamp]);

    return createJsonResponse({ success: true, message: 'Data saved successfully' });

  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * دالة مساعدة لإنشاء استجابة JSON مع CORS headers
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
