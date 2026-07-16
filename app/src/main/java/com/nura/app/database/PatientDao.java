package com.nura.app.database;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface PatientDao {
    @Insert
    long insert(Patient patient);

    @Update
    void update(Patient patient);

    @Delete
    void delete(Patient patient);

    @Query("SELECT * FROM patients ORDER BY created_at DESC")
    List<Patient> getAllPatients();

    @Query("SELECT * FROM patients WHERE id = :id LIMIT 1")
    Patient getPatientById(int id);
}
