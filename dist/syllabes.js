/**
 * syllabes.js
 * @version 1.0.0
 * @link https://github.com/Komanaki/syllabesjs
 * @license MIT
 */
var Syllabes = (function () {
    function Syllabes() {
        /**
         * Default configuration values
         * @type {SyllabesConfig}
         */
        this.default_config = {
            offset: 0,
            syllable_precision: false,
            start_as_previous_end: false
        };
    }
    /**
     * Parse a subtitles file given a certain format and optionally some options
     * @param {string}         format      File format
     * @param {string}         file        File contents
     * @param {SyllabesConfig} user_config Options for the parsing
     */
    Syllabes.prototype.parse = function (format, file, user_config) {
        if (user_config === void 0) { user_config = null; }
        var config = (user_config !== null) ? user_config : {};
        // Add missing values in user config with the default config
        for (var key in this.default_config) {
            if (config[key] === undefined) {
                config[key] = this.default_config[key];
            }
        }
        // Ensure that the offset is a number in any case
        if (config.offset !== null && !isNaN(parseInt(config.offset + ''))) {
            config.offset = parseInt(config.offset + '');
        }
        else {
            config.offset = 0;
        }
        var parser = null;
        // Instanciate the right parser
        if (format.toLowerCase() == 'ultrastar') {
            parser = new UltrastarParser(config);
        }
        else if (['srt', 'subrip'].indexOf(format.toLowerCase()) > -1) {
            parser = new SubRipParser(config);
        }
        else if (['vtt', 'webvtt'].indexOf(format.toLowerCase()) > -1) {
            parser = new WebVTTParser(config);
        }
        // Stop if no parser was found for the asked file format
        if (parser == null) {
            console.error("Couldn't file any parser for the file format \"" + format + "\"");
            return null;
        }
        // Parse the file, destroy the parser and return the output
        var output = parser.parse(file);
        parser = null;
        return output;
    };
    return Syllabes;
}());
var SubRipParser = (function () {
    function SubRipParser(config) {
        this.config = config;
        this.track = [];
    }
    /**
     * Parse a SubRip file
     * @param {string} file SubRip file content
     */
    SubRipParser.prototype.parse = function (file) {
        // Let's parse the file line by line
        var lines = file.replace(/\r+/g, '').split('\n');
        var open = false; // If a sentence is being parsed or not
        var ID = 1; // Current sentence ID
        var text = ''; // Current sentence text
        var start = 0;
        var end = 0;
        var left = 0;
        var top = 0;
        var width = 0;
        var height = 0;
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
                }
                else {
                    text = this.parseText(line);
                }
            }
            // Close the current sentence if we encounter a blank line or if it's the end of the file
            if ((line.length == 0 || i == lines.length - 1) && open) {
                // Fix the first sentence start if the offset is negative
                if (this.config.offset < 0 && start < 0) {
                    start = 0;
                }
                var sentence = {
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
    };
    /**
     * Converts a SRT timecode into milliseconds
     * @param {string} timecode SRT timecode
     */
    SubRipParser.prototype.parseTimecode = function (timecode) {
        var parts = timecode.split(':');
        parts = parts.concat(parts.pop().split(','));
        return parseInt(parts[0]) * 3600000 + parseInt(parts[1]) * 60000 + parseInt(parts[2]) * 1000 + parseInt(parts[3]);
    };
    /**
     * Apply some modifications to a SRT text
     * @param {string} text SRT text
     */
    SubRipParser.prototype.parseText = function (text) {
        text = text.replace(/{(\/?[biu]{1})}/g, '<$1>');
        return text;
    };
    return SubRipParser;
}());
var UltrastarParser = (function () {
    function UltrastarParser(config) {
        this.config = config;
        this.meta = {
            title: null,
            artist: null,
            mp3: null,
            bpm: null,
            gap: 0,
            duet: false
        };
        this.track = [];
        this.track_duet = [];
    }
    /**
     * Parse an Ultrastar text file
     * @param {string} file Ultrastar text file content
     */
    UltrastarParser.prototype.parse = function (file) {
        // Let's parse the file line by line
        var lines = file.replace(/\r+/g, '').split('\n');
        var sentenceID = 1; // Current sentence ID
        var trackID = 1; // Current track ID
        var relative = false; // Relative or absolute beats notation for the syllables
        var beatsCount = 0; // Count of the elapsed beats
        var beatDuration = null; // Duration of a beat (milliseconds)
        var currentStart = null; // Start of the current sentence (milliseconds)
        var previousEnd = null; // End of the previous sentence (milliseconds)
        var syllables = []; // Syllables list of the current sentence
        // Parse each line of the file until the end (or a "E" line)
        for (var i = 0; i < lines.length; i++) {
            // Delete the trailing spaces
            var line = lines[i].replace(/^\s*/, '');
            // Ignore the line if it's empty
            if (line.replace(/\s*/g, '').length == 0) {
                continue;
            }
            // Metadata line
            if (line[0] == '#') {
                // Regex parsing of the line
                var matches = line.match(/(\w+):(.+)/);
                // Ignore the line if it's invalid
                if (matches == null || matches.length == 0) {
                    continue;
                }
                // Split of the regex result
                matches = matches[0].split(':');
                var keyword = matches[0].toLowerCase();
                var value = matches[1];
                // Float conversion of the BPM / GAP
                if (keyword == 'bpm' || keyword == 'gap') {
                    value = parseFloat(value.replace(',', '.'));
                }
                // Beat duration calculation from the BPM
                if (keyword == 'bpm') {
                    beatDuration = (60000) / (value * 4);
                }
                // Override the config offset if absent, and set the first sentence start as the GAP value
                if (keyword == 'gap') {
                    if (this.config.offset !== null) {
                        value += this.config.offset;
                    }
                    currentStart = value;
                }
                // Mark the syllables beat notation as relative
                if (keyword == 'relative' && value.toLowerCase() == 'yes') {
                    relative = true;
                }
                // Save the data if it isn't empty
                if (value != '') {
                    this.meta[keyword] = value;
                }
                continue;
            }
            // Player change or end of file when a sentence isn't finished
            if ((line == 'P2' || line == 'P 2' || line[0] == 'E') && syllables.length > 0) {
                // Create a new sentence
                var sentence = this.makeSentence(sentenceID, syllables, currentStart, null, previousEnd);
                if (currentStart != null) {
                    currentStart = null;
                }
                // Add the sentence to the current track
                if (trackID == 1) {
                    this.track.push(sentence);
                }
                else {
                    this.track_duet.push(sentence);
                }
                // Increment the sentence ID, reset the current sentence syllables
                sentenceID++;
                syllables = [];
            }
            // Lyrics player change
            if (line == 'P2' || line == 'P 2') {
                trackID = 2;
                this.meta.duet = true;
                continue;
            }
            // Syllable line
            if ([':', '*', 'F'].indexOf(line[0]) > -1) {
                // Regex parsing of the line
                var matches = line.match(/^[:*F] (\d+) (\d+) (-?\d+) (.+)/);
                // Ignore the line if it's invalid
                if (matches == null || matches.length == 0) {
                    continue;
                }
                var syllable = {
                    type: 'normal'
                };
                // Get the syllable text
                syllable.text = matches[0].split(' ').splice(4).join(' ');
                // Split of the regex result
                matches = matches[0].split(' ').splice(1, 3);
                // Add the start time of the syllable, with absolute or relative beats
                if (!relative) {
                    syllable.start = Math.floor(this.meta.gap + parseInt(matches[0]) * beatDuration);
                }
                else {
                    syllable.start = Math.floor(this.meta.gap + (beatsCount + parseInt(matches[0])) * beatDuration);
                }
                // Add the duration, end time, pitch
                syllable.duration = Math.floor(parseInt(matches[1]) * beatDuration);
                syllable.end = syllable.start + syllable.duration;
                syllable.pitch = parseInt(matches[2]);
                // Fix the first syllable start if the offset is negative
                if (this.meta.gap < 0 && syllable.start < 0) {
                    syllable.start = 0;
                    syllable.duration = syllable.end;
                }
                // Change the type for special syllables
                if (line[0] == '*') {
                    syllable.type = 'golden';
                }
                else if (line[0] == 'F') {
                    syllable.type = 'freestyle';
                }
                // Increment the total beats count with the syllable beats
                beatsCount += parseInt(matches[1]);
                // Add the syllable
                syllables.push(syllable);
            }
            // New line mark
            if (line[0] == '-') {
                // Regex parsing of the line
                var matches = line.match(/^- (\d+)\s?(\d+)/);
                // Ignore the line if it's invalid
                if (matches == null || matches.length == 0) {
                    continue;
                }
                // Split of the regex result
                matches = matches[0].split(' ').splice(1);
                var currentEnd = null;
                // Add the end time of the sentence, with absolute or relative beats
                if (!relative) {
                    currentEnd = Math.floor(this.meta.gap + parseInt(matches[0]) * beatDuration);
                }
                else {
                    currentEnd = Math.floor(this.meta.gap + (beatsCount + parseInt(matches[0])) * beatDuration);
                }
                // Fix the first sentence start if the offset is negative
                if (this.meta.gap < 0 && currentStart < 0) {
                    currentStart = 0;
                }
                // Create a new sentence
                var sentence = this.makeSentence(sentenceID, syllables, currentStart, currentEnd, previousEnd);
                if (currentStart != null) {
                    currentStart = null;
                }
                // Save the sentence end time for possible use on the next sentence
                previousEnd = sentence.end;
                // Save the start time of the next sentence if it's present on the line, with absolute or relative beats
                if (matches[1] !== undefined) {
                    if (!relative) {
                        currentStart = Math.floor(this.config.offset + parseInt(matches[1]) * beatDuration);
                        beatsCount = parseInt(matches[1]);
                    }
                    else {
                        currentStart = Math.floor(this.config.offset + (beatsCount + parseInt(matches[1])) * beatDuration);
                        beatsCount += parseInt(matches[1]);
                    }
                }
                // Add the sentence to the current track
                if (trackID == 1) {
                    this.track.push(sentence);
                }
                else {
                    this.track_duet.push(sentence);
                }
                // Increment the sentence ID, reset the current sentence syllables
                sentenceID++;
                syllables = [];
            }
            // End of file
            if (line[0] == 'E') {
                break;
            }
        }
        return {
            meta: this.meta,
            track: this.track,
            track_duet: (this.track_duet.length > 0) ? this.track_duet : null
        };
    };
    /**
     * Make a new sentence
     * @param {number} id          ID of the sentence
     * @param {any[]}  syllables   Syllables list of the sentence
     * @param {number} start       Start time of the sentence
     * @param {number} end         End time of the sentence
     * @param {number} previousEnd End time of the previous sentence
     */
    UltrastarParser.prototype.makeSentence = function (id, syllables, start, end, previousEnd) {
        var sentence = {
            id: id,
            start: syllables[0].start,
            end: syllables[syllables.length - 1].end
        };
        // Insert sentence syllables as objects or as a string
        if (this.config.syllable_precision) {
            sentence.syllables = syllables;
        }
        else {
            sentence.text = '';
            for (var j = 0; j < syllables.length; j++) {
                sentence.text += syllables[j].text;
            }
        }
        // Add the start of the sentence if it was present on the last "sentence end" line
        if (start != null) {
            sentence.start = start;
        }
        else if (previousEnd != null && this.config.start_as_previous_end) {
            sentence.start = previousEnd;
        }
        // Add the end of the sentence if any
        if (end != null) {
            sentence.end = end;
        }
        // Set the duration with start and end
        sentence.duration = sentence.end - sentence.start;
        return sentence;
    };
    return UltrastarParser;
}());
var WebVTTParser = (function () {
    function WebVTTParser(config) {
        this.config = config;
        this.track = [];
        this.style = [];
    }
    /**
     * Parse a WebVTT file
     * @param {string} file WebVTT file content
     */
    WebVTTParser.prototype.parse = function (file) {
        // Let's parse the file line by line
        var lines = file.replace(/\r+/g, '').split('\n');
        var comment = false; // If a comment is being parsed or not
        var open = false; // If a sentence is being parsed or not
        var ID = 1; // Current sentence ID
        var text = ''; // Current sentence text
        var start = 0;
        var end = 0;
        var left = 0;
        var top = 0;
        var width = 0;
        var height = 0;
        if (lines[0] != 'WEBVTT') {
            console.error("The given file is not a WebVTT document.");
            return null;
        }
        // Parse each line of the file until the end
        for (var i = 0; i < lines.length; i++) {
            // Delete the trailing spaces
            var line = lines[i].replace(/^\s*/, '');
            // Ignore the next lines if it's a comment
            if (line.substr(0, 4) == 'NOTE') {
                comment = true;
                continue;
            }
            // Close the comment
            if (line.length == 0 && comment) {
                comment = false;
                continue;
            }
            // Ignore if we're in comment mode
            if (comment) {
                continue;
            }
            // Save the CSS rule
            if (line.substr(0, 5) == '::cue') {
                this.style.push(this.parseStyle(line));
                continue;
            }
            // If this isn't the last line of the file...
            if (i < lines.length - 1) {
                var matchNextDuration = lines[i + 1].match(/^\d{2}:\d{2}:\d{2}.\d{3} --> \d{2}:\d{2}:\d{2}.\d{3}/);
                // If we're not parsing a sentence and we get something before a duration line, then it's a sentence ID
                if (line.length > 0 && matchNextDuration != null && matchNextDuration.length > 0 && !open) {
                    open = true;
                    ID = line;
                    continue;
                }
            }
            // Check if it's a sentence duration
            var matchDuration = line.match(/^\d{2}:\d{2}:\d{2}.\d{3} --> \d{2}:\d{2}:\d{2}.\d{3}/);
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
                }
                else {
                    text = this.parseText(line);
                }
            }
            // Close the current sentence if we encounter a blank line or if it's the end of the file
            if ((line.length == 0 || i == lines.length - 1) && open) {
                // Fix the first sentence start if the offset is negative
                if (this.config.offset < 0 && start < 0) {
                    start = 0;
                }
                var sentence = {
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
                ID = (typeof ID == 'number') ? ID++ : ID;
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
            track: this.track,
            style: this.style
        };
    };
    /**
     * Converts a SRT timecode into milliseconds
     * @param {string} timecode SRT timecode
     */
    WebVTTParser.prototype.parseTimecode = function (timecode) {
        var parts = timecode.split(':');
        parts = parts.concat(parts.pop().split('.'));
        return parseInt(parts[0]) * 3600000 + parseInt(parts[1]) * 60000 + parseInt(parts[2]) * 1000 + parseInt(parts[3]);
    };
    /**
     * Apply some modifications to a SRT text
     * @param {string} text SRT text
     */
    WebVTTParser.prototype.parseText = function (text) {
        text = text.replace(/{(\/?[biu]{1})}/g, '<$1>');
        return text;
    };
    /**
     * Parse a WebVTT-specific style to be used in a HTML document
     * @param {string} style CSS stylesheet content
     */
    WebVTTParser.prototype.parseStyle = function (style) {
        // TODO
        return style;
    };
    return WebVTTParser;
}());

//# sourceMappingURL=maps/syllabes.js.map
