package com.nura.app.database;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;

import java.util.List;

@Dao
public interface ScreeningSessionDao {
    @Insert
    long insert(ScreeningSession session);

    @Delete
    void delete(ScreeningSession session);

    @Query("SELECT * FROM screening_sessions WHERE patient_id = :patientId ORDER BY created_at DESC")
    List<ScreeningSession> getSessionsForPatient(int patientId);

    @Query("SELECT * FROM screening_sessions ORDER BY created_at DESC")
    List<ScreeningSession> getAllSessions();

    @Query("SELECT * FROM screening_sessions WHERE id = :id LIMIT 1")
    ScreeningSession getSessionById(int id);
}
