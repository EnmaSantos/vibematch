import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

val localConfig = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) file.inputStream().use { load(it) }
}
val serverUrl = localConfig.getProperty("vibematch.serverUrl", System.getenv("VIBEMATCH_SERVER_URL") ?: "https://vibematch.enmasantos.dev")
require(serverUrl.isEmpty() || (serverUrl.startsWith("https://") && !serverUrl.contains('"') && !serverUrl.contains('\\'))) {
    "vibematch.serverUrl must be an HTTPS URL."
}
val releaseVersion = providers.gradleProperty("releaseVersion").orElse("0.1.0").get()
require(Regex("[0-9]+\\.[0-9]+\\.[0-9]+").matches(releaseVersion)) {
    "releaseVersion must use major.minor.patch (for example 0.1.0)."
}
val (major, minor, patch) = releaseVersion.split('.').map(String::toInt)
require(minor < 1000 && patch < 1000 && major <= 2147) { "releaseVersion is outside the supported versionCode range." }
val releaseCode = major * 1_000_000L + minor * 1_000L + patch
require(releaseCode in 1..Int.MAX_VALUE.toLong()) { "releaseVersion must produce a positive Android versionCode." }
val keystorePath = System.getenv("VIBEMATCH_KEYSTORE_PATH")
val keystorePassword = System.getenv("VIBEMATCH_KEYSTORE_PASSWORD")
val signingKeyPassword = System.getenv("VIBEMATCH_KEY_PASSWORD")
val signingKeyAlias = System.getenv("VIBEMATCH_KEY_ALIAS")
val hasReleaseSigning = listOf(keystorePath, keystorePassword, signingKeyPassword, signingKeyAlias).all { !it.isNullOrBlank() }

android {
    namespace = "com.vibematch.app"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.vibematch.app"
        minSdk = 26
        targetSdk = 36
        versionCode = releaseCode.toInt()
        versionName = releaseVersion
        buildConfigField("String", "SERVER_URL", "\"$serverUrl\"")
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    if (hasReleaseSigning) {
        signingConfigs {
            create("vibematchRelease") {
                storeFile = file(keystorePath!!)
                storePassword = keystorePassword
                keyAlias = signingKeyAlias
                keyPassword = signingKeyPassword
            }
        }
        buildTypes.getByName("release").signingConfig = signingConfigs.getByName("vibematchRelease")
    }
    buildFeatures { compose = true; buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    sourceSets["main"].assets.srcDir("../../shared")
    testOptions { unitTests.isReturnDefaultValues = true }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2025.12.00"))
    implementation("androidx.activity:activity-compose:1.12.2")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.10.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.10.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")
    implementation("io.coil-kt.coil3:coil-compose:3.3.0")
    implementation("io.coil-kt.coil3:coil-network-okhttp:3.3.0")
    testImplementation("junit:junit:4.13.2")
}
