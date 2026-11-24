param (
    [Parameter(Mandatory=$true)]
    [string]$ImagePath
)

try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime -ErrorAction SilentlyContinue
    Add-Type -AssemblyName System.Drawing -ErrorAction SilentlyContinue

    [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
    [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime] | Out-Null
    [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null
    [Windows.Storage.Streams.DataWriter, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null

    if (-not (Test-Path $ImagePath)) {
        Write-Output "--- OCR TEXT BEGIN ---`n--- OCR TEXT END ---"
        exit 0
    }

    $bytes = [System.IO.File]::ReadAllBytes($ImagePath)

    $randomAccessStream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
    $writer = [Windows.Storage.Streams.DataWriter]::new($randomAccessStream)
    $writer.WriteBytes($bytes)

    $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]

    function AwaitTask($WinRtOp, $ResultType) {
        $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
        $netTask = $asTask.Invoke($null, @($WinRtOp))
        $netTask.Wait(10000) | Out-Null
        return $netTask.Result
    }

    AwaitTask ($writer.StoreAsync()) ([System.UInt32]) | Out-Null
    $randomAccessStream.Seek(0)

    $decoder = AwaitTask ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($randomAccessStream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = AwaitTask ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])

    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if (-not $engine) {
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new("en-US"))
    }

    $ocrResult = AwaitTask ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

    Write-Output "--- OCR TEXT BEGIN ---"
    Write-Output $ocrResult.Text
    Write-Output "--- OCR TEXT END ---"
} catch {
    Write-Output "--- OCR TEXT BEGIN ---`n--- OCR TEXT END ---"
}
