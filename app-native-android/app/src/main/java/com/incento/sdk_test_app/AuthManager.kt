package com.incento.sdk_test_app

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel

class AuthManager : ViewModel() {
    var isLoggedIn by mutableStateOf(false)
        private set
    var username: String? by mutableStateOf(null)
        private set
    var selectedTab by mutableIntStateOf(0)
    var pendingWidgetOpen = false

    fun login(username: String) {
        isLoggedIn = true
        this.username = username.ifEmpty { "사용자" }
    }

    fun logout() {
        isLoggedIn = false
        username = null
    }
}
