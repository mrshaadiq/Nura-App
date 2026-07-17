# Nura App 🩺👶

**Nura App** is an innovative mobile application built with React Native (Expo) designed for the early detection, screening, and monitoring of stunting and childhood malnutrition. It features a robust **Hybrid AI** architecture, combining the speed and privacy of **On-Device Deep Learning** with the advanced clinical reasoning of **Cloud AI (Gemini, DeepSeek, and Groq)**.

---

## 📋 1. Project Summary

Nura App serves as a digital companion for parents and healthcare workers to identify early signs of malnutrition and stunting. The application guides users through a **3-step physical scan** (capturing clear, compressed images of the child's face, eyes, and nails) alongside a **dynamic, age-adaptive questionnaire**. 

### Core Pillars:
- **Hybrid AI Workflow**: Operates in **Online** mode (Gemini 2.0 Flash/Gemini 1.5 Pro & Groq for high-fidelity scanning and DeepSeek for clinical diagnosis) and falls back to **Offline** mode (executing a local MobileNetV2 model using ONNX Runtime directly on the device).
- **Local Learning Loop**: Tracks a child's clinical journey over time. By comparing a new screening with past records saved in the local **SQLite database**, Nura App determines if the child's status is **improving (membaik)**, **stable (belum membaik)**, or **worsening (memburuk)**.
- **Performance Optimized**: Automatically scales and compresses camera images into lightweight WebP format (~20KB, down from 5MB) on the fly, reducing cellular bandwidth consumption and speeding up analysis.

---

## 🛠️ 2. Architecture & Development Process

### System Architecture
The application is structured into three clean, decoupled layers:
1. **User Interface (UI) Layer**: Written in TypeScript using Expo components and custom design styles. It manages the custom routing navigation context and handles camera integrations with optimized overlay guidelines.
2. **AI & Inference Layer**: Uses a modular design (`aiSettings.ts`, `onlineRunner.ts`, `onnxRunner.ts`, `modelDownloader.ts`). It handles asynchronous downloads of the local `mobilenetv2-12.onnx` file (~45MB) and dynamically manages API fallbacks if rate limits or connection errors occur.
3. **Data Layer**: Powered by `expo-sqlite`, storing local patient profiles and screening sessions (concluding parameters, raw answers, physical image file paths, recommendations, and comparison statuses).

### Development Process
The project was built using an agile, iterative workflow focused on high-performance cross-platform development:
* **Prototyping & Migration**: Transitioned from a native Android setup to React Native Expo SDK 57 to accelerate UI iteration and unified cross-platform support.
* **On-Device AI Integration**: Integrated Microsoft's `onnxruntime-react-native` to run neural networks locally on mobile hardware, ensuring full offline capability in remote villages without internet access.
* **Robust Error Handling**: Programmed a friendly error handling pipeline that suppresses raw stack traces and automatically routes users to the offline fallback model, guaranteeing uninterrupted service.

---

## 🧰 3. Development Tools Used

- **Framework**: [React Native (Expo SDK 57)](https://expo.dev/)
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/)
- **Local Database**: [Expo SQLite (`expo-sqlite`)](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
- **On-Device AI Engine**: [ONNX Runtime React Native (`onnxruntime-react-native`)](https://onnxruntime.ai/)
- **Package Manager**: [npm / Node.js](https://nodejs.org/)
- **Code Assistants**: Antigravity (by Google DeepMind)
- **Environments & Tools**: VS Code, Android Studio, Gradle, Laragon (for API testing), Android Debug Bridge (ADB), Expo Dev Client.

---

## 🌟 4. Key Features

- **3-Step Camera Scan**: Guides the user with real-time on-screen masks to photograph the child's face, eyes, and nails.
- **AI-Generated Dynamic Questionnaire**: Tailors diagnostic questions based on the child's exact age group using DeepSeek chat API.
- **Bilingual Actionable Diagnosis**: Renders simple, non-frightening, and clear medical analysis categorized into Low, Medium, and High stunting risk.
- **Healthcare Finder (Faskes Screen)**: Renders a list of nearby clinics and health centers with quick map-navigation embeds.
- **Offline / Simulation Mode Switcher**: Lets testers and remote users test features or run physical predictions without internet coverage.
- **Educational Library**: Access local, curated articles and literature about nutrition and child development.

---

## 🚀 5. Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- Expo Go application installed on your Android/iOS device or an emulator configured (Android Studio).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/mrshaadiq/Nura-App.git
   cd Nura-App
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Set up environment variables in `ai/env.ts` (create the file if it doesn't exist):
   ```typescript
   export const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
   export const DEEPSEEK_API_KEY = "YOUR_DEEPSEEK_API_KEY";
   export const GROQ_API_KEY = "YOUR_GROQ_API_KEY";
   ```

### Running the App
- Run the Expo development bundler:
  ```bash
  npm start
  ```
- Run on Android emulator or connected device via ADB:
  ```bash
  npm run android
  ```
