package com.nura.app.utils;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

public class AgeCalculator {
    public static class Age {
        public final int years;
        public final int months;

        public Age(int years, int months) {
            this.years = years;
            this.months = months;
        }

        public String getCategory() {
            if (years < 2) {
                return "0-2 Tahun (Balita)";
            } else if (years <= 5) {
                return "3-5 Tahun (Prasekolah)";
            } else if (years <= 12) {
                return "6-12 Tahun (Anak Sekolah)";
            } else {
                return "12-18 Tahun (Remaja)";
            }
        }
    }

    public static Age calculateAge(String dobString) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        try {
            Date dobDate = sdf.parse(dobString);
            if (dobDate == null) return new Age(0, 0);

            Calendar dob = Calendar.getInstance();
            dob.setTime(dobDate);
            Calendar today = Calendar.getInstance();

            int years = today.get(Calendar.YEAR) - dob.get(Calendar.YEAR);
            int months = today.get(Calendar.MONTH) - dob.get(Calendar.MONTH);
            int days = today.get(Calendar.DAY_OF_MONTH) - dob.get(Calendar.DAY_OF_MONTH);

            if (months < 0 || (months == 0 && days < 0)) {
                years--;
                months = 12 + months;
            }

            if (days < 0) {
                months--;
                if (months < 0) {
                    months = 11;
                    years--;
                }
            }

            return new Age(Math.max(0, years), Math.max(0, months));
        } catch (Exception e) {
            return new Age(0, 0);
        }
    }
}
