# Uncertainty-Aware Deep Learning for Non-Invasive Anaemia Screening  
### MSc – In25-S2-CS5801: Advanced AI  
**Master of Data Science & AI**  
Department of Computer Science & Engineering  
University of Moratuwa, Sri Lanka

---

## 👥 Team Members
- **K.D.Y. Bandara** — Index: **258723G**  
- **A.M.N.D.S. Adhikari** — Index: **258722D**

---

# 1. 📘 Background and Introduction

Anaemia is a major global health issue affecting more than **1.6 billion people worldwide**. It is caused by reduced haemoglobin (Hb) levels and can lead to fatigue, cognitive impairment, reduced work capacity, and pregnancy complications.

Conventional diagnosis requires:
- Invasive **blood sampling**
- Laboratory Hb measurement
- Skilled medical personnel

This makes early detection difficult in **low-resource environments**.

Clinicians sometimes examine the **palpebral conjunctiva** (inner eyelid) for pallor, but this method is:
- Highly **subjective**
- Affected by lighting and skin tone  
- Not reliable for screening

---

# 🚀 Project Goal

We develop a **non-invasive anaemia screening system** using **deep learning** to analyze conjunctival images.  
The system predicts:

- **Anaemia probability** (classification)  
- **Haemoglobin concentration** (regression)  
- **Uncertainty estimation** (confidence-aware predictions)

A **web-based dashboard** was also developed for real-time use.

---

# 2. 🎯 Problem Statement

Existing diagnosis and AI systems have limitations:

### 🩸 Medical Challenges
- Invasive and uncomfortable  
- Requires laboratory infrastructure  
- Not available in rural/low-income areas  

### 🤖 AI Challenges
- Sensitive to lighting and camera variations  
- Most models **do not quantify uncertainty**  
- Lack interpretability (why was a decision made?)

---

# 3. 🧠 Proposed Method

## 3.1 📷 Dataset and Preprocessing
This project uses the **CP-AnemiC dataset (Ghana)**  
- 710 conjunctival images  
- True haemoglobin measurements  
- Binary anaemia labels  
- Stratified train/validation split  
- Standard preprocessing (resize, normalize, augment)

## 3.2 🏗 Model Architecture
We implemented a **multi-task EfficientNet-B0** model (PyTorch):

- Shared EfficientNet backbone  
- **Classification head** → Anaemic / Non-Anaemic  
- **Regression head** → Hb estimation (g/dL)  
- Dropout for generalization + uncertainty sampling

## 3.3 🔍 Uncertainty Estimation
**Monte Carlo Dropout**:
- Dropout is activated during inference  
- Model produces multiple stochastic predictions  
- Standard deviation = **epistemic uncertainty**  

Used to flag “low confidence” cases.

## 3.4 ❄ Probability Calibration  
To improve the trustworthiness of predictions, the model uses:

- **Temperature Scaling**  
- Evaluated with **Expected Calibration Error (ECE)**

## 3.5 🩻 Explainability
To ensure medical reliability, **Grad-CAM** heatmaps visualize attention regions:

- Highlights vascular conjunctival tissue  
- Ensures model focuses on meaningful anatomy

---

# 4. 📊 Model Performance

Final validation results from CP-AnemiC:

| Metric | Value |
|-------|-------|
| **ROC–AUC** | **0.8795** |
| **F1-score** | **0.8191** |
| **Accuracy** | **0.7606** |
| **MAE (Hb)** | **1.7234 g/dL** |
| **RMSE (Hb)** | **4.9011 g/dL** |
| **ECE** | **0.2585** |

The model achieves **strong classification**, **acceptable Hb estimation**, and **moderate calibration**, suitable for screening.

---

# 5. 🌐 Web-Based Dashboard (Frontend)

A fully interactive **Next.js + React + Tailwind CSS** dashboard was created to demonstrate real-time use.

🔗 **Live Demo:** https://deegayua.github.io/anemia-ai/

### Features:
- Step-by-step onboarding (name, age, gender)
- Camera-based conjunctiva scanning
- Real-time UI animations and feedback
- Hb input (optional)
- Scan progress & failure handling
- Final anaemia report with:
  - Risk level
  - Confidence
  - Estimated Hb value
  - Interpretation

The dashboard is designed as a prototype for potential clinical deployment.

---

# 6. 🛠 Tech Stack

### **Machine Learning & Backend**
- Python  
- PyTorch  
- Torchvision  
- OpenCV  
- NumPy / Pandas  

### **Frontend / Deployment**
- Next.js  
- React  
- Tailwind CSS  
- TypeScript  
- GitHub Pages (static hosting)

---

# 7. 🚀 Getting Started (Frontend Only)

### 📦 Install Dependencies
```bash
npm install
# or
yarn install

---

# 8. 🧪 Model Training (Colab)

The training code for the anaemia screening model is provided as a Google Colab–ready notebook.

### 🔹 Training Notebook
- **File:** `0_Animea_Model_Train.ipynb`  
- This notebook contains the full training pipeline:
  - CP-AnemiC data loading and preprocessing  
  - Multi-task EfficientNet-B0 model definition  
  - Training loops for classification + Hb regression  
  - Evaluation (ROC–AUC, F1, MAE, RMSE, ECE)  
  - Grad-CAM and uncertainty estimation

### 🔹 Dataset Location
- The **CP-AnemiC dataset** (images + labels) should be placed inside the **`model_training`** folder (or mounted from Google Drive in the same structure).
- The notebook assumes the dataset is available under this folder when running in Colab.

### ▶ How to Run in Google Colab

1. Upload the `model_training` folder (including the CP-AnemiC dataset) and `0_Animea_Model_Train.ipynb` to your Google Drive.  
2. Open `0_Animea_Model_Train.ipynb` in **Google Colab**.  
3. Update any dataset paths if necessary (e.g. to your Drive mount point).  
4. Run all cells (`Runtime → Run all`) to:
   - Train the model  
   - Save the best-performing weights  
   - Generate evaluation metrics and plots

The trained model can then be exported and integrated with the web dashboard for inference.

## 📚 References

[1] D. A. Nardone, K. M. Roth, D. J. Mazur, and J. H. McAfee,  
"Accuracy of physical examination for anaemia detection: A systematic review,"  
*JAMA Internal Medicine*, vol. 179, no. 5, pp. 671–678, 2019.

[2] S. P. Luby, P. N. Kazembe, and S. C. Redd,  
"Using clinical signs to diagnose anaemia in African children,"  
*Bulletin of the World Health Organization*, vol. 73, no. 4, pp. 477–482, 1995.

[3] N. Sinha, A. Deshpande, and A. Shah,  
"Non-invasive screening for anaemia using conjunctival images and colour analysis,"  
in *Proc. IEEE Engineering in Medicine and Biology Conference (EMBC)*, 2013.

[4] H. Luo, H. Lee, and M. Nguyen,  
"Deep learning for anaemia detection using smartphone conjunctiva images,"  
*Computer Methods and Programs in Biomedicine*, vol. 182, p. 105039, 2019.

[5] A. Rahman, M. Islam, and S. Saha,  
"Transfer learning for smartphone-based anaemia detection from eye images,"  
*IEEE Access*, vol. 8, pp. 176246–176257, 2020.

[6] A. Kwarteng, S. Afriyie, J. K. Amuah, and S. Bedu-Addo,  
"CP-AnemiC: Conjunctival Pallor Image Dataset for Anaemia Detection in Children,"  
*Data in Brief*, vol. 48, p. 109005, 2023.

[7] H. Fartale,  
"Eyes-Defy-Anaemia: Palpebral Conjunctiva Dataset,"  
*Kaggle*, 2022. Available: https://www.kaggle.com/

[8] S. Sriram, A. K. Rajendran, and V. Balakrishnan,  
"Colour calibration and domain adaptation for robust smartphone-based anaemia screening,"  
*Sensors*, vol. 22, no. 11, p. 4082, 2022.

[9] Y. Gal and Z. Ghahramani,  
"Dropout as a Bayesian approximation: Representing model uncertainty in deep learning,"  
in *Proc. International Conference on Machine Learning (ICML)*, 2016.

[10] C. Guo, G. Pleiss, Y. Sun, and K. Q. Weinberger,  
"On calibration of modern neural networks,"  
in *Proc. International Conference on Machine Learning (ICML)*, 2017.
