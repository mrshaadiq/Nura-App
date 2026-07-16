package com.nura.app.ui;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import com.google.common.util.concurrent.ListenableFuture;
import com.nura.app.MainActivity;
import com.nura.app.R;
import com.nura.app.ai.LocalClassifier;
import com.nura.app.database.AppDatabase;
import com.nura.app.database.ScreeningSession;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.util.UUID;

public class ScannerFragment extends Fragment {
    private static final String TAG = "ScannerFragment";

    private PreviewView previewView;
    private TextView tvStepTitle;
    private TextView tvInstruction;
    private Button btnCapture;

    private ImageCapture imageCapture;
    private int currentStep = 1; // 1: Mata, 2: Kuku, 3: Wajah

    private int patientId;
    private int usiaTahun;
    private int usiaBulan;
    private int questionnaireScore;
    private String answersJson;

    private String eyePhotoPath = "";
    private String nailPhotoPath = "";
    private String facePhotoPath = "";

    private String eyeAnalysis = "";
    private String nailAnalysis = "";
    private String faceAnalysis = "";

    private LocalClassifier classifier;
    private AppDatabase db;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_scanner, container, false);

        previewView = view.findViewById(R.id.preview_view);
        tvStepTitle = view.findViewById(R.id.tv_scanner_step);
        tvInstruction = view.findViewById(R.id.tv_scanner_instruction);
        btnCapture = view.findViewById(R.id.btn_capture);

        Bundle args = requireArguments();
        patientId = args.getInt("patient_id");
        usiaTahun = args.getInt("usia_tahun");
        usiaBulan = args.getInt("usia_bulan");
        questionnaireScore = args.getInt("score");
        answersJson = args.getString("answers_json");

        db = AppDatabase.getDatabase(requireContext());
        classifier = new LocalClassifier(requireContext());

        startCamera();

        btnCapture.setOnClickListener(v -> capturePhoto());

        updateUI();

        return view;
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(requireContext());
        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                bindPreview(cameraProvider);
            } catch (Exception e) {
                Log.e(TAG, "CameraX binding failed, enabling mock capture mode.", e);
                Toast.makeText(getContext(), "Menggunakan mode simulasi kamera", Toast.LENGTH_SHORT).show();
            }
        }, ContextCompat.getMainExecutor(requireContext()));
    }

    private void bindPreview(@NonNull ProcessCameraProvider cameraProvider) {
        Preview preview = new Preview.Builder().build();
        CameraSelector cameraSelector = new CameraSelector.Builder()
                .requireLensFacing(CameraSelector.LENS_FACING_BACK)
                .build();

        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        imageCapture = new ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                .build();

        cameraProvider.unbindAll();
        cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageCapture);
    }

    private void updateUI() {
        if (currentStep == 1) {
            tvStepTitle.setText("Langkah 1/3: Pemindaian Mata");
            tvInstruction.setText("Posisikan mata (konjungtiva) anak di dalam area kotak pemandu.");
        } else if (currentStep == 2) {
            tvStepTitle.setText("Langkah 2/3: Pemindaian Kuku");
            tvInstruction.setText("Posisikan kuku tangan anak di dalam area kotak pemandu.");
        } else {
            tvStepTitle.setText("Langkah 3/3: Pemindaian Wajah");
            tvInstruction.setText("Posisikan seluruh wajah anak di dalam area kotak pemandu.");
        }
    }

    private void capturePhoto() {
        if (imageCapture == null || LocalClassifier.isBypassMode()) {
            handleCapturedImage(null);
            return;
        }

        imageCapture.takePicture(ContextCompat.getMainExecutor(requireContext()), new ImageCapture.OnImageCapturedCallback() {
            @Override
            public void onCaptureSuccess(@NonNull ImageProxy image) {
                Bitmap bitmap = imageToBitmap(image);
                image.close();
                handleCapturedImage(bitmap);
            }

            @Override
            public void onError(@NonNull ImageCaptureException exception) {
                Log.e(TAG, "Photo capture failed, fallback to mock", exception);
                handleCapturedImage(null);
            }
        });
    }

    private Bitmap imageToBitmap(ImageProxy image) {
        ByteBuffer buffer = image.getPlanes()[0].getBuffer();
        byte[] bytes = new byte[buffer.remaining()];
        buffer.get(bytes);
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.length, null);
    }

    private void handleCapturedImage(Bitmap bitmap) {
        File photoFile = new File(requireContext().getCacheDir(), "scan_" + UUID.randomUUID().toString() + ".jpg");
        try (FileOutputStream fos = new FileOutputStream(photoFile)) {
            if (bitmap != null) {
                Bitmap scaled = Bitmap.createScaledBitmap(bitmap, 500, (int) (bitmap.getHeight() * (500.0 / bitmap.getWidth())), true);
                scaled.compress(Bitmap.CompressFormat.JPEG, 80, fos);
            } else {
                Bitmap dummy = Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888);
                dummy.compress(Bitmap.CompressFormat.JPEG, 80, fos);
            }
        } catch (Exception e) {
            Log.e(TAG, "Save photo error", e);
        }

        String path = photoFile.getAbsolutePath();
        Bitmap classifyBitmap = bitmap != null ? bitmap : Bitmap.createBitmap(224, 224, Bitmap.Config.ARGB_8888);

        if (currentStep == 1) {
            eyePhotoPath = path;
            eyeAnalysis = classifier.analyzeEyes(classifyBitmap);
            currentStep = 2;
            updateUI();
            Toast.makeText(getContext(), "Foto mata disimpan", Toast.LENGTH_SHORT).show();
        } else if (currentStep == 2) {
            nailPhotoPath = path;
            nailAnalysis = classifier.analyzeNails(classifyBitmap);
            currentStep = 3;
            updateUI();
            Toast.makeText(getContext(), "Foto kuku disimpan", Toast.LENGTH_SHORT).show();
        } else {
            facePhotoPath = path;
            faceAnalysis = classifier.analyzeFace(classifyBitmap);
            Toast.makeText(getContext(), "Pemindaian selesai, memproses hasil...", Toast.LENGTH_SHORT).show();
            saveScreeningSession();
        }
    }

    private void saveScreeningSession() {
        String levelRisiko = "rendah";
        StringBuilder summary = new StringBuilder();
        StringBuilder recommendation = new StringBuilder();

        boolean hasEyeAnemia = eyeAnalysis.contains("Pucat");
        boolean hasNailAnomaly = nailAnalysis.contains("Cekung");

        int anomalyPoints = 0;
        if (hasEyeAnemia) anomalyPoints += 2;
        if (hasNailAnomaly) anomalyPoints += 2;
        anomalyPoints += questionnaireScore;

        if (anomalyPoints >= 4) {
            levelRisiko = "tinggi";
            summary.append("Peringatan: Terdeteksi risiko tinggi malnutrisi kronis (stunting) atau anemia berat.");
            recommendation.append("Segera rujuk anak ke Puskesmas atau dokter anak terdekat untuk penanganan medis formal.\n\n")
                    .append("Saran Nutrisi Darurat:\n")
                    .append("- Berikan asupan protein tinggi secara teratur (Telur rebus 2 butir sehari, Ikan kembung, Hati ayam).\n")
                    .append("- Berikan sayur hijau kaya zat besi seperti daun kelor yang direbus matang.\n")
                    .append("- Hindari pemberian teh atau kopi karena menghambat penyerapan zat besi.");
        } else if (anomalyPoints >= 2) {
            levelRisiko = "sedang";
            summary.append("Perhatian: Terdeteksi indikasi risiko sedang. Diperlukan perbaikan pola makan dan observasi berkala.");
            recommendation.append("Jadwalkan kunjungan ke Posyandu untuk pengukuran tinggi/berat badan berkala.\n\n")
                    .append("Saran Gizi Tambahan:\n")
                    .append("- Berikan lauk pauk padat gizi lokal seperti tempe, telur, dan olahan ikan kelor.\n")
                    .append("- Pastikan anak mengonsumsi buah kaya vitamin C (jeruk, pepaya) untuk membantu penyerapan zat besi.");
        } else {
            levelRisiko = "rendah";
            summary.append("Kondisi kesehatan fisik anak terpantau normal. Tumbuh kembang terpantau sejalan dengan indikator gizi.");
            recommendation.append("Pertahankan pola makan bergizi seimbang 3 kali sehari.\n\n")
                    .append("Saran Pemeliharaan:\n")
                    .append("- Pastikan anak mendapatkan ASI/susu sesuai kebutuhan usianya.\n")
                    .append("- Lakukan skrining rutin setiap 3 bulan sekali.");
        }

        ScreeningSession session = new ScreeningSession();
        session.patientId = patientId;
        session.usiaTahun = usiaTahun;
        session.usiaBulan = usiaBulan;
        session.fotoMataPath = eyePhotoPath;
        session.fotoKukuPath = nailPhotoPath;
        session.fotoMukaPath = facePhotoPath;
        session.analisisMata = eyeAnalysis;
        session.analisisKuku = nailAnalysis;
        session.analisisMuka = faceAnalysis;
        session.jawabanKuesioner = answersJson;
        session.analisisGabungan = summary.toString();
        session.rekomendasi = recommendation.toString();
        session.levelRisiko = levelRisiko;
        session.createdAt = System.currentTimeMillis();

        long sessionId = db.screeningSessionDao().insert(session);

        classifier.release();

        ResultsFragment fragment = new ResultsFragment();
        Bundle args = new Bundle();
        args.putInt("session_id", (int) sessionId);
        fragment.setArguments(args);

        ((MainActivity) requireActivity()).loadFragment(fragment, false);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (classifier != null) {
            classifier.release();
        }
    }
}
