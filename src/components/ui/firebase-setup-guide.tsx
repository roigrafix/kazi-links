import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Settings, Shield, Smartphone, Mail, Key } from 'lucide-react';

export function FirebaseSetupGuide() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-logoBlack">Firebase Authentication Setup Guide</h1>
        <p className="text-logoBlack/70">Complete guide to set up Firebase Authentication for your application</p>
      </div>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Prerequisites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">1</Badge>
            <span>Google/Firebase account</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">2</Badge>
            <span>Firebase project created</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">3</Badge>
            <span>Web app registered in Firebase project</span>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Firebase Console Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Step 1: Firebase Console Setup
          </CardTitle>
          <CardDescription>Create and configure your Firebase project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold">1.1 Create Firebase Project</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-logoBlack/70 ml-4">
              <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firebase Console</a></li>
              <li>Click "Create a project" or "Add project"</li>
              <li>Enter project name and follow the setup wizard</li>
              <li>Enable Google Analytics (optional)</li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold">1.2 Register Web App</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-logoBlack/70 ml-4">
              <li>In your Firebase project, click the web icon (&lt;/&gt;)</li>
              <li>Enter your app nickname</li>
              <li>Choose whether to set up Firebase Hosting (optional)</li>
              <li>Copy the Firebase configuration object</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Authentication Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Step 2: Enable Authentication Methods
          </CardTitle>
          <CardDescription>Configure the authentication providers you want to use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              2.1 Email/Password Authentication
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-logoBlack/70 ml-4">
              <li>Go to Authentication → Sign-in method</li>
              <li>Click on "Email/Password"</li>
              <li>Enable "Email/Password"</li>
              <li>Optionally enable "Email link (passwordless sign-in)"</li>
              <li>Click "Save"</li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              2.2 Phone Authentication
            </h4>
            <ul className="list-disc list-inside space-y-1 text-logoBlack/70 ml-4">
              <li>Go to Authentication → Sign-in method</li>
              <li>Click on "Phone"</li>
              <li>Enable phone authentication</li>
              <li>Add your phone numbers for testing (optional)</li>
              <li>Configure reCAPTCHA settings</li>
              <li>Click "Save"</li>
            </ul>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Note:</strong> Phone authentication requires reCAPTCHA verification in web applications. 
              Make sure to test thoroughly in your development environment.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Step 3: Environment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Step 3: Environment Configuration
          </CardTitle>
          <CardDescription>Set up your Firebase configuration in your application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold">3.1 Get Firebase Config</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-logoBlack/70 ml-4">
              <li>In Firebase Console, go to Project Settings (gear icon)</li>
              <li>Scroll down to "Your apps" section</li>
              <li>Find your web app and click the config icon</li>
              <li>Copy the configuration object</li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold">3.2 Environment Variables</h4>
            <p className="text-sm text-logoBlack/70">Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in your project root:</p>
            <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono">
              <div className="space-y-1">
                <div>VITE_FIREBASE_API_KEY=your_api_key_here</div>
                <div>VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com</div>
                <div>VITE_FIREBASE_PROJECT_ID=your_project_id</div>
                <div>VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com</div>
                <div>VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id</div>
                <div>VITE_FIREBASE_APP_ID=your_app_id</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Step 4: Testing Your Setup</CardTitle>
          <CardDescription>Verify that everything is working correctly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold">Test Checklist</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-logoBlack/70 ml-4">
              <li>✅ Email registration and login</li>
              <li>✅ Password reset functionality</li>
              <li>✅ Phone number verification (if enabled)</li>
              <li>✅ User authentication state persistence</li>
              <li>✅ Sign out functionality</li>
            </ul>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Development vs Production:</strong> Make sure to test in both development and production environments. 
              Some features like phone authentication may behave differently.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <a 
              href="https://firebase.google.com/docs/auth/web/start" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Firebase Auth Documentation
            </a>
            <a 
              href="https://firebase.google.com/docs/auth/web/phone-auth" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Phone Authentication Guide
            </a>
            <a 
              href="https://firebase.google.com/docs/auth/web/password-auth" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Email/Password Authentication
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}