const fs = require('fs');
const path = require('path');

const modulePath = path.join(__dirname, '..', 'node_modules', 'react-native-track-player', 'android', 'src', 'main', 'java', 'com', 'doublesymmetry', 'trackplayer', 'module', 'MusicModule.kt');

if (fs.existsSync(modulePath)) {
    let content = fs.readFileSync(modulePath, 'utf8');

    // Fix line 548
    content = content.replace(
        'callback.resolve(Arguments.fromBundle(musicService.tracks[index].originalItem))',
        `val item = musicService.tracks[index].originalItem\n            if (item != null) {\n                callback.resolve(Arguments.fromBundle(item))\n            } else {\n                callback.resolve(null)\n            }`
    );

    // Fix line 588 (getActiveTrack)
    content = content.replace(
        'callback.resolve(\n            if (musicService.tracks.isEmpty()) null\n            else Arguments.fromBundle(\n                musicService.tracks[musicService.getCurrentTrackIndex()].originalItem\n            )\n        )',
        `if (musicService.tracks.isEmpty()) {\n            callback.resolve(null)\n        } else {\n            val item = musicService.tracks[musicService.getCurrentTrackIndex()].originalItem\n            if (item != null) {\n                callback.resolve(Arguments.fromBundle(item))\n            } else {\n                callback.resolve(null)\n            }\n        }`
    );
    
    // Fix getQueue
    content = content.replace(
        'callback.resolve(Arguments.fromList(musicService.tracks.map { it.originalItem }))',
        'callback.resolve(Arguments.fromList(musicService.tracks.map { it.originalItem ?: android.os.Bundle() }))'
    );

    fs.writeFileSync(modulePath, content, 'utf8');
    console.log('Successfully patched react-native-track-player Kotlin files.');
} else {
    console.log('Could not find MusicModule.kt to patch.');
}
