package com.incento.sdk_test_app

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.incento.sdk_test_app.ui.theme.SdktestappTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductsScreen() {
    LaunchedEffect(Unit) {
        IncentoService.hide()
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("상품") }) }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentAlignment = Alignment.Center,
        ) {
            Text("상품")
        }
    }
}

@Preview(showBackground = true)
@Composable
fun ProductsScreenPreview() {
    SdktestappTheme {
        ProductsScreen()
    }
}
