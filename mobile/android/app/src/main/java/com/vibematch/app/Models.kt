package com.vibematch.app

import kotlinx.serialization.Serializable
import java.time.Instant
import java.time.Year
import kotlin.math.ceil

@Serializable
data class VibeFilters(
    val moods: List<String> = listOf("Cozy", "Funny"),
    val runtime: String = "Anything",
    val genres: List<String> = emptyList(),
    val releaseAge: String = "Any year",
    val animationPreference: String = "Either",
) {
    fun accepts(movie: Movie, year: Int = Year.now().value): Boolean {
        fun canonical(value: String) = value.lowercase().replace("sci-fi", "science fiction")
        if (genres.isNotEmpty() && movie.genres.none { canonical(it) in genres.map(::canonical) }) return false
        if (runtime == "Under 90 minutes" && movie.runtimeMinutes >= 90) return false
        if (runtime == "Under 2 hours" && movie.runtimeMinutes > 120) return false
        val animated = "Animation" in movie.genres
        if (animationPreference == "Animation" && !animated) return false
        if (animationPreference == "Live action" && animated) return false
        val minimum = when (releaseAge) {
            "New/recent" -> 2024
            "Last 5 years" -> year - 5
            "2000s and newer" -> 2000
            "90s and newer" -> 1990
            else -> 0
        }
        return (movie.year.toIntOrNull() ?: year) >= minimum
    }
    companion object {
        val moods = listOf("Cozy", "Funny", "Romantic", "Scary", "Intense", "Mind-bending", "Comfort watch", "Background watch", "Actually pay attention")
        val genres = listOf("Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "Thriller", "War", "Western")
        val runtimes = listOf("Under 90 minutes", "Under 2 hours", "Anything")
        val releases = listOf("New/recent", "Last 5 years", "2000s and newer", "90s and newer", "Classics are fine", "Any year")
        val animations = listOf("Live action", "Animation", "Either")
    }
}
@Serializable data class WatchProvider(val name: String, val type: String, val lastCheckedAt: String)
@Serializable data class Movie(
    val id: String, val title: String, val overview: String, val posterUrl: String?, val year: String,
    val runtimeMinutes: Int, val genres: List<String>, val rating: Double, val providers: List<WatchProvider>,
)
@Serializable data class Profile(val id: String, val displayName: String, val email: String)
@Serializable data class MovieSession(
    val id: String, val code: String, val title: String, val status: String, val expiresAt: String?,
    val durationSeconds: Int, val filters: VibeFilters, val saved: Boolean, val isHost: Boolean,
) {
    fun remainingSeconds(now: Instant = Instant.now()): Int {
        if (status != "live" || expiresAt == null) return 0
        val expiry = runCatching { Instant.parse(expiresAt) }.getOrNull() ?: return 0
        val seconds = ceil((expiry.toEpochMilli() - now.toEpochMilli()) / 1000.0).toInt()
        return seconds.coerceIn(0, durationSeconds)
    }
}
@Serializable data class MovieMatch(val movie: Movie, val kind: String, val reason: String) {
    val label get() = when (kind) { "perfect" -> "Perfect match"; "almost" -> "Almost a match"; else -> "Liked title" }
}
@Serializable data class Bootstrap(val profile: Profile, val filters: VibeFilters)
@Serializable data class SessionEnvelope(val session: MovieSession)
@Serializable data class SessionList(val sessions: List<MovieSession>)
@Serializable data class SessionSnapshot(val session: MovieSession, val participantCount: Int, val movies: List<Movie>, val matches: List<MovieMatch>)
@Serializable data class AuthTokens(val accessToken: String, val refreshToken: String, val expiresAt: Double)
@Serializable data class Acknowledgement(val ok: Boolean)
@Serializable data class ErrorEnvelope(val error: String)
@Serializable data class LoginBody(val email: String, val password: String)
@Serializable data class RefreshBody(val refreshToken: String)
@Serializable data class CreateSession(val title: String, val durationSeconds: Int, val filters: VibeFilters)
@Serializable data class JoinSession(val code: String)
@Serializable data class SwipeBody(val movieId: String, val intent: String)
@Serializable data class SaveBody(val saved: Boolean)
class ApiException(val status: Int, message: String) : Exception(message)
