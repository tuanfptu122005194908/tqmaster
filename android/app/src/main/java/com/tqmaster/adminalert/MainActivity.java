package com.tqmaster.adminalert;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "TQMasterAdmin";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 1. Prevent any uncaught background exception from killing the app process
        installCrashProtection();

        // 2. Safely initialize fallback Firebase if google-services.json is missing
        ensureFirebaseInitialized();

        // 3. Normal BridgeActivity lifecycle
        super.onCreate(savedInstanceState);

        try {
            // Private admin app: block screenshots, screen recording and recents thumbnail.
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        } catch (Exception ignored) {
        }
    }

    private void installCrashProtection() {
        try {
            Thread.UncaughtExceptionHandler originalHandler = Thread.getDefaultUncaughtExceptionHandler();
            Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
                String msg = throwable != null ? throwable.toString() : "";
                if (msg.contains("Firebase") || msg.contains("google-services") || msg.contains("PushNotifications") || msg.contains("NotificationChannel")) {
                    Log.e(TAG, "Gracefully suppressed background exception on thread [" + thread.getName() + "]: " + msg);
                    return;
                }
                if (originalHandler != null) {
                    originalHandler.uncaughtException(thread, throwable);
                }
            });
        } catch (Throwable t) {
            Log.w(TAG, "Failed to set UncaughtExceptionHandler", t);
        }
    }

    private void ensureFirebaseInitialized() {
        try {
            Class<?> firebaseAppClass = Class.forName("com.google.firebase.FirebaseApp");
            Method getAppsMethod = firebaseAppClass.getMethod("getApps", Context.class);
            List<?> apps = (List<?>) getAppsMethod.invoke(null, this);
            if (apps == null || apps.isEmpty()) {
                int resId = getResources().getIdentifier("google_app_id", "string", getPackageName());
                if (resId == 0) {
                    // google-services.json was not provided at build time.
                    // Initialize a fallback FirebaseApp so FirebaseMessaging.getInstance() does not crash.
                    Class<?> builderClass = Class.forName("com.google.firebase.FirebaseOptions$Builder");
                    Constructor<?> constructor = builderClass.getDeclaredConstructor();
                    Object builder = constructor.newInstance();

                    builderClass.getMethod("setApplicationId", String.class).invoke(builder, "com.tqmaster.adminalert");
                    builderClass.getMethod("setProjectId", String.class).invoke(builder, "tqmaster-adminalert");
                    builderClass.getMethod("setApiKey", String.class).invoke(builder, "AIzaSyDummyKeyForGracefulInitialization");
                    builderClass.getMethod("setGcmSenderId", String.class).invoke(builder, "123456789012");

                    Object options = builderClass.getMethod("build").invoke(builder);
                    Class<?> optionsClass = Class.forName("com.google.firebase.FirebaseOptions");
                    firebaseAppClass.getMethod("initializeApp", Context.class, optionsClass).invoke(null, this, options);
                    Log.i(TAG, "Fallback FirebaseApp initialized successfully (no google-services.json)");
                }
            }
        } catch (Throwable t) {
            Log.w(TAG, "Firebase safe init check: " + t.getMessage());
        }
    }
}
