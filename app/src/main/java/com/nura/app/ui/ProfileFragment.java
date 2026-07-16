package com.nura.app.ui;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.nura.app.R;
import com.nura.app.database.AppDatabase;
import com.nura.app.database.Patient;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class ProfileFragment extends Fragment {
    private EditText etName;
    private EditText etDob;
    private RadioGroup rgGender;
    private Button btnSave;
    private Calendar calendar;
    private AppDatabase db;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_profile, container, false);

        etName = view.findViewById(R.id.et_name);
        etDob = view.findViewById(R.id.et_dob);
        rgGender = view.findViewById(R.id.rg_gender);
        btnSave = view.findViewById(R.id.btn_save);
        calendar = Calendar.getInstance();

        db = AppDatabase.getDatabase(requireContext());

        etDob.setOnClickListener(v -> showDatePicker());

        btnSave.setOnClickListener(v -> saveProfile());

        return view;
    }

    private void showDatePicker() {
        new DatePickerDialog(requireContext(), (view, year, month, dayOfMonth) -> {
            calendar.set(Calendar.YEAR, year);
            calendar.set(Calendar.MONTH, month);
            calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth);
            updateLabel();
        }, calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH)).show();
    }

    private void updateLabel() {
        String myFormat = "yyyy-MM-dd";
        SimpleDateFormat sdf = new SimpleDateFormat(myFormat, Locale.getDefault());
        etDob.setText(sdf.format(calendar.getTime()));
    }

    private void saveProfile() {
        String name = etName.getText().toString().trim();
        String dob = etDob.getText().toString().trim();
        int checkedGenderId = rgGender.getCheckedRadioButtonId();

        if (name.isEmpty()) {
            etName.setError("Nama tidak boleh kosong");
            return;
        }

        if (dob.isEmpty()) {
            etDob.setError("Tanggal lahir harus dipilih");
            return;
        }

        if (checkedGenderId == -1) {
            Toast.makeText(getContext(), "Pilih jenis kelamin", Toast.LENGTH_SHORT).show();
            return;
        }

        String gender = checkedGenderId == R.id.rb_male ? "L" : "P";

        Patient p = new Patient();
        p.namaPasien = name;
        p.tanggalLahir = dob;
        p.jenisKelamin = gender;
        p.createdAt = System.currentTimeMillis();

        db.patientDao().insert(p);
        Toast.makeText(getContext(), "Profil berhasil disimpan", Toast.LENGTH_SHORT).show();
        
        // Go back
        getParentFragmentManager().popBackStack();
    }
}
