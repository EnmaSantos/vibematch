package com.vibematch.app

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.net.URI
import java.net.HttpURLConnection

class ApiClient(private val server: String, private val store: TokenStore) {
    val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
    private val mutex = Mutex()
    private var tokens: AuthTokens? = null
    val configured: Boolean get() = runCatching {
        val url = URI(server)
        url.scheme == "https" && url.host != null && url.userInfo == null && url.query == null && url.fragment == null && !url.host.endsWith("example.com")
    }.getOrDefault(false)

    suspend fun signIn(email: String, password: String) = withContext(Dispatchers.IO) {
        mutex.withLock {
            val result = json.decodeFromString<AuthTokens>(send("auth/login", "POST", json.encodeToString(LoginBody(email, password)), null))
            store.save(result.refreshToken); tokens = result
        }
    }
    suspend fun restore(): Boolean = withContext(Dispatchers.IO) {
        mutex.withLock {
            if (store.load() == null) false else { refresh(); true }
        }
    }
    suspend fun signOut() {
        request("auth/logout", "POST", "{}")
        withContext(Dispatchers.IO) { mutex.withLock { store.clear(); tokens = null } }
    }
    suspend fun request(path: String, method: String = "GET", body: String? = null): String = withContext(Dispatchers.IO) {
        // Serialize requests and refresh rotation, including foreground/background overlap.
        mutex.withLock {
            if ((tokens?.expiresAt ?: 0.0) < System.currentTimeMillis() / 1000.0 + 30) refresh()
            try { send(path, method, body, tokens?.accessToken) }
            catch (error: ApiException) {
                if (error.status != 401) throw error
                refresh()
                send(path, method, body, tokens?.accessToken)
            }
        }
    }
    private fun refresh() {
        val refreshToken = store.load() ?: throw ApiException(401, "Please sign in again.")
        try {
            val result = json.decodeFromString<AuthTokens>(send("auth/refresh", "POST", json.encodeToString(RefreshBody(refreshToken)), null))
            store.save(result.refreshToken); tokens = result
        } catch (error: ApiException) {
            if (error.status == 401) { store.clear(); tokens = null }
            throw error
        }
    }
    private fun send(path: String, method: String, body: String?, token: String?): String {
        if (!configured) throw ApiException(503, "Configure an HTTPS VibeMatch server to sign in, or explore the demo.")
        val connection = URI(server.trimEnd('/') + "/api/mobile/v1/" + path).toURL().openConnection() as HttpURLConnection
        try {
            connection.requestMethod = method
            connection.connectTimeout = 15_000; connection.readTimeout = 30_000
            connection.instanceFollowRedirects = false
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Accept", "application/json")
            if (token != null) connection.setRequestProperty("Authorization", "Bearer $token")
            if (body != null) {
                connection.doOutput = true
                connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            }
            val status = connection.responseCode
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val result = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            if (status !in 200..299) {
                val message = runCatching { json.decodeFromString<ErrorEnvelope>(result).error }.getOrDefault("The server could not complete the request.")
                throw ApiException(status, message)
            }
            return result
        } finally { connection.disconnect() }
    }
}
