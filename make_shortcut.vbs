Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "C:\Users\yusuf\Desktop\Luffa Ticket Agent.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "C:\Users\yusuf\HAgenticDashboardack\start-luffa.bat"
oLink.WorkingDirectory = "C:\Users\yusuf\HAgenticDashboardack"
oLink.Description = "Luffa Ticket Agent - Autonomous Support System"
oLink.Save
