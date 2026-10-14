package com.vibematch.app

import android.app.Application
import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import java.time.Instant
import java.util.UUID

data class AppState(
    val profile: Profile? = null, val filters: VibeFilters = VibeFilters(), val session: MovieSession? = null,
    val movies: List<Movie> = emptyList(), val matches: List<MovieMatch> = emptyList(),
    val history: List<MovieSession> = emptyList(), val participantCount: Int = 1,
    val demo: Boolean = false, val busy: Boolean = false, val error: String? = null,
    val tab: Int = 0, val setup: Boolean = false,
)

class AppViewModel(application: Application) : AndroidViewModel(application) {
    var state by mutableStateOf(AppState())
        private set
    private val api = ApiClient(BuildConfig.SERVER_URL,
        TokenStore(application, BuildConfig.SERVER_URL),
        TokenStore(application, BuildConfig.SERVER_URL + ".oauth"))
    private val preferences = application.getSharedPreferences("vibematch.sessions", Context.MODE_PRIVATE)
    private var demoMovies: List<Movie> = emptyList()
    private val demoSnapshots = mutableMapOf<String, SessionSnapshot>()
    val configured get() = api.configured

    init { if (configured) run { if (api.restore()) loadAccount() } }

    private fun run(quiet: Boolean = false, action: suspend () -> Unit) {
        if (state.busy) return
        state = state.copy(busy = true, error = if (quiet) state.error else null)
        viewModelScope.launch {
            try { action() }
            catch (error: CancellationException) { throw error }
            catch (error: Exception) {
                val unauthorized = error is ApiException && error.status == 401
                if (unauthorized) state = AppState()
                if (!quiet || unauthorized) state = state.copy(error = error.message ?: "Could not complete the request. Please try again.")
            } finally { state = state.copy(busy = false) }
        }
    }

    fun clearError() { state = state.copy(error = null) }
    fun tab(index: Int) { state = state.copy(tab = index) }
    fun setup(show: Boolean) { if (!state.busy) state = state.copy(setup = show) }
    fun filters(value: VibeFilters) { state = state.copy(filters = value) }

    fun signIn(email: String, password: String) = run {
        api.signIn(email.trim(), password)
        state = state.copy(demo = false)
        loadAccount()
    }
    fun beginGoogleSignIn(openBrowser: (String) -> Unit) = run {
        openBrowser(api.beginGoogleSignIn())
    }
    fun finishGoogleSignIn(callback: String) = run {
        api.finishGoogleSignIn(callback)
        state = state.copy(demo = false)
        loadAccount()
    }
    private suspend fun loadAccount() {
        val bootstrap = api.json.decodeFromString<Bootstrap>(api.request("bootstrap"))
        state = state.copy(profile = bootstrap.profile, filters = bootstrap.filters)
        loadHistory()
        preferences.getString("active.${bootstrap.profile.id}", null)?.let { id ->
            try { loadSession(id) }
            catch (error: ApiException) {
                if (error.status in listOf(403, 404)) preferences.edit().remove("active.${bootstrap.profile.id}").apply()
                else throw error
            }
        }
    }
    private suspend fun loadHistory() {
        state = state.copy(history = api.json.decodeFromString<SessionList>(api.request("sessions")).sessions)
    }
    private fun rememberSession() {
        val profile = state.profile ?: return
        val session = state.session ?: return
        if (!state.demo) preferences.edit().putString("active.${profile.id}", session.id).apply()
    }
    fun demo() = run {
        val fixture = getApplication<Application>().assets.open("demo.json").bufferedReader().use { it.readText() }
        demoMovies = api.json.decodeFromString<SessionSnapshot>(fixture).movies
        demoSnapshots.clear()
        state = AppState(profile = Profile("demo", "Movie matcher", "Demo account"), demo = true, busy = true)
    }
    fun create(title: String, duration: Int) = run {
        if (state.demo) {
            val room = MovieSession(UUID.randomUUID().toString(), "DEMO-LOCAL", title.ifBlank { "Movie night" }, "live",
                Instant.now().plusSeconds(duration.toLong()).toString(), duration, state.filters, false, true)
            state = state.copy(session = room, movies = demoMovies.filter { state.filters.accepts(it) }, matches = emptyList(), participantCount = 2)
        } else {
            val result = api.json.decodeFromString<SessionEnvelope>(api.request("sessions", "POST",
                api.json.encodeToString(CreateSession(title.ifBlank { "Movie night" }, duration, state.filters))))
            state = state.copy(session = result.session, movies = emptyList(), matches = emptyList(), setup = false, tab = 1)
            rememberSession(); loadSession(result.session.id)
        }
        state = state.copy(setup = false, tab = 1)
    }
    fun join(code: String) = run {
        val result = api.json.decodeFromString<SessionEnvelope>(api.request("sessions/join", "POST", api.json.encodeToString(JoinSession(code))))
        state = state.copy(session = result.session, movies = emptyList(), matches = emptyList(), tab = 1)
        rememberSession(); loadSession(result.session.id)
        state = state.copy(tab = 1)
    }
    fun open(room: MovieSession) = run {
        if (state.demo) {
            demoSnapshots[room.id]?.let { snapshot ->
                state = state.copy(session = snapshot.session, movies = snapshot.movies, matches = snapshot.matches, tab = 2)
            }
        }
        else { loadSession(room.id); state = state.copy(tab = if (room.remainingSeconds() > 0) 1 else 2) }
    }
    private suspend fun loadSession(id: String, includeMovies: Boolean = true) {
        val snapshot = api.json.decodeFromString<SessionSnapshot>(api.request("sessions/$id?includeMovies=$includeMovies"))
        state = state.copy(session = snapshot.session, participantCount = snapshot.participantCount,
            matches = snapshot.matches, movies = if (includeMovies) snapshot.movies else state.movies)
        rememberSession()
    }
    fun refresh(includeMovies: Boolean = true, quiet: Boolean = false) {
        val session = state.session ?: return
        if (!state.demo) run(quiet) { loadSession(session.id, includeMovies) }
    }
    fun swipe(intent: String) {
        val room = state.session ?: return
        val movie = state.movies.firstOrNull() ?: return
        if (room.remainingSeconds() == 0) return
        run {
            if (state.demo) {
                if (intent == "like") {
                    val perfect = movie.id in listOf("tmdb-329865", "tmdb-614934")
                    val match = MovieMatch(movie, if (perfect) "perfect" else "saved-like",
                        if (perfect) "You and the simulated partner both liked this." else "One of your liked titles in this demo.")
                    state = state.copy(matches = state.matches + match)
                }
                state = state.copy(movies = state.movies.drop(1))
                syncDemoHistory()
            } else {
                api.request("sessions/${room.id}/swipes", "POST", api.json.encodeToString(SwipeBody(movie.id, intent)))
                state = state.copy(movies = state.movies.filterNot { it.id == movie.id })
                loadSession(room.id, state.movies.isEmpty())
            }
        }
    }
    fun save() {
        val room = state.session ?: return
        run {
            if (!state.demo) api.request("sessions/${room.id}/save", "POST", api.json.encodeToString(SaveBody(!room.saved)))
            val updated = room.copy(saved = !room.saved)
            state = state.copy(session = updated)
            if (state.demo) syncDemoHistory()
            else loadHistory()
        }
    }
    fun endRound() {
        val room = state.session ?: return
        if (!room.isHost) return
        run {
            if (!state.demo) api.request("sessions/${room.id}/complete", "POST", "{}")
            state = state.copy(session = room.copy(status = "complete"), tab = 2)
            if (state.demo) syncDemoHistory()
            if (!state.demo) loadSession(room.id, false)
        }
    }
    fun signOut() = run {
        if (!state.demo) api.signOut()
        state = AppState(busy = true)
        demoSnapshots.clear()
    }

    private fun syncDemoHistory() {
        val room = state.session ?: return
        val previous = state.history.filterNot { it.id == room.id }
        if (room.saved) {
            demoSnapshots[room.id] = SessionSnapshot(room, state.participantCount, state.movies, state.matches)
            state = state.copy(history = listOf(room) + previous)
        } else {
            demoSnapshots.remove(room.id)
            state = state.copy(history = previous)
        }
    }
}
