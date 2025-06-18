# 🚀 Deploy SafeStride on Render

## Quick Deployment Steps

### 1. **Prepare Your Repository**
- Push your code to GitHub
- Ensure all files are committed

### 2. **Deploy on Render**

1. **Go to [Render.com](https://render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**

   **Name:** `safestride-banking`
   
   **Environment:** `Node`
   
   **Build Command:** 
   ```bash
   npm install && cd frontend && npm install && npm run build && cp -r build ../backend/public && cd ../backend && npm install && npm run build
   ```
   
   **Start Command:**
   ```bash
   cd backend && npm start
   ```

5. **Click "Create Web Service"**

### 3. **Alternative Build Commands (if above doesn't work)**

**Option 1: Using build script**
```bash
chmod +x build.sh && ./build.sh
```

**Option 2: Manual step-by-step**
```bash
npm install && cd frontend && npm install && npm run build && cp -r build ../backend/public && cd ../backend && npm install && npm run build
```

**Option 3: Using npm scripts**
```bash
npm run build:render
```

### 4. **Environment Variables (Optional)**
Add these in Render dashboard:
- `NODE_ENV=production`
- `PORT=3001`

### 5. **Wait for Deployment**
- Render will automatically build and deploy your app
- You'll get a URL like: `https://safestride-banking.onrender.com`

## 🎯 Demo Credentials
- **Username:** Any username
- **Password:** Any password
- The system works in demo mode

## 🔧 Troubleshooting

### Build Fails
- Check that all dependencies are in package.json
- Ensure Node.js version is 16+ in package.json
- Try the alternative build commands above

### App Won't Start
- Verify the start command points to the correct directory
- Check that the backend/dist folder exists

### Frontend Not Loading
- Ensure the build command copies files to backend/public
- Check that the backend serves static files correctly

## 📞 Support
If you encounter issues, check:
1. Render deployment logs
2. Application logs in Render dashboard
3. GitHub repository for latest updates

---

**Your app will be live at:** `https://your-app-name.onrender.com` 