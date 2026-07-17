# Project Submission Document: Nura App

This document fulfills the submission requirements for the project.

---

## 1. Project Summary

**Nura App** is an innovative mobile application designed for the early detection and monitoring of stunting and childhood malnutrition. Built with a robust **Hybrid AI** architecture, Nura App combines the speed and privacy of **On-Device Deep Learning** (using a local MobileNetV2 ONNX model) with the advanced clinical reasoning of **Cloud AI** (powered by DeepSeek, Gemini, and Groq APIs). The app provides parents and healthcare workers with a 3-step physical scan (eyes, nails, face) combined with dynamic, age-adaptive health questionnaires. It records clinical history in a local SQLite database, establishing a "Local Learning Loop" that evaluates whether a child's nutritional condition is improving, stable, or worsening over time.

---

## 2. Development Process & Architecture

The project was architected as a cross-platform mobile application using **React Native (Expo)** to ensure rapid development and native compilation for Android. The architecture is split into three main layers:
1. **User Interface (UI) Layer**: Screens for patient profiling, questionnaire intake, guided camera scanning, and detailed clinical reports. Built using custom styles and optimized for high-resolution cameras using automated WebP/JPEG image compression (scaling images down to 600px width at 60% quality, reducing file sizes from ~5MB to ~20KB).
2. **AI & Inference Layer**: A modular hybrid runner (`aiSettings.ts`, `onlineRunner.ts`, `onnxRunner.ts`). Online analysis leverages **Gemini 1.5 Pro** and **Groq Vision** for high-precision eye, nail, and face scans, **DeepSeek (deepseek-chat)** for dynamic question generation and integrated clinical diagnosis, and falls back to a local **ONNX Runtime** executing an on-device MobileNetV2 model for offline scenarios.
3. **Data Layer**: A local SQLite database managed by Expo SQLite that securely stores patient profiles and screening sessions.

### Development Tools Used:
* **Framework**: React Native & Expo SDK 57
* **Database**: SQLite (via `expo-sqlite`)
* **AI Runtime**: ONNX Runtime React Native (`onnxruntime-react-native`)
* **Package Managers**: npm & Node.js
* **Development Environments**: Visual Studio Code, Laragon, Android Studio / Gradle
* **Testing & Device Connection**: Android Debug Bridge (ADB), Expo Development Client

---

## 3. Public Development & Source Control

All source code, version history, and development work are hosted publicly in the following GitHub repository:
* **Repository Link**: [https://github.com/mrshaadiq/Nura-App](https://github.com/mrshaadiq/Nura-App)

*Note: The repository contains the complete commit history, including recent integrations of DeepSeek API, visual model upgrades to Gemini Pro, and offline diagnostic fallback logic.*

---

## 4. Materials Disclosure

### i. AI Usage Disclosure
Artificial Intelligence was utilized in both the development and the runtime capabilities of this project:
* **Development Phase**: The codebase was constructed and optimized with the assistance of **Antigravity (by Google DeepMind)**, an AI coding assistant. Code generation, type-safety refactoring (fixing TypeScript compilation errors), and debugging were AI-assisted.
* **Runtime Capabilities**:
  * **DeepSeek API (`deepseek-chat`)**: Generates dynamic, age-appropriate medical screening questions and performs the final integrated clinical diagnosis.
  * **Google Gemini API (`gemini-1.5-pro` / `gemini-2.0-flash`) & Groq Vision**: Performs visual clinical inspection on base64-encoded images of the child's eyes, nails, and face.
  * **On-Device ONNX**: Runs a local neural network on the phone to enable basic visual feature extraction offline.

### ii. Third-Party & Copyrighted Materials
The project utilizes the following open-source resources, library components, and models, which are credited to their respective owners:
* **MobileNetV2 ONNX Model (`mobilenetv2-12.onnx`)**: Sourced from the official **ONNX Model Zoo** (MIT License). This pre-trained deep learning model is used for local offline feature classification.
* **Expo SDK and React Native Libraries**: Standard open-source software libraries under the MIT License, including `expo-camera`, `expo-file-system`, `expo-image-manipulator`, and `onnxruntime-react-native` (developed by Microsoft, MIT License).
* **Medical Icons & Typography**: Sourced from system fonts and standard React Native vector icon libraries (SIL Open Font License / MIT).
