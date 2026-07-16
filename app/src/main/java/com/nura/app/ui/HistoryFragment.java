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

import com.nura.app.MainActivity;
import com.nura.app.R;
import com.nura.app.database.AppDatabase;
import com.nura.app.database.Patient;
import com.nura.app.database.ScreeningSession;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class HistoryFragment extends Fragment {
    private RecyclerView rvHistory;
    private TextView tvPatientName;
    private TextView tvEmptyState;
    
    private AppDatabase db;
    private Patient patient;
    private List<ScreeningSession> sessions;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_history, container, false);

        rvHistory = view.findViewById(R.id.rv_history);
        tvPatientName = view.findViewById(R.id.tv_history_patient);
        tvEmptyState = view.findViewById(R.id.tv_history_empty);

        rvHistory.setLayoutManager(new LinearLayoutManager(getContext()));
        db = AppDatabase.getDatabase(requireContext());

        int patientId = requireArguments().getInt("patient_id");
        patient = db.patientDao().getPatientById(patientId);

        if (patient != null) {
            tvPatientName.setText("Pasien: " + patient.namaPasien);
            loadHistory();
        }

        return view;
    }

    private void loadHistory() {
        sessions = db.screeningSessionDao().getSessionsForPatient(patient.id);
        if (sessions.isEmpty()) {
            tvEmptyState.setVisibility(View.VISIBLE);
            rvHistory.setVisibility(View.GONE);
        } else {
            tvEmptyState.setVisibility(View.GONE);
            rvHistory.setVisibility(View.VISIBLE);
            HistoryAdapter adapter = new HistoryAdapter(sessions);
            rvHistory.setAdapter(adapter);
        }
    }

    private class HistoryAdapter extends RecyclerView.Adapter<HistoryAdapter.ViewHolder> {
        private final List<ScreeningSession> list;

        HistoryAdapter(List<ScreeningSession> list) {
            this.list = list;
        }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_history, parent, false);
            return new ViewHolder(v);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
            ScreeningSession s = list.get(position);
            
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault());
            String dateStr = sdf.format(new Date(s.createdAt));
            holder.tvDate.setText("Sesi: " + dateStr);
            holder.tvSummary.setText(s.analisisGabungan);

            holder.tvRiskBadge.setText("RISIKO " + s.levelRisiko.toUpperCase());
            if (s.levelRisiko.equalsIgnoreCase("tinggi")) {
                holder.tvRiskBadge.setTextColor(android.graphics.Color.parseColor("#991B1B"));
                holder.tvRiskBadge.setBackgroundColor(android.graphics.Color.parseColor("#FEE2E2"));
            } else if (s.levelRisiko.equalsIgnoreCase("sedang")) {
                holder.tvRiskBadge.setTextColor(android.graphics.Color.parseColor("#92400E"));
                holder.tvRiskBadge.setBackgroundColor(android.graphics.Color.parseColor("#FEF3C7"));
            } else {
                holder.tvRiskBadge.setTextColor(android.graphics.Color.parseColor("#03543F"));
                holder.tvRiskBadge.setBackgroundColor(android.graphics.Color.parseColor("#DEF7EC"));
            }

            holder.btnDetails.setOnClickListener(v -> {
                ResultsFragment fragment = new ResultsFragment();
                Bundle args = new Bundle();
                args.putInt("session_id", s.id);
                fragment.setArguments(args);
                ((MainActivity) requireActivity()).loadFragment(fragment, true);
            });
        }

        @Override
        public int getItemCount() {
            return list.size();
        }

        class ViewHolder extends RecyclerView.ViewHolder {
            TextView tvDate, tvSummary, tvRiskBadge;
            Button btnDetails;

            ViewHolder(@NonNull View itemView) {
                super(itemView);
                tvDate = itemView.findViewById(R.id.tv_history_date);
                tvSummary = itemView.findViewById(R.id.tv_history_summary);
                tvRiskBadge = itemView.findViewById(R.id.tv_history_risk_badge);
                btnDetails = itemView.findViewById(R.id.btn_view_details);
            }
        }
    }
}
