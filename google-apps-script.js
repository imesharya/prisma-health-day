/*
================================================================================
تطبيق Google Apps Script - خادم لعبة العجلة الدوارة + الداشبورد
Prisma Spin-the-Wheel Server
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

٤. لصق الرابط
   ────────────
   - في ملف spin-the-wheel.html → ابحث عن GOOGLE_SHEET_URL والصق الرابط
   - في ملف dashboard.html → ابحث عن SCRIPT_URL والصق الرابط

================================================================================
*/

/**
 * معالج طلبات GET — الداشبورد تستخدمه لقراءة البيانات
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const values = sheet.getDataRange().getValues();

    // لو الورقة فاضية أو فيها الهيدر بس
    if (values.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // تحويل الصفوف إلى JSON (نتخطى الهيدر)
    const data = [];
    for (let i = 1; i < values.length; i++) {
      data.push({
        name: values[i][0] || '',
        phone: String(values[i][1] || ''),
        prize: values[i][2] || '',
        timestamp: values[i][3] || ''
      });
    }

    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * معالج طلبات POST — العجلة ترسل بيانات الفائز هنا
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSheet();

    // إضافة الهيدرز لو الورقة فاضية
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['الاسم', 'رقم الجوال', 'الجائزة', 'الوقت والتاريخ']);
    }

    // إضافة البيانات
    sheet.appendRow([
      payload.name || '',
      payload.phone || '',
      payload.prize || '',
      payload.timestamp || ''
    ]);

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
