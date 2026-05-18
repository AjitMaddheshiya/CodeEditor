# CodeSync Deployment Guide - Render.com

## Prerequisites
- GitHub account
- Render.com account (free tier available)
- MongoDB Atlas account (or your MongoDB connection string)

## Step 1: Push Code to GitHub

1. Initialize git repository (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub
3. Connect your local repository to GitHub:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 2: Set up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account if you don't have one
3. Create a new cluster (free tier)
4. Create a database user with username and password
5. Whitelist IP addresses (allow 0.0.0.0/0 for Render)
6. Get your connection string from Atlas Dashboard → Connect → Connect your application
7. Your connection string should look like:
   ```
   mongodb+srv://username:password@cluster0.example.mongodb.net/codesync?retryWrites=true&w=majority&appName=Cluster0
   ```

## Step 3: Deploy to Render

1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New +" → "New Web Service"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Click "Deploy" to start the deployment

## Step 4: Configure Environment Variables

After deployment starts:

1. Go to your dashboard on Render
2. Click on "codesync-server" service
3. Scroll down to "Environment Variables"
4. Add the following variable:
   - **Key**: `MONGO_URI`
   - **Value**: Your MongoDB connection string from Step 2
5. Click "Save Changes"
6. The service will automatically redeploy

## Step 5: Access Your Application

After deployment completes (usually takes 2-5 minutes):

1. Your frontend will be available at: `https://codesync-client.onrender.com`
2. Your backend will be available at: `https://codesync-server.onrender.com`

## Step 6: Test the Application

1. Open the frontend URL in your browser
2. Enter your name and click "Create New Room"
3. Share the room ID with others to collaborate in real-time

## Troubleshooting

**MongoDB Connection Error:**
- Make sure your MongoDB Atlas cluster is whitelisted for all IPs (0.0.0.0/0)
- Verify your connection string is correct
- Check that your database user has the correct permissions

**Socket.io Connection Issues:**
- Make sure both services are deployed successfully
- Check the Render logs for any errors
- Verify the environment variables are set correctly

**Build Failures:**
- Check the Render logs for specific error messages
- Make sure all dependencies are in package.json files
- Verify the render.yaml file is in the root directory

## Local Development

To run locally after deployment setup:

1. Copy `.env.example` to `.env` in both server and client directories
2. Update the `.env` files with your local configuration
3. For server: `cd server && npm install && node index.js`
4. For client: `cd client && npm install && npm run dev`

## Notes

- The free tier on Render has some limitations (spins down after inactivity)
- MongoDB Atlas free tier has 512MB storage limit
- Both services will automatically redeploy when you push to GitHub
- SSL certificates are automatically handled by Render
