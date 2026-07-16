package com.nura.app.ui;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.cardview.widget.CardView;
import androidx.core.content.FileProvider;
import androidx.fragment.app.Fragment;

import com.nura.app.R;
import com.nura.app.database.AppDatabase;
import com.nura.app.database.Patient;
import com.nura.app.database.ScreeningSession;
import com.nura.app.utils.PdfGenerator;

import java.io.File;

public class ResultsFragment extends Fragment {
    private TextView tvPatientInfo;
    private CardView cvStatusCard;
    private LinearLayout llStatusBackground;
    private TextView tvRiskLevel;
    private TextView tvCombinedSummary;

    private TextView tvResultEyes;
    private TextView tvResultNails;
    private TextView tvResultQuestionnaire;
    private TextView tvNutritionRec;

    private Button btnOpenMaps;
    private Button btnExportPdf;

    private AppDatabase db;
    private ScreeningSession session;
    private Patient patient;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_results, container, false);

        tvPatientInfo = view.findViewById(R.id.tv_result_patient_info);
        cvStatusCard = view.findViewById(R.id.cv_status_card);
        llStatusBackground = view.findViewById(R.id.ll_status_background);
        tvRiskLevel = view.findViewById(R.id.tv_risk_level);
        tvCombinedSummary = view.findViewById(R.id.tv_combined_summary);

        tvResultEyes = view.findViewById(R.id.tv_result_eyes);
        tvResultNails = view.findViewById(R.id.tv_result_nails);
        tvResultQuestionnaire = view.findViewById(R.id.tv_result_questionnaire);
        tvNutritionRec = view.findViewById(R.id.tv_nutrition_rec);

        btnOpenMaps = view.findViewById(R.id.btn_open_maps);
        btnExportPdf = view.findViewById(R.id.btn_export_pdf);

        db = AppDatabase.getDatabase(requireContext());
        int sessionId = requireArguments().getInt("session_id");

        session = db.screeningSessionDao().getSessionById(sessionId);
        if (session != null) {
            patient = db.patientDao().getPatientById(session.patientId);
            displayResults();
        }

        btnOpenMaps.setOnClickListener(v -> openReferralMap());
        btnExportPdf.setOnClickListener(v -> exportPdfReport());

        return view;
    }

    private void displayResults() {
        if (patient != null) {
            tvPatientInfo.setText("Pasien: " + patient.namaPasien + " | Usia: " + session.usiaTahun + " Thn " + session.usiaBulan + " Bln");
        }

        tvRiskLevel.setText("RISIKO " + session.levelRisiko.toUpperCase());
        tvCombinedSummary.setText(session.analisisGabungan);

        if (session.levelRisiko.equalsIgnoreCase("tinggi")) {
            llStatusBackground.setBackgroundColor(Color.parseColor("#FEE2E2"));
            tvRiskLevel.setTextColor(Color.parseColor("#991B1B"));
            tvCombinedSummary.setTextColor(Color.parseColor("#7F1D1D"));
        } else if (session.levelRisiko.equalsIgnoreCase("sedang")) {
            llStatusBackground.setBackgroundColor(Color.parseColor("#FEF3C7"));
            tvRiskLevel.setTextColor(Color.parseColor("#92400E"));
            tvCombinedSummary.setTextColor(Color.parseColor("#78350F"));
        } else {
            llStatusBackground.setBackgroundColor(Color.parseColor("#DEF7EC"));
            tvRiskLevel.setTextColor(Color.parseColor("#03543F"));
            tvCombinedSummary.setTextColor(Color.parseColor("#046C4E"));
        }

        tvResultEyes.setText(session.analisisMata);
        tvResultNails.setText(session.analisisKuku);
        tvResultQuestionnaire.setText("Skor Anomali Kuesioner: " + getAnomalyCount() + " Terdeteksi");
        tvNutritionRec.setText(session.rekomendasi);
    }

    private int getAnomalyCount() {
        if (session.analisisGabungan.contains("tinggi")) return 3;
        if (session.analisisGabungan.contains("sedang")) return 1;
        return 0;
    }

    private void openReferralMap() {
        Uri mapUri = Uri.parse("geo:0,0?q=Puskesmas+terdekat");
        Intent mapIntent = new Intent(Intent.ACTION_VIEW, mapUri);
        mapIntent.setPackage("com.google.android.apps.maps");
        if (mapIntent.resolveActivity(requireActivity().getPackageManager()) != null) {
            startActivity(mapIntent);
        } else {
            Intent webMapIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/search/Puskesmas+terdekat"));
            startActivity(webMapIntent);
        }
    }

    private void exportPdfReport() {
        if (patient == null || session == null) return;
        
        File pdfFile = PdfGenerator.generateScreeningPdf(requireContext(), patient, session);
        if (pdfFile != null && pdfFile.exists()) {
            Uri pdfUri = FileProvider.getUriForFile(requireContext(), "com.nura.app.fileprovider", pdfFile);
            
            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("application/pdf");
            shareIntent.putExtra(Intent.EXTRA_STREAM, pdfUri);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            
            startActivity(Intent.createChooser(shareIntent, "Bagikan Laporan Kesehatan"));
        } else {
            Toast.makeText(getContext(), "Gagal membuat dokumen PDF", Toast.LENGTH_SHORT).show();
        }
    }
}
