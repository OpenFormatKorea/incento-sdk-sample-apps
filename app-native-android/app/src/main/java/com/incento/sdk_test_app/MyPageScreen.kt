package com.incento.sdk_test_app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.incento.sdk_test_app.ui.theme.SdktestappTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyPageScreen(auth: AuthManager) {
    LaunchedEffect(auth.isLoggedIn) {
        if (auth.isLoggedIn) IncentoService.show() else IncentoService.hide()
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("마이페이지") }) }
    ) { innerPadding ->
        if (auth.isLoggedIn) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
            ) {
                Text(
                    text = "안녕하세요, ${auth.username}님!",
                    style = MaterialTheme.typography.titleMedium,
                )
                OutlinedButton(
                    onClick = { auth.logout() },
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.error,
                    ),
                ) {
                    Text("로그아웃")
                }
            }
        } else {
            Box(modifier = Modifier.padding(innerPadding)) {
                LoginScreen(auth = auth)
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun MyPageScreenPreview() {
    SdktestappTheme {
        MyPageScreen(AuthManager())
    }
}
