
// | Value | Description                                               |
// |-------|-----------------------------------------------------------|
// | `0`   | **Highest Quality**: Produces the best audio quality. Suitable for music and critical listening. |
// | `1`   | **Very High Quality**: Slightly lower than the absolute highest but still offers excellent sound quality. |
// | `2`   | **High Quality**: Good fidelity, suitable for most applications, including music. |
// | `3`   | **Good Quality**: A balance between quality and file size. Typically adequate for casual listening. |
// | `4`   | **Moderate Quality**: Acceptable quality for background audio or less critical applications. |
// | `5`   | **Lower Quality**: Noticeable compression effects; suitable for speech or similar use cases. |
// | `6`   | **Low Quality**: More compression; suitable for voice recordings or less critical audio. |
// | `7`   | **Fair Quality**: Often used for larger-scale voice recordings where fidelity isn't critical. |
// | `8`   | **Poor Quality**: Minimal effective quality; may be used for tiny files where audio clarity isn't a priority. |
// | `9`   | **Lowest Quality**: Significant loss of fidelity; generally not preferable but can be used for very low bitrate requirements. |

// Values 0-5: Generally used for music and high-fidelity audio applications.
// Values 6-9: More appropriate for spoken audio, background effects, or when file size is a priority over quality.

export default {
  // Archival quality - preserve everything
  highQuality: (src, out) => [
    '-hide_banner', '-loglevel', 'error',
    '-i', src,
    '-c:a', 'libmp3lame', // This specifies the audio codec to use for the output file. libmp3lame is the codec to create MP3 audio files. So, you're choosing to convert the audio to the MP3 format.
    '-q:a', '5', // Determines the quality. Set the audio quality (codec-specific, VBR). 0 is the highest quality setting for audio. It instructs FFmpeg to allocate as much bitrate as needed to achieve the best audio quality.
    '-ar', '48000', // This option specifies the audio sample rate, which is how many samples of audio are captured every second.
    '-af', 'aresample=resampler=soxr:precision=33:dither_method=triangular',
    '-y', out
  ],

  // High quality - transparent to most ears
  quality: (src, out) => [
    '-hide_banner', '-loglevel', 'error',
    '-i', src,
    '-c:a', 'libmp3lame', // This specifies the audio codec to use for the output file. libmp3lame is the codec to create MP3 audio files. So, you're choosing to convert the audio to the MP3 format.
    '-q:a', '6', // Determines the quality. 0-5: Generally used for music, 6-9: More appropriate for spoken audio,
    '-b:a', '192k', // This sets the audio bitrate, which affects the quality and size of the audio file.
    '-ar', '44100', // This option specifies the audio sample rate, which is how many samples of audio are captured every second.
    '-af', 'aresample=resampler=soxr:precision=28:dither_method=triangular',
    '-y', out
  ],

  // Balanced - good quality, reasonable size (default)
  balanced: (src, out) => [
    '-hide_banner', '-loglevel', 'error',
    '-i', src,
    '-c:a', 'libmp3lame', // This specifies the audio codec to use for the output file. libmp3lame is the codec to create MP3 audio files. So, you're choosing to convert the audio to the MP3 format.
    '-q:a', '7', // Determines the quality. 0-5: Generally used for music, 6-9: More appropriate for spoken audio,
    '-ar', '44100', // This option specifies the audio sample rate, which is how many samples of audio are captured every second.
    '-af', 'aresample=resampler=soxr:precision=24',
    '-y', out
  ],

  // Speed optimized - smaller file, still clear
  speed: (src, out) => [
    '-hide_banner', '-loglevel', 'error',
    '-i', src,
    '-c:a', 'libmp3lame', // This specifies the audio codec to use for the output file. libmp3lame is the codec to create MP3 audio files. So, you're choosing to convert the audio to the MP3 format.
    '-q:a', '7', // Determines the quality. 0-5: Generally used for music, 6-9: More appropriate for spoken audio,
    '-b:a', '128k', // This sets the audio bitrate, which affects the quality and size of the audio file.
    '-ar', '44100', // This option specifies the audio sample rate, which is how many samples of audio are captured every second.
    '-af', 'aresample=resampler=soxr:precision=20',
    '-y', out
  ],

  // Fast encoding - acceptable quality
  fast: (src, out) => [
    '-hide_banner', '-loglevel', 'error',
    '-i', src,
    '-c:a', 'libmp3lame', // This specifies the audio codec to use for the output file. libmp3lame is the codec to create MP3 audio files. So, you're choosing to convert the audio to the MP3 format.
    '-q:a', '8', // Determines the quality. 0-5: Generally used for music, 6-9: More appropriate for spoken audio,
    '-b:a', '96k', // This sets the audio bitrate, which affects the quality and size of the audio file.
    '-ar', '22050', // This option specifies the audio sample rate, which is how many samples of audio are captured every second.
    '-af', 'aresample=resampler=soxr',
    '-y', out
  ],

  // AM radio nostalgia - lo-fi aesthetic
  am: (src, out) => [
    '-hide_banner', '-loglevel', 'error',
    '-i', src,
    '-c:a', 'libmp3lame', // This specifies the audio codec to use for the output file. libmp3lame is the codec to create MP3 audio files. So, you're choosing to convert the audio to the MP3 format.
    '-q:a', '9', // Determines the quality. 0-5: Generally used for music, 6-9: More appropriate for spoken audio,
    '-b:a', '32k', // This sets the audio bitrate, which affects the quality and size of the audio file.
    '-ar', '22050', // This option specifies the audio sample rate, which is how many samples of audio are captured every second.
    '-ac', '1', // 	This defines the number of audio channels. 1 means you're using mono audio, which means all audio will come from a single channel, as opposed to stereo, which has two channels (left and right).
    '-af', 'highpass=f=300,lowpass=f=3000,aresample=resampler=soxr',
    '-y', out
  ],

  // Tiny - for when size matters most
  tiny: (src, out) => [
    '-hide_banner', '-loglevel', 'error',
    '-i', src,
    '-c:a', 'libmp3lame', // This specifies the audio codec to use for the output file. libmp3lame is the codec to create MP3 audio files. So, you're choosing to convert the audio to the MP3 format.
    '-q:a', '9', // Determines the quality. 0-5: Generally used for music, 6-9: More appropriate for spoken audio,
    '-b:a', '22k', // This sets the audio bitrate, which affects the quality and size of the audio file.
    '-ar', '8000', // This option specifies the audio sample rate, which is how many samples of audio are captured every second.
    '-ac', '1', // 	This defines the number of audio channels. 1 means you're using mono audio, which means all audio will come from a single channel, as opposed to stereo, which has two channels (left and right).
    '-af', 'highpass=f=300,lowpass=f=3000,aresample=resampler=soxr',
    '-y', out
  ],
};
