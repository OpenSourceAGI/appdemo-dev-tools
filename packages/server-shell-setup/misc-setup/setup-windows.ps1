# Windows Powershell configuration file
# notepad $PSHOME\Profile.ps1 and save this as the file 

# Windows Powershell Dev Tools
function setup_Run {

    #shell tools
    winget install Neovim.Neovim.Nightly
    winget install 7zip.7zip 
    winget install Git.Git 
    winget install Microsoft.WindowsTerminal.Preview
    winget install Giorgiotani.Peazip  
    winget install Starship.Starship
    winget install DEVCOM.JetBrainsMonoNerdFont
    winget install CoreyButler.NVMforWindows
    winget install nushell

    #interface apps
    winget install Microsoft.VisualStudioCode
    winget install Chocolatey.Chocolatey
    winget install Google.Chrome
    winget install GitHub.GitHubDesktop

    #node bun
    nvm install node
    npm i -g pnpm 
    powershell -c "irm bun.sh/install.ps1|iex"

    #nvim config
    git clone https://github.com/LazyVim/starter $env:LOCALAPPDATA\nvim

    #optional apps
    winget install voidtools.Everything
    winget install Vivaldi.Vivaldi 
};

New-Alias setup setup_Run;



#Fido downloads the latest windows iso from Microsoft, install to USB with Rufus
function DownloadWindowsInstaller_Run{

    Disk_Downloader_Script_URL="https://raw.githubusercontent.com/pbatard/Fido/master/Fido.ps1";
    Invoke-WebRequest Disk_Downloader_Script_URL -OutFile Fido.ps1
    . .\Fido.ps1 -Win 11
    winget install rufus
}

New-Alias DownloadWindowsInstaller  DownloadWindowsInstaller_Run;

# Windows11 default apps remover
# https://github.com/mikeroyal/Windows-11-Guide
function Win11Debloat_Run {
    git clone https://github.com/Raphire/Win11Debloat
    cd Win11Debloat
    powershell  -executionpolicy bypass -File .\Win11Debloat.ps1
}; 
New-Alias Win11Debloat Win11Debloat_Run;



#edit powershell config file 
function editConfigFile {
    notepad $PSHOME\Profile.ps1;
}; 
New-Alias config editConfigFile;

