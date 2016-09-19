/**
 * syllabes.js
 * @version 1.0.0
 * @link https://github.com/Komanaki/syllabesjs
 * @license MIT
 */

class Syllabes {

	/**
	 * Default configuration values
	 * @type {SyllabesConfig}
	 */
	private default_config: SyllabesConfig = {
		offset: 0,
		syllable_precision: false,
		start_as_previous_end: false
	};

	/**
	 * Parse a subtitles file given a certain format and optionally some options
	 * @param {string}         format      File format
	 * @param {string}         file        File contents
	 * @param {SyllabesConfig} user_config Options for the parsing
	 */
	public parse(format: string, file: string, user_config: SyllabesConfig = null) {

		var config: SyllabesConfig = (user_config !== null) ? user_config : {};

		// Add missing values in user config with the default config
		for (var key in this.default_config) {
			if (config[key] === undefined) {
				config[key] = this.default_config[key];
			}
		}

		// Ensure that the offset is a number in any case
		if (config.offset !== null && !isNaN(parseInt(config.offset + ''))) {
			config.offset = parseInt(config.offset + '');
		} else {
			config.offset = 0;
		}

		var parser: Parser = null;

		// Instanciate the right parser
		if (format.toLowerCase() == 'ultrastar') {
			parser = new UltrastarParser(config);
		} else if (['srt', 'subrip'].indexOf(format.toLowerCase()) > -1) {
			parser = new SubRipParser(config);
		} else if (['vtt', 'webvtt'].indexOf(format.toLowerCase()) > -1) {
			parser = new WebVTTParser(config);
		}

		// Stop if no parser was found for the asked file format
		if (parser == null) {
			console.error(`Couldn't file any parser for the file format "${format}"`);
			return null;
		}

		// Parse the file, destroy the parser and return the output
		var output = parser.parse(file);
		parser = null;
		return output;
	}
}