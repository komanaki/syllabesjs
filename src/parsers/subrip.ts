
class SubRipParser implements Parser {

	config: SyllabesConfig;
	track: any[];

	constructor(config: SyllabesConfig) {
		this.config = config;
		this.track = [];
	}

	/**
	 * Parse a SubRip file
	 * @param {string} file SubRip file content
	 */
	parse(file: string) {

		// Let's parse the file line by line
		var lines = file.replace(/\r+/g, '').split('\n');

		var open: boolean = false;	// If a sentence is being parsed or not
		var ID: number = 1;			// Current sentence ID
		var text: string = '';		// Current sentence text
		var start = 0;
		var end: number = 0;
		var left: number = 0;
		var top: number = 0;
		var width: number = 0;
		var height: number = 0;

		// Parse each line of the file until the end
		for (var i = 0; i < lines.length; i++) {

			// Delete the trailing spaces
			var line = lines[i].replace(/^\s*/, '');

			// Check if it's an ID
			var matchID = line.match(/^(\d+)$/);

			if (matchID != null && matchID.length > 0) {
				open = true;
				ID = parseInt(matchID[0]);
				continue;
			}

			// Check if it's a sentence duration
			var matchDuration = line.match(/^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/);

			if (matchDuration != null && matchDuration.length > 0) {
				if (!open) {
					open = true;
				}

				// Check if there's coordinates and add them to the sentence if present
				var matchPos = line.match(/X1:(\d+) X2:(\d+) Y1:(\d+) Y2:(\d+)$/);
				if (matchPos != null && matchPos.length > 0) {
					left = parseInt(matchPos[1]);
					width = parseInt(matchPos[2]) - left;
					top = parseInt(matchPos[3]);
					height = parseInt(matchPos[4]) - top;
				}

				matchDuration = matchDuration[0].split(' --> ');
				start = this.parseTimecode(matchDuration[0]) + this.config.offset;
				end = this.parseTimecode(matchDuration[1]) + this.config.offset;

				continue;
			}

			// Add a text line if it's not empty and a sentence is open
			if (line.length > 0 && open) {
				if (text.length > 0) {
					text += '<br>' + this.parseText(line);
				} else {
					text = this.parseText(line);
				}
			}

			// Close the current sentence if we encounter a blank line or if it's the end of the file
			if ((line.length == 0 || i == lines.length - 1) && open) {
				// Fix the first sentence start if the offset is negative
				if (this.config.offset < 0 && start < 0) {
					start = 0;
				}

				var sentence: Sentence = {
					id: ID,
					start: start,
					end: end,
					duration: end - start,
					text: text
				};

				// Add the sentence coordinates if they're not empty
				if (left != 0 && top != 0) {
					sentence.position = {
						left: left,
						top: top,
						width: width,
						height: height
					};
				}

				// Add the sentence to the track
				this.track.push(sentence);

				// Reset the sentence variables
				open = false;
				ID++;
				text = '';
				start = 0;
				end = 0;
				left = 0;
				top = 0;
				width = 0;
				height = 0;
				continue;
			}
		}

		return {
			track: this.track
		};
	}

	/**
	 * Converts a SRT timecode into milliseconds
	 * @param {string} timecode SRT timecode
	 */
	private parseTimecode(timecode: string) {
		var parts = timecode.split(':');
		parts = parts.concat(parts.pop().split(','));
		return parseInt(parts[0]) * 3600000 + parseInt(parts[1]) * 60000 + parseInt(parts[2]) * 1000 + parseInt(parts[3]);
	}

	/**
	 * Apply some modifications to a SRT text
	 * @param {string} text SRT text
	 */
	private parseText(text: string) {
		text = text.replace(/{(\/?[biu]{1})}/g, '<$1>');
		return text;
	}
}