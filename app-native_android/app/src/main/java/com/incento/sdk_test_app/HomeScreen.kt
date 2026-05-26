package com.incento.sdk_test_app

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.incento.sdk_test_app.ui.theme.SdktestappTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen() {
    LaunchedEffect(Unit) {
        IncentoService.show()
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("홈") }) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
        ) {
            Text("홈")
            OutlinedButton(
                onClick = { IncentoService.open() },
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(2.dp, Color.Blue),
            ) {
                Text("혜택 받기")
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
    SdktestappTheme {
        HomeScreen()
    }
}
