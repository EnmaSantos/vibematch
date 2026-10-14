package com.vibematch.app

import java.io.File
import java.time.Instant
import kotlinx.serialization.json.Json
import org.junit.Assert.*
import org.junit.Test

class ContractTest {
    private fun fixture(): SessionSnapshot = Json.decodeFromString(File("../../shared/demo.json").readText())

    @Test fun sharedContractAndGenreAliases() {
        val snapshot = fixture()
        assertEquals(2, snapshot.participantCount)
        assertEquals(4, snapshot.movies.size)
        assertNull(snapshot.movies.first().posterUrl)
        val arrival = snapshot.movies.first { it.title == "Arrival" }
        assertTrue(VibeFilters(genres = listOf("Science Fiction")).accepts(arrival))
        assertFalse(VibeFilters(runtime = "Under 90 minutes").accepts(arrival))
        assertFalse(VibeFilters(animationPreference = "Animation").accepts(arrival))
    }

    @Test fun timerUsesServerExpiryAndClampsAtZero() {
        val room = fixture().session
        val start = Instant.parse("2030-01-01T00:00:00Z")
        assertEquals(180, room.remainingSeconds(start))
        assertEquals(0, room.remainingSeconds(start.plusSeconds(180)))
        assertEquals(0, room.copy(status = "complete").remainingSeconds(start))
        assertEquals(1, room.copy(expiresAt = "2030-01-01T00:03:00+00:00").remainingSeconds(start.plusMillis(179_500)))
    }
}
