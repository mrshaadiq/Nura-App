package com.nura.app.ui;

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
import androidx.fragment.app.Fragment;

import com.google.gson.Gson;
import com.nura.app.MainActivity;
import com.nura.app.R;
import com.nura.app.database.AppDatabase;
import com.nura.app.database.Patient;
import com.nura.app.utils.AgeCalculator;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class QuestionnaireFragment extends Fragment {
    private TextView tvAgeCalc;
    private LinearLayout llContainer;
    private Button btnNext;
    private AppDatabase db;
    private Patient patient;
    private AgeCalculator.Age age;
    private List<Question> activeQuestions;

    private static class Question {
        final int id;
        final String text;
        int answer = -1; // 1 for Yes (Anomali/Resiko), 0 for No (Normal)

        Question(int id, String text) {
            this.id = id;
            this.text = text;
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_questionnaire, container, false);

        tvAgeCalc = view.findViewById(R.id.tv_patient_age_calc);
        llContainer = view.findViewById(R.id.ll_questions_container);
        btnNext = view.findViewById(R.id.btn_next_to_scanner);

        db = AppDatabase.getDatabase(requireContext());
        int patientId = requireArguments().getInt("patient_id");
        patient = db.patientDao().getPatientById(patientId);

        if (patient != null) {
            age = AgeCalculator.calculateAge(patient.tanggalLahir);
            tvAgeCalc.setText("Kategori: " + age.getCategory() + " (" + age.years + " Thn " + age.months + " Bln)");
            setupQuestions();
        }

        btnNext.setOnClickListener(v -> proceedToScanner());

        return view;
    }

    private void setupQuestions() {
        activeQuestions = new ArrayList<>();
        if (age.years < 2) {
            activeQuestions.add(new Question(1, "Apakah berat badan anak tidak naik/turun di KMS dalam 2 bulan terakhir?"));
            activeQuestions.add(new Question(2, "Apakah anak terlihat lemas, lesu, dan kurang aktif bergerak?"));
            activeQuestions.add(new Question(3, "Apakah anak menolak atau kesulitan saat diberi makan/menyusu?"));
            activeQuestions.add(new Question(4, "Apakah anak kesulitan menatap mata orang tua atau tidak merespons suara?"));
        } else if (age.years <= 5) {
            activeQuestions.add(new Question(1, "Apakah nafsu makan anak sangat rendah dan menolak makan sayur/protein?"));
            activeQuestions.add(new Question(2, "Apakah anak sering mengalami tantrum parah atau ketakutan berlebihan?"));
            activeQuestions.add(new Question(3, "Apakah anak sering mengamuk atau melukai dirinya sendiri/orang lain?"));
            activeQuestions.add(new Question(4, "Apakah anak belum lancar mengucapkan kata/kalimat sederhana?"));
        } else if (age.years <= 12) {
            activeQuestions.add(new Question(1, "Apakah anak sering murung, menyendiri, dan menarik diri dari teman bermain?"));
            activeQuestions.add(new Question(2, "Apakah anak sering mengeluhkan pusing, sakit perut, atau lelah berlebihan?"));
            activeQuestions.add(new Question(3, "Apakah anak kesulitan fokus belajar dan nilainya menurun drastis?"));
            activeQuestions.add(new Question(4, "Apakah anak sering terbangun di malam hari karena mimpi buruk?"));
        } else {
            activeQuestions.add(new Question(1, "Merasa gugup, cemas, atau sangat gelisah dalam 2 minggu terakhir?"));
            activeQuestions.add(new Question(2, "Merasa murung, sedih, putus asa, atau kehilangan minat beraktivitas?"));
            activeQuestions.add(new Question(3, "Mengalami gangguan tidur (susah tidur atau tidur berlebihan)?"));
            activeQuestions.add(new Question(4, "Kurang bertenaga, lemas, atau kesulitan berkonsentrasi melakukan sesuatu?"));
        }

        llContainer.removeAllViews();
        for (int i = 0; i < activeQuestions.size(); i++) {
            Question q = activeQuestions.get(i);
            View qView = LayoutInflater.from(getContext()).inflate(R.layout.item_question, llContainer, false);
            TextView tvText = qView.findViewById(R.id.tv_question_text);
            android.widget.RadioGroup rg = qView.findViewById(R.id.rg_options);

            tvText.setText((i + 1) + ". " + q.text);
            rg.setOnCheckedChangeListener((group, checkedId) -> {
                if (checkedId == R.id.rb_yes) {
                    q.answer = 1;
                } else if (checkedId == R.id.rb_no) {
                    q.answer = 0;
                }
            });

            llContainer.addView(qView);
        }
    }

    private void proceedToScanner() {
        for (Question q : activeQuestions) {
            if (q.answer == -1) {
                Toast.makeText(getContext(), "Mohon jawab semua pertanyaan kuesioner", Toast.LENGTH_SHORT).show();
                return;
            }
        }

        int totalScore = 0;
        List<Map<String, Object>> answersList = new ArrayList<>();
        for (Question q : activeQuestions) {
            totalScore += q.answer;
            Map<String, Object> map = new HashMap<>();
            map.put("question", q.text);
            map.put("score", q.answer);
            answersList.add(map);
        }

        String answersJson = new Gson().toJson(answersList);

        ScannerFragment fragment = new ScannerFragment();
        Bundle args = new Bundle();
        args.putInt("patient_id", patient.id);
        args.putInt("usia_tahun", age.years);
        args.putInt("usia_bulan", age.months);
        args.putInt("score", totalScore);
        args.putString("answers_json", answersJson);
        fragment.setArguments(args);

        ((MainActivity) requireActivity()).loadFragment(fragment, true);
    }
}
