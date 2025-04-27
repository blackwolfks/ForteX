
fx_version 'cerulean'
game 'gta5'

name 'ForteX'
description 'ForteX Remote Script Framework'
author 'ForteX Team'
version '1.0.0'

-- Server Scripts
server_script {
    'config.lua',
    'FiveM_ForteX.lua'
}

-- Client Scripts
client_script {
    'client/fortex_client_loader.lua'
}

-- Files to be downloaded with the resource
files {
    'ForteX_README.md'
}
