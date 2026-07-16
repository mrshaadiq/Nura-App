package com.nura.app.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton;
import com.nura.app.MainActivity;
import com.nura.app.R;
import com.nura.app.ai.LocalClassifier;
import com.nura.app.database.AppDatabase;
import com.nura.app.database.Patient;

import java.util.List;

public class HomeFragment extends Fragment {
    private RecyclerView rvPatients;
    private TextView tvEmptyState;
    private TextView tvBypassStatus;
    private ExtendedFloatingActionButton btnAddPatient;
    private AppDatabase db;
    private List<Patient> patients;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_home, container, false);

        rvPatients = view.findViewById(R.id.rv_patients);
        tvEmptyState = view.findViewById(R.id.tv_empty_state);
        tvBypassStatus = view.findViewById(R.id.tv_bypass_status);
        btnAddPatient = view.findViewById(R.id.btn_add_patient);

        rvPatients.setLayoutManager(new LinearLayoutManager(getContext()));
        db = AppDatabase.getDatabase(requireContext());

        btnAddPatient.setOnClickListener(v -> {
            ((MainActivity) requireActivity()).loadFragment(new ProfileFragment(), true);
        });

        loadPatients();
        updateBypassStatus();

        return view;
    }

    private void loadPatients() {
        patients = db.patientDao().getAllPatients();
        if (patients.isEmpty()) {
            tvEmptyState.setVisibility(View.VISIBLE);
            rvPatients.setVisibility(View.GONE);
        } else {
            tvEmptyState.setVisibility(View.GONE);
            rvPatients.setVisibility(View.VISIBLE);
            PatientAdapter adapter = new PatientAdapter(patients);
            rvPatients.setAdapter(adapter);
        }
    }

    public void updateBypassStatus() {
        if (tvBypassStatus != null) {
            if (LocalClassifier.isBypassMode()) {
                tvBypassStatus.setVisibility(View.VISIBLE);
            } else {
                tvBypassStatus.setVisibility(View.GONE);
            }
        }
    }

    private class PatientAdapter extends RecyclerView.Adapter<PatientAdapter.ViewHolder> {
        private final List<Patient> list;

        PatientAdapter(List<Patient> list) {
            this.list = list;
        }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_patient, parent, false);
            return new ViewHolder(v);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
            Patient p = list.get(position);
            holder.tvName.setText(p.namaPasien);
            holder.tvDob.setText("Tgl Lahir: " + p.tanggalLahir);

            if (p.jenisKelamin.equals("L")) {
                holder.tvGender.setText("Laki-laki");
                holder.tvGender.setBackgroundResource(R.drawable.badge_blue);
            } else {
                holder.tvGender.setText("Perempuan");
                holder.tvGender.setBackgroundResource(R.drawable.badge_pink);
            }

            holder.btnStart.setOnClickListener(v -> {
                QuestionnaireFragment fragment = new QuestionnaireFragment();
                Bundle args = new Bundle();
                args.putInt("patient_id", p.id);
                fragment.setArguments(args);
                ((MainActivity) requireActivity()).loadFragment(fragment, true);
            });

            holder.btnHistory.setOnClickListener(v -> {
                HistoryFragment fragment = new HistoryFragment();
                Bundle args = new Bundle();
                args.putInt("patient_id", p.id);
                fragment.setArguments(args);
                ((MainActivity) requireActivity()).loadFragment(fragment, true);
            });
        }

        @Override
        public int getItemCount() {
            return list.size();
        }

        class ViewHolder extends RecyclerView.ViewHolder {
            TextView tvName, tvDob, tvGender;
            Button btnStart, btnHistory;

            ViewHolder(@NonNull View itemView) {
                super(itemView);
                tvName = itemView.findViewById(R.id.tv_patient_name);
                tvDob = itemView.findViewById(R.id.tv_patient_dob);
                tvGender = itemView.findViewById(R.id.tv_gender_badge);
                btnStart = itemView.findViewById(R.id.btn_start_screening);
                btnHistory = itemView.findViewById(R.id.btn_view_history);
            }
        }
    }
}
