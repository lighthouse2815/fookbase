plugins {
    alias(libs.plugins.android.application)
    id("com.google.dagger.hilt.android")
}

android {
    namespace = "com.dangngulon.frontend"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.dangngulon.frontend"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    flavorDimensions += "env"

    productFlavors {
        create("dev") {
            dimension = "env"
            buildConfigField("String", "BASE_URL", "\"http://192.168.1.2:8080/\"")
        }
        create("staging") {
            dimension = "env"
            buildConfigField("String", "BASE_URL", "\"https://staging.example.com/\"")
        }
        create("prod") {
            dimension = "env"
            buildConfigField("String", "BASE_URL", "\"https://api.example.com/\"")
        }
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }



    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }


}

dependencies {
    implementation(libs.appcompat)
    implementation(libs.material)
    testImplementation(libs.junit)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)

    //noinspection NewerVersionAvailable
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    implementation("com.google.zxing:core:3.5.2")
    implementation("com.journeyapps:zxing-android-embedded:4.3.0")

    implementation("de.hdodenhof:circleimageview:3.1.0")
    implementation("androidx.coordinatorlayout:coordinatorlayout:1.2.0")

    implementation("androidx.navigation:navigation-fragment:2.7.7")
    implementation("androidx.navigation:navigation-ui:2.7.7")

    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    implementation("com.google.dagger:hilt-android:2.51.1")
    annotationProcessor("com.google.dagger:hilt-compiler:2.51.1")

    implementation("androidx.hilt:hilt-navigation-fragment:1.2.0")
    annotationProcessor("androidx.hilt:hilt-compiler:1.2.0")

    implementation("com.github.bumptech.glide:glide:4.16.0")
    annotationProcessor("com.github.bumptech.glide:compiler:4.16.0")

    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")

    implementation("com.github.NaikSoftware:StompProtocolAndroid:1.6.6")
    implementation("io.reactivex.rxjava2:rxjava:2.2.21")
    implementation("io.reactivex.rxjava2:rxandroid:2.1.1")
}