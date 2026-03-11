# ⚡ TruthScan AI — Deployment Guide

## 🚀 Deploy in 5 Steps (Takes ~20 minutes)

---

### STEP 1 — Install Required Tools
Download and install these (all free):
- Node.js → https://nodejs.org (click "LTS" version)
- Git → https://git-scm.com/downloads
- VS Code → https://code.visualstudio.com (optional but helpful)

---

### STEP 2 — Create Free Accounts
- GitHub → https://github.com (click Sign Up)
- Vercel → https://vercel.com (click Sign Up with GitHub)
- Anthropic → https://console.anthropic.com (to get your API key)

---

### STEP 3 — Upload Project to GitHub
1. Go to https://github.com → click "New Repository"
2. Name it: truthscan
3. Click "Create Repository"
4. Open terminal/command prompt in the truthscan folder and run:

```
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/truthscan.git
git push -u origin main
```

---

### STEP 4 — Deploy on Vercel
1. Go to https://vercel.com
2. Click "Add New Project"
3. Click "Import" next to your truthscan repository
4. Click "Deploy" (leave all settings default)
5. Wait 1-2 minutes ✅

---

### STEP 5 — Add Your API Key (IMPORTANT!)
1. In Vercel → go to your project → Settings → Environment Variables
2. Add new variable:
   - Name: ANTHROPIC_API_KEY
   - Value: (paste your key from console.anthropic.com)
3. Click Save
4. Go to Deployments → click "Redeploy"

---

## 🎉 YOUR SITE IS LIVE!

Your URL will be: https://truthscan.vercel.app
(or whatever name you chose)

Share it anywhere — WhatsApp, Instagram, everywhere! 🌍

---

## 🔑 Get Anthropic API Key
1. Go to https://console.anthropic.com
2. Sign up for free
3. Go to "API Keys" → "Create Key"
4. Copy the key and paste in Vercel (Step 5)

Note: You get free credits on signup (~$5). After that, pay-as-you-go (~₹0.10-0.30 per analysis)

---

## 🌐 Add Custom Domain (Optional, ~₹800/year)
1. Buy domain from https://namecheap.com or https://godaddy.com
2. In Vercel → Settings → Domains → Add your domain
3. Follow DNS instructions shown by Vercel
4. Done in 5 minutes! ✅
