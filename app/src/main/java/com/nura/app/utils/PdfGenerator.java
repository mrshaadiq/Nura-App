package com.nura.app.utils;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.pdf.PdfDocument;

import com.nura.app.database.Patient;
import com.nura.app.database.ScreeningSession;

import java.io.File;
import java.io.FileOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class PdfGenerator {
    public static File generateScreeningPdf(Context context, Patient patient, ScreeningSession session) {
        PdfDocument document = new PdfDocument();

        // Create page info (standard A4 is 595 x 842 points)
        PdfDocument.PageInfo pageInfo = new PdfDocument.PageInfo.Builder(595, 842, 1).create();
        PdfDocument.Page page = document.startPage(pageInfo);

        Canvas canvas = page.getCanvas();
        Paint paint = new Paint();

        // Title Header
        paint.setColor(Color.parseColor("#6366F1")); // Indigo
        paint.setTextSize(20);
        paint.setFakeBoldText(true);
        canvas.drawText("NURA: LAPORAN KESEHATAN ANAK", 40, 60, paint);

        // Subtitle divider line
        paint.setColor(Color.parseColor("#E2E8F0"));
        paint.setStrokeWidth(2);
        canvas.drawLine(40, 75, 555, 75, paint);

        // Reset Paint
        paint.setFakeBoldText(false);
        paint.setStrokeWidth(0);

        // Patient profile details section
        paint.setColor(Color.parseColor("#1E293B"));
        paint.setTextSize(14);
        paint.setFakeBoldText(true);
        canvas.drawText("PROFIL PASIEN", 40, 110, paint);
        paint.setFakeBoldText(false);

        paint.setTextSize(12);
        canvas.drawText("Nama Pasien  : " + patient.namaPasien, 40, 135, paint);
        canvas.drawText("Tgl Lahir          : " + patient.tanggalLahir, 40, 155, paint);
        canvas.drawText("Jenis Kelamin  : " + (patient.jenisKelamin.equals("L") ? "Laki-laki" : "Perempuan"), 40, 175, paint);
        canvas.drawText("Usia                   : " + session.usiaTahun + " Tahun " + session.usiaBulan + " Bulan", 40, 195, paint);

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault());
        String dateStr = sdf.format(new Date(session.createdAt));
        canvas.drawText("Waktu Skrining : " + dateStr, 40, 215, paint);

        // Divider
        paint.setColor(Color.parseColor("#E2E8F0"));
        canvas.drawLine(40, 235, 555, 235, paint);

        // Diagnosis Summary section
        paint.setColor(Color.parseColor("#1E293B"));
        paint.setTextSize(14);
        paint.setFakeBoldText(true);
        canvas.drawText("HASIL SCREENING OFFLINE", 40, 270, paint);
        paint.setFakeBoldText(false);

        // Risk Level Badge Background
        paint.setTextSize(12);
        if (session.levelRisiko.equalsIgnoreCase("tinggi")) {
            paint.setColor(Color.parseColor("#FEE2E2")); // Light Red
            canvas.drawRect(40, 285, 200, 315, paint);
            paint.setColor(Color.parseColor("#EF4444")); // Red text
            paint.setFakeBoldText(true);
            canvas.drawText("RISIKO TINGGI", 55, 305, paint);
        } else if (session.levelRisiko.equalsIgnoreCase("sedang")) {
            paint.setColor(Color.parseColor("#FEF3C7")); // Light Orange
            canvas.drawRect(40, 285, 200, 315, paint);
            paint.setColor(Color.parseColor("#D97706")); // Orange text
            paint.setFakeBoldText(true);
            canvas.drawText("RISIKO SEDANG", 55, 305, paint);
        } else {
            paint.setColor(Color.parseColor("#DEF7EC")); // Light Green
            canvas.drawRect(40, 285, 200, 315, paint);
            paint.setColor(Color.parseColor("#03543F")); // Green text
            paint.setFakeBoldText(true);
            canvas.drawText("RISIKO RENDAH", 55, 305, paint);
        }
        paint.setFakeBoldText(false);

        // AI details
        paint.setColor(Color.parseColor("#1E293B"));
        canvas.drawText("1. Mata (Konjungtiva)  : " + session.analisisMata, 40, 345, paint);
        canvas.drawText("2. Kuku Tangan            : " + session.analisisKuku, 40, 375, paint);
        canvas.drawText("3. Fisik Kulit/Wajah    : " + session.analisisMuka, 40, 405, paint);

        // Dynamic questions info
        canvas.drawText("4. Hasil Evaluasi Kuesioner :", 40, 435, paint);
        paint.setColor(Color.parseColor("#475569"));
        
        // Wrap/Split answers summary
        String answersSummary = session.analisisGabungan;
        if (answersSummary.length() > 65) {
            canvas.drawText(answersSummary.substring(0, 65), 55, 455, paint);
            canvas.drawText(answersSummary.substring(65), 55, 475, paint);
        } else {
            canvas.drawText(answersSummary, 55, 455, paint);
        }

        // Divider
        paint.setColor(Color.parseColor("#E2E8F0"));
        canvas.drawLine(40, 500, 555, 500, paint);

        // Recommendations Section
        paint.setColor(Color.parseColor("#166534")); // Dark Green
        paint.setTextSize(14);
        paint.setFakeBoldText(true);
        canvas.drawText("SARAN TINDAKAN & NUTRISI LOKAL", 40, 530, paint);
        paint.setFakeBoldText(false);

        paint.setTextSize(11);
        paint.setColor(Color.parseColor("#14532D"));

        String recText = session.rekomendasi;
        // Simple manual line wrapping for PDF canvas
        int y = 560;
        int index = 0;
        while (index < recText.length()) {
            int end = Math.min(index + 75, recText.length());
            // Look for space to avoid breaking words
            if (end < recText.length()) {
                int lastSpace = recText.lastIndexOf(' ', end);
                if (lastSpace > index) {
                    end = lastSpace;
                }
            }
            canvas.drawText(recText.substring(index, end).trim(), 40, y, paint);
            y += 20;
            index = end;
        }

        // Footer disclaimer
        paint.setColor(Color.parseColor("#94A3B8"));
        paint.setTextSize(10);
        canvas.drawText("Laporan ini digenerasi secara offline oleh sistem AI On-Device Nura.", 40, 800, paint);

        document.finishPage(page);

        // Write document to file
        File pdfFile = new File(context.getCacheDir(), "Nura_Screening_" + patient.namaPasien.replaceAll("\\s+", "_") + "_" + session.id + ".pdf");
        try {
            FileOutputStream fos = new FileOutputStream(pdfFile);
            document.writeTo(fos);
            document.close();
            fos.close();
            return pdfFile;
        } catch (Exception e) {
            e.printStackTrace();
            document.close();
            return null;
        }
    }
}
