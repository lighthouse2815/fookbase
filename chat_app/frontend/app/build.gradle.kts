plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.hilt.android)
}

val googleWebClientId = (providers.gradleProperty("GOOGLE_WEB_CLIENT_ID").orNull ?: "").trim()

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
            buildConfigField("String", "BASE_URL", "\"https://interacthub-java-api-hqash7cvg0eubkee.japanwest-01.azurewebsites.net/\"")
            buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"$googleWebClientId\"")
            manifestPlaceholders["usesCleartextTraffic"] = "false"
        }
        create("staging") {
            dimension = "env"
            buildConfigField("String", "BASE_URL", "\"https://interacthub-java-api-hqash7cvg0eubkee.japanwest-01.azurewebsites.net/\"")
            buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"$googleWebClientId\"")
            manifestPlaceholders["usesCleartextTraffic"] = "false"
        }
        create("prod") {
            dimension = "env"
            buildConfigField("String", "BASE_URL", "\"https://interacthub-java-api-hqash7cvg0eubkee.japanwest-01.azurewebsites.net/\"")
            buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"$googleWebClientId\"")
            manifestPlaceholders["usesCleartextTraffic"] = "false"
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
    testImplementation(libs.core.testing)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)

    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.gson)
    implementation(libs.okhttp.logging.interceptor)

    implementation(libs.zxing.core)
    implementation(libs.zxing.android.embedded)

    implementation(libs.circleimageview)
    implementation(libs.coordinatorlayout)

    implementation(libs.navigation.fragment)
    implementation(libs.navigation.ui)

    implementation(libs.security.crypto)

    implementation(libs.hilt.android)
    annotationProcessor(libs.hilt.compiler)

    implementation(libs.androidx.hilt.navigation.fragment)
    annotationProcessor(libs.androidx.hilt.compiler)

    implementation(libs.glide)
    annotationProcessor(libs.glide.compiler)

    coreLibraryDesugaring(libs.desugar.jdk.libs)

    implementation(libs.stomp.protocol.android)
    implementation(libs.rxjava)
    implementation(libs.rxandroid)
    implementation(libs.play.services.auth)
}
