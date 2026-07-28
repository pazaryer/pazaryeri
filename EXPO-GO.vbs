' Pazaryeri - Expo Go QR (proje klasorunden)
Option Explicit

Dim fso, shell, scriptDir, mobileDir, pnpm, cmd

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
mobileDir = scriptDir & "\artifacts\mobile"

If Not fso.FileExists(mobileDir & "\package.json") Then
  MsgBox "HATA: Mobil klasor bulunamadi." & vbCrLf & vbCrLf & mobileDir, vbCritical, "Pazaryeri Expo Go"
  WScript.Quit 1
End If

pnpm = shell.ExpandEnvironmentStrings("%APPDATA%\npm\pnpm.cmd")
If Not fso.FileExists(pnpm) Then
  pnpm = "pnpm"
End If

cmd = "cmd /k ""cd /d """ & mobileDir & """ && title Pazaryeri Expo Go && echo. && echo  QR kodu Expo Go ile okutun... && echo. && """ & pnpm & """ exec expo start --clear"""

shell.Run cmd, 1, False
