package com.incento.sdk_test_app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.res.painterResource
import com.incento.sdk_test_app.ui.theme.SdktestappTheme

class MainActivity : ComponentActivity() {
    private val auth by viewModels<AuthManager>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        IncentoService.on("loginRequired") {
            auth.pendingWidgetOpen = true
            IncentoService.hide()
            auth.selectedTab = 2
        }

        setContent {
            SdktestappTheme {
                LaunchedEffect(auth.isLoggedIn) {
                    bootIncento()
                }
                SdktestappApp(auth = auth)
            }
        }
    }

    private fun bootIncento() {
        val shouldOpen = auth.pendingWidgetOpen && auth.isLoggedIn
        auth.pendingWidgetOpen = false
        IncentoService.shutdown()
        IncentoService.boot(
            activity = this,
            apiKey = BuildConfig.INCENTO_API_KEY,
            userId = auth.username,
            userCreatedAt = mockUserCreatedAt(auth.username),
            pagePath = "/",
            visible = auth.isLoggedIn,
            autoOpen = shouldOpen,
            debug = true,
        )
    }

    // 독립몰 자체 회원 DB를 시뮬레이션합니다.
    // 실제 서비스에서는 고객사 백엔드/세션에서 회원의 원래 가입 일시를 읽어와 전달합니다.
    // 알려진 기존 회원이면 가입 일시(예시 A: 2년 전)를, 신규 회원이면 null을 반환합니다.
    private fun mockUserCreatedAt(userId: String?): String? = when (userId) {
        "member_001" -> "2023-03-15T09:30:00+09:00"
        else -> null
    }
}

@Composable
fun SdktestappApp(auth: AuthManager) {
    var currentDestination by rememberSaveable { mutableStateOf(AppDestinations.HOME) }

    // auth.selectedTab 변경(loginRequired 등)을 currentDestination에 반영
    LaunchedEffect(auth.selectedTab) {
        currentDestination = AppDestinations.entries[auth.selectedTab]
    }

    // 화면 전환 시 현재 경로를 SDK에 전달 → 새 경로의 세션 재생성
    LaunchedEffect(currentDestination, auth.isLoggedIn) {
        IncentoService.setPath(when (currentDestination) {
            AppDestinations.HOME -> "/"
            AppDestinations.PRODUCTS -> "/products"
            AppDestinations.MYPAGE -> if (auth.isLoggedIn) "/mypage" else "/login"
        })
    }

    NavigationSuiteScaffold(
        navigationSuiteItems = {
            AppDestinations.entries.forEach { dest ->
                item(
                    icon = {
                        Icon(
                            painterResource(dest.icon),
                            contentDescription = dest.label,
                        )
                    },
                    label = { Text(dest.label) },
                    selected = dest == currentDestination,
                    onClick = {
                        currentDestination = dest
                        auth.selectedTab = AppDestinations.entries.indexOf(dest)
                    }
                )
            }
        }
    ) {
        when (currentDestination) {
            AppDestinations.HOME -> HomeScreen()
            AppDestinations.PRODUCTS -> ProductsScreen()
            AppDestinations.MYPAGE -> MyPageScreen(auth = auth)
        }
    }
}

enum class AppDestinations(val label: String, val icon: Int) {
    HOME("홈", R.drawable.ic_home),
    PRODUCTS("상품", R.drawable.ic_favorite),
    MYPAGE("My", R.drawable.ic_account_box),
}
