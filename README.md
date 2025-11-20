# Uncertainty-Aware Deep Learning for Non-Invasive Anaemia Screening Using Palpebral Conjunctiva Images

**In25-S2-CS5801 - Advanced AI**
**Master Of Data Science & AI**
**Department of Computer Science & Engineering, University Of Moratuwa, Sri Lanka**

## Team Members
- **Name:** KDY Bandara | **Index:** 258723G
- **Name:** AMNDS Adhikari | **Index:** 258722D

---

## 1. Background and Introduction
Anaemia is a prevalent haematological disorder affecting approximately 1.6 billion people worldwide. It is characterized by reduced haemoglobin (Hb) or red blood cells. Early detection is crucial to prevent complications like fatigue, impaired cognitive function, and pregnancy complications.

The current gold standard for diagnosis involves invasive blood sampling and laboratory analysis, which can be costly and inaccessible in resource-limited settings. While clinicians often check for conjunctival pallor (paleness of the lower eyelid), this method is subjective and unreliable.

This project proposes a **non-invasive, image-based screening tool** utilizing Deep Learning and Computer Vision. By analyzing photos of the palpebral conjunctiva taken with smartphones, the system estimates haemoglobin levels or classifies patients as anaemic. Crucially, it incorporates **uncertainty quantification** to flag uncertain cases for professional review, ensuring safety and reliability.

## 2. Problem Statement
Conventional Anaemia diagnosis faces significant barriers:
- **Invasiveness:** Requires blood sampling.
- **Resource Constraints:** Needs trained personnel and lab infrastructure.
- **Subjectivity:** Visual assessment by doctors varies by experience, lighting, and patient skin tone.

Existing AI approaches often lack:
- **Robustness:** Performance degrades with variable lighting or cameras.
- **Confidence Estimation:** Most models don't say "I don't know," risking false reassurance.
- **Interpretability:** Black-box models don't show *why* a prediction was made.

Our goal is to build a system that is **robust**, **uncertainty-aware**, and **interpretable**.

## 3. Proposed Method

### 3.1 Data Acquisition & Preprocessing
- **ROI Extraction:** Automatically identifying the palpebral conjunctiva.
- **Color Normalization:** Handling lighting and device variability using histogram equalization or color constancy algorithms.

### 3.2 Model Architecture
- **Backbone:** EfficientNet or Vision Transformer (ViT).
- **Multi-Task Learning:**
    - Classification (Anaemic vs. Non-Anaemic).
    - Regression (Haemoglobin level estimation).
- **Loss Functions:** Binary cross-entropy (classification) and MSE (regression).

### 3.3 Uncertainty Estimation
- **Monte Carlo Dropout:** Estimating epistemic uncertainty by running multiple stochastic forward passes.
- **Selective Prediction:** Automatically referring low-confidence cases to human experts.

### 3.4 Explainability
- **Grad-CAM:** Visualizing attention maps to ensure the model focuses on vascularized conjunctival areas, not irrelevant background.

## 4. Available Datasets
This project utilizes public datasets for training and evaluation:
- **CP-AnemiC:** 710 images with Hb annotations (Ghana).
- **Eyes-Defy-Anemia:** 218 images for binary classification.
- **Harvard Dataverse:** 94 observations with clinical Hb data.
- **Kaggle Datasets:** Various collections of conjunctiva images.

## 5. Tech Stack
- **Frontend / Web Interface:** Next.js, React, Tailwind CSS
- **Deep Learning:** Python, PyTorch/TensorFlow (Planned)
- **Computer Vision:** OpenCV

---

## 6. Getting Started (Frontend)

This repository contains the web interface for the project.

### Prerequisites
- Node.js installed
- npm, yarn, pnpm, or bun

### Installation & Run

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

---

## 7. References
1. Nardone DA, et al. (2019). Accuracy of physical examination for Anaemia detection: a systematic review. *JAMA Intern Med*.
2. Luby SP, et al. (1995). Using clinical signs to diagnose Anaemia in African children. *Bull World Health Organ*.
3. Sinha N, et al. (2013). Non-invasive screening for Anaemia using conjunctival images and colour analysis. *Proc. IEEE EMBC*.
4. Luo H, et al. (2019). Deep learning for Anaemia detection using smartphone conjunctiva images. *Comput Methods Programs Biomed*.
5. Rahman A, et al. (2020). Transfer learning for smartphone-based Anaemia detection from eye images. *IEEE Access*.
6. Kwarteng A, et al. (2023). CP-AnemiC: Conjunctival Pallor Image Dataset for Anaemia Detection in Children. *Data in Brief*.
7. Gal Y, Ghahramani Z. (2016). Dropout as a Bayesian approximation. *ICML*.
